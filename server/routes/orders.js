// ======================================================================
// API ĐƠN HÀNG (phía khách)
//   POST /api/orders                     đặt hàng từ giỏ (F05, F47)
//   GET  /api/orders                     đơn của tôi (F07)
//   POST /api/orders/:id/cancel          tự hủy khi còn Chờ xác nhận
//   POST /api/order-items/:id/review     đánh giá người bán sau khi đơn hoàn thành (F56)
// ======================================================================
const express = require("express");
const { db, transaction, nowIso } = require("../db");
const { ApiError } = require("../errors");
const { requireLogin } = require("../session");
const { findProduct, getStock } = require("../products");
const c = require("../consign");
const o = require("../orders");
const v = require("../validate");

const router = express.Router();

// ---------- F05 + F47: Đặt hàng ----------
router.post("/orders", requireLogin, (req, res) => {
  const body = req.body;
  const clientKey = String(body.clientKey || "");
  if (!/^[A-Za-z0-9-]{8,64}$/.test(clientKey)) throw new ApiError(400, "Thiếu mã đặt hàng, hãy tải lại trang.");

  // Bấm "Đặt hàng" hai lần (cùng clientKey) → trả lại đơn đã tạo, không tạo đơn thứ hai
  const existing = db.prepare("SELECT * FROM orders WHERE user_id = ? AND client_key = ?").get(req.user.id, clientKey);
  if (existing) return res.json({ order: o.orderView(existing, false), duplicate: true });

  const recipientName = v.cleanText(body.recipientName, { field: "recipientName", label: "Họ tên người nhận", min: 2, max: 60 });
  const phone = String(body.phone || "").replace(/[\s.]/g, "");
  if (!/^(0|\+84)\d{9}$/.test(phone)) throw new ApiError(400, "Số điện thoại gồm 10 số, bắt đầu bằng 0.", { field: "phone" });
  const delivery = body.delivery === "pickup" ? "pickup" : "ship";
  const address = delivery === "ship" ? v.cleanText(body.address, { field: "address", label: "Địa chỉ giao hàng", min: 10, max: 200 }) : "";
  const payment = body.payment === "transfer" ? "transfer" : "cod";

  const inputItems = Array.isArray(body.items) ? body.items : [];
  if (!inputItems.length || inputItems.length > 50) throw new ApiError(400, "Giỏ hàng đang trống.");

  const order = transaction(() => {
    const lines = [];
    const seenListings = new Set();

    for (const item of inputItems) {
      if (item.type === "listing") {
        // Tin ký gửi: số lượng luôn là 1, giá lấy từ server
        const row = c.findListing(item.id);
        const code = c.listingCode(row.id);
        if (seenListings.has(row.id)) continue;
        seenListings.add(row.id);
        if (row.seller_id === req.user.id) throw new ApiError(400, `${code} là tin của chính bạn.`);
        let price;
        if (row.status === "active") price = row.list_price;
        else if (row.status === "held" && row.hold_buyer_id === req.user.id) price = row.hold_price; // giá đã chốt khi trả giá (F55)
        else throw new ApiError(409, `Tin ký gửi ${code} (${row.card_name}) không còn bán. Hãy xóa khỏi giỏ.`, { code: "LISTING_UNAVAILABLE", data: { listingId: row.id } });
        lines.push({ kind: "listing", listingId: row.id, name: `${row.card_name} · ${row.card_number} (${code})`, image: row.image, price, quantity: 1 });
      } else {
        // Sản phẩm của shop: giá lấy từ js/data/products.js, không tin giá trình duyệt gửi
        const product = findProduct(item.id);
        const quantity = Number(item.quantity);
        if (!product) throw new ApiError(400, "Có sản phẩm không còn tồn tại trong giỏ.");
        if (!Number.isInteger(quantity) || quantity < 1) throw new ApiError(400, "Số lượng không hợp lệ.");
        const stock = getStock(product.id);
        if (quantity > stock) throw new ApiError(409, `"${product.name}" chỉ còn ${stock} sản phẩm.`);
        lines.push({ kind: "product", productId: product.id, name: product.name, image: product.image, price: product.price, quantity });
      }
    }
    if (!lines.length) throw new ApiError(400, "Giỏ hàng đang trống.");

    const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
    const shippingFee = delivery === "ship" ? o.SHIPPING_FEE : 0;
    const now = nowIso();
    const result = db
      .prepare(
        `INSERT INTO orders (user_id, client_key, recipient_name, phone, delivery, address, payment, subtotal, shipping_fee, total, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(req.user.id, clientKey, recipientName, phone, delivery, address, payment, subtotal, shippingFee, subtotal + shippingFee, now, now);
    const orderId = Number(result.lastInsertRowid);

    const insertItem = db.prepare(
      "INSERT INTO order_items (order_id, kind, product_id, listing_id, name, image, price, quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const line of lines) {
      insertItem.run(orderId, line.kind, line.productId || null, line.listingId || null, line.name, line.image, line.price, line.quantity);
      // F47: có đơn thì tin bị giữ
      if (line.kind === "listing") db.prepare("UPDATE listings SET status = 'reserved', order_id = ? WHERE id = ?").run(orderId, line.listingId);
    }
    return db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  });

  res.status(201).json({ order: o.orderView(order, false) });
});

// ---------- F07: Đơn của tôi ----------
router.get("/orders", requireLogin, (req, res) => {
  const orders = db.prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC").all(req.user.id);
  res.json({ orders: orders.map((order) => o.orderView(order, false)) });
});

function findOwnOrder(id, user) {
  const order = o.findOrder(id);
  if (order.user_id !== user.id) throw new ApiError(403, "Bạn chỉ xem được đơn hàng của chính mình.");
  return order;
}

router.post("/orders/:id/cancel", requireLogin, (req, res) => {
  const order = findOwnOrder(req.params.id, req.user);
  if (order.status !== "pending") throw new ApiError(400, "Đơn đã được shop xác nhận, hãy liên hệ shop để hủy.");
  o.cancelOrder(order, "");
  res.json({ ok: true });
});

// ---------- F56: Đánh giá người bán ----------
router.post("/order-items/:id/review", requireLogin, (req, res) => {
  const itemId = v.toPositiveInt(req.params.id);
  const item = itemId && db.prepare("SELECT * FROM order_items WHERE id = ?").get(itemId);
  if (!item) throw new ApiError(404, "Không tìm thấy dòng đơn này.");
  const order = findOwnOrder(item.order_id, req.user);
  if (item.kind !== "listing") throw new ApiError(400, "Chỉ đánh giá được người bán của thẻ ký gửi.");
  if (order.status !== "completed") throw new ApiError(400, "Đơn hoàn thành mới đánh giá được người bán.");
  if (db.prepare("SELECT 1 FROM seller_reviews WHERE order_item_id = ?").get(item.id)) {
    throw new ApiError(409, "Bạn đã đánh giá thẻ này rồi.");
  }

  const stars = Number(req.body.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new ApiError(400, "Hãy chọn từ 1 đến 5 sao.", { field: "stars" });
  const comment = v.cleanText(req.body.comment, { field: "comment", label: "Nhận xét", min: 0, max: 500 });
  const listing = db.prepare("SELECT seller_id FROM listings WHERE id = ?").get(item.listing_id);

  db.prepare(
    "INSERT INTO seller_reviews (order_item_id, listing_id, seller_id, buyer_id, stars, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(item.id, item.listing_id, listing.seller_id, req.user.id, stars, comment, nowIso());
  res.status(201).json({ ok: true });
});

module.exports = router;
