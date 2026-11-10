// ======================================================================
// NGHIỆP VỤ ĐƠN HÀNG (F05, F20, F47) — dùng chung cho khách và Admin
// Trạng thái (business-workflow, PB13):
//   Giao hàng:           pending → confirmed → shipping → completed
//   Nhận tại cửa hàng:   pending → confirmed → ready    → completed
//   cancelled: khách hủy khi còn pending; admin hủy trước khi hoàn thành
// Quy tắc tồn kho (PB12): xác nhận đơn mới trừ kho; thiếu hàng thì không xác nhận được;
// hủy đơn đã trừ kho thì hoàn kho đúng một lần (cột stock_deducted).
// Tin ký gửi (F47): đặt hàng → tin "reserved" (giữ thẻ); xác nhận → "sold"; hủy → bán lại.
// ======================================================================
const { db, transaction, nowIso } = require("./db");
const { ApiError } = require("./errors");
const { getStock } = require("./products");
const { commissionFor } = require("./consign");

const SHIPPING_FEE = 30000;

const STATUS_LABELS = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  ready: "Chờ nhận tại cửa hàng",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

function orderCode(id) {
  return "DH-" + String(id).padStart(5, "0");
}

function findOrder(id) {
  const orderId = Number(String(id).replace(/^DH-?/i, ""));
  const order = Number.isInteger(orderId) && orderId > 0 && db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  if (!order) throw new ApiError(404, "Không tìm thấy đơn hàng này.");
  return order;
}

function orderItems(orderId) {
  return db.prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY id").all(orderId);
}

// Dữ liệu đơn gửi ra giao diện. withCustomer = true khi Admin xem (có SĐT, địa chỉ).
function orderView(order, withCustomer) {
  const items = orderItems(order.id).map((item) => {
    const review = item.kind === "listing" ? db.prepare("SELECT stars FROM seller_reviews WHERE order_item_id = ?").get(item.id) : null;
    return {
      id: item.id,
      kind: item.kind,
      productId: item.product_id,
      listingId: item.listing_id,
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      reviewed: Boolean(review),
      canReview: item.kind === "listing" && order.status === "completed" && !review,
    };
  });
  const view = {
    id: order.id,
    code: orderCode(order.id),
    status: order.status,
    statusLabel: STATUS_LABELS[order.status],
    paymentStatus: order.payment_status,
    paymentLabel: order.payment_status === "paid" ? "Đã thanh toán" : "Chưa thanh toán",
    delivery: order.delivery,
    payment: order.payment,
    subtotal: order.subtotal,
    shippingFee: order.shipping_fee,
    total: order.total,
    adminNote: order.admin_note,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    items,
    canCancel: order.status === "pending",
  };
  if (withCustomer) {
    Object.assign(view, { recipientName: order.recipient_name, phone: order.phone, address: order.address, userId: order.user_id });
  }
  return view;
}

function setStatus(orderId, status, extraSql = "", extraParams = []) {
  db.prepare(`UPDATE orders SET status = ?, updated_at = ?${extraSql} WHERE id = ?`).run(status, nowIso(), ...extraParams, orderId);
}

// ---------- Admin xác nhận đơn: kiểm tra và trừ kho, tin ký gửi chuyển "Đã bán" ----------
function confirmOrder(order) {
  if (order.status !== "pending") throw new ApiError(400, "Chỉ xác nhận được đơn đang Chờ xác nhận.");
  const items = orderItems(order.id);

  transaction(() => {
    for (const item of items.filter((i) => i.kind === "product")) {
      const stock = getStock(item.product_id);
      if (stock < item.quantity) {
        throw new ApiError(409, `Không đủ hàng: "${item.name}" chỉ còn ${stock}. Hãy liên hệ khách hoặc hủy đơn.`);
      }
      db.prepare("UPDATE product_stock SET stock = stock - ? WHERE product_id = ?").run(item.quantity, item.product_id);
    }
    for (const item of items.filter((i) => i.kind === "listing")) {
      const money = commissionFor(item.price); // hoa hồng tính trên giá bán cuối cùng (F55)
      db.prepare(
        "UPDATE listings SET status = 'sold', final_price = ?, commission = ?, payout = ?, sold_at = ? WHERE id = ? AND order_id = ?"
      ).run(item.price, money.commission, money.payout, nowIso(), item.listing_id, order.id);
    }
    setStatus(order.id, "confirmed", ", stock_deducted = 1");
  });
}

// ---------- Chuyển bước: Đã xác nhận → Đang giao / Chờ nhận → Hoàn thành ----------
function advanceOrder(order) {
  if (order.status === "confirmed") {
    setStatus(order.id, order.delivery === "ship" ? "shipping" : "ready");
  } else if (order.status === "shipping" || order.status === "ready") {
    // COD: nhận hàng là trả tiền → đánh dấu đã thanh toán
    const paid = order.payment === "cod" ? ", payment_status = 'paid'" : "";
    setStatus(order.id, "completed", paid);
  } else {
    throw new ApiError(400, `Đơn ở trạng thái "${STATUS_LABELS[order.status]}" không chuyển tiếp được.`);
  }
}

// ---------- Hủy đơn: hoàn kho đúng một lần, tin ký gửi quay lại bán ----------
function cancelOrder(order, note) {
  if (order.status === "completed" || order.status === "cancelled") {
    throw new ApiError(400, `Không hủy được đơn ở trạng thái "${STATUS_LABELS[order.status]}".`);
  }
  if (order.payment_status === "paid" && !note) {
    throw new ApiError(400, "Đơn đã thanh toán: cần ghi chú cách hoàn tiền cho khách.", { field: "note" });
  }
  const items = orderItems(order.id);

  transaction(() => {
    if (order.stock_deducted) {
      for (const item of items.filter((i) => i.kind === "product")) {
        db.prepare("UPDATE product_stock SET stock = stock + ? WHERE product_id = ?").run(item.quantity, item.product_id);
      }
    }
    for (const item of items.filter((i) => i.kind === "listing")) {
      // Tin quay về "Đang bán" (hoặc "Hết hạn niêm yết" nếu đã quá 60 ngày)
      db.prepare(
        `UPDATE listings SET
           status = CASE WHEN list_expires_at < ? THEN 'expired_listing' ELSE 'active' END,
           order_id = NULL, final_price = NULL, commission = NULL, payout = NULL, sold_at = NULL,
           hold_buyer_id = NULL, hold_price = NULL, hold_until = NULL
         WHERE id = ? AND order_id = ? AND status IN ('reserved', 'sold')`
      ).run(nowIso(), item.listing_id, order.id);
    }
    const noteSql = note ? ", admin_note = ?" : "";
    setStatus(order.id, "cancelled", ", stock_deducted = 0" + noteSql, note ? [note] : []);
  });
}

module.exports = { SHIPPING_FEE, STATUS_LABELS, orderCode, findOrder, orderItems, orderView, confirmOrder, advanceOrder, cancelOrder };
