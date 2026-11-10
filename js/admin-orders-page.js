// ======================================================================
// QUẢN LÝ ĐƠN HÀNG (F20) — admin-orders.html, chỉ Admin
//   Chờ xác nhận → [Xác nhận: kiểm tra + trừ kho] → Đã xác nhận → Đang giao / Chờ nhận tại cửa hàng → Hoàn thành
//   Hủy: hoàn kho đúng một lần; đơn đã thanh toán phải ghi chú hoàn tiền.
// Quyền Admin được kiểm tra ở server; trang này chỉ hiện nút cho tiện.
// ======================================================================
const adminOrdersBox = document.getElementById("admin-orders");
let orderFilter = "";

const NEXT_STEP_LABEL = { confirmed: "", shipping: "Hoàn thành (đã giao)", ready: "Hoàn thành (khách đã nhận)" };

function adminOrderHtml(order) {
  const actions = [];
  if (order.status === "pending") actions.push('<button type="button" class="btn btn--primary btn--sm" data-action="confirm" data-id="' + order.id + '">Xác nhận (trừ kho)</button>');
  if (order.status === "confirmed") {
    actions.push('<button type="button" class="btn btn--primary btn--sm" data-action="advance" data-id="' + order.id + '">' + (order.delivery === "ship" ? "Bắt đầu giao" : "Sẵn sàng tại cửa hàng") + "</button>");
  }
  if (order.status === "shipping" || order.status === "ready") {
    actions.push('<button type="button" class="btn btn--primary btn--sm" data-action="advance" data-id="' + order.id + '">' + NEXT_STEP_LABEL[order.status] + "</button>");
  }
  if (order.paymentStatus !== "paid" && order.status !== "cancelled") actions.push('<button type="button" class="btn btn--soft btn--sm" data-action="paid" data-id="' + order.id + '">Đã nhận tiền</button>');
  if (order.status !== "completed" && order.status !== "cancelled") actions.push('<button type="button" class="btn btn--soft btn--sm btn--danger" data-action="cancel" data-id="' + order.id + '">Hủy đơn</button>');

  return (
    '<article class="order-card">' +
    '<header class="order-card__head"><div><p class="order-card__code mono">' + escapeHtml(order.code) + "</p>" +
    '<p class="order-card__date">' + formatDateTime(order.createdAt) + "</p></div>" +
    '<div class="order-card__status"><span class="status status--' + order.status + '">' + escapeHtml(order.statusLabel) + "</span>" +
    '<span class="status status--' + (order.paymentStatus === "paid" ? "completed" : "pending") + '">' + escapeHtml(order.paymentLabel) + "</span></div></header>" +
    '<dl class="order-card__customer">' +
    "<div><dt>Người nhận</dt><dd>" + escapeHtml(order.recipientName) + " · " + escapeHtml(order.phone) + "</dd></div>" +
    "<div><dt>Nhận hàng</dt><dd>" + (order.delivery === "ship" ? "Giao tới: " + escapeHtml(order.address) : "Nhận tại cửa hàng") + "</dd></div>" +
    "<div><dt>Thanh toán</dt><dd>" + (order.payment === "cod" ? "COD" : "Chuyển khoản (nội dung: " + escapeHtml(order.code) + ")") + "</dd></div>" +
    "</dl>" +
    '<ul class="order-card__items">' +
    order.items
      .map(function (item) {
        return (
          '<li class="order-item"><img src="' + escapeHtml(listingImage(item.image)) + '" alt="" loading="lazy"><div class="order-item__info">' +
          escapeHtml(item.name) + '<p class="order-item__meta">' + (item.kind === "listing" ? '<span class="tag tag--emerald">Ký gửi</span> ' : "") +
          formatVND(item.price) + " × " + item.quantity + "</p></div></li>"
        );
      })
      .join("") +
    "</ul>" +
    '<footer class="order-card__foot"><p><strong class="order-card__total">Tổng ' + formatVND(order.total) + "</strong></p>" +
    (order.adminNote ? '<p class="order-card__note">Ghi chú: ' + escapeHtml(order.adminNote) + "</p>" : "") +
    '<div class="order-card__actions">' + actions.join("") + "</div></footer></article>"
  );
}

async function loadAdminOrders() {
  try {
    const data = await apiGet("/api/admin/orders" + (orderFilter ? "?status=" + orderFilter : ""));
    const total = Object.values(data.counts).reduce(function (a, b) {
      return a + b;
    }, 0);
    document.getElementById("order-filters").innerHTML =
      '<button type="button" class="chip' + (!orderFilter ? " is-active" : "") + '" data-filter="">Tất cả <span class="chip__count">' + total + "</span></button>" +
      Object.keys(data.statusLabels)
        .map(function (key) {
          return '<button type="button" class="chip' + (orderFilter === key ? " is-active" : "") + '" data-filter="' + key + '">' + escapeHtml(data.statusLabels[key]) + ' <span class="chip__count">' + (data.counts[key] || 0) + "</span></button>";
        })
        .join("");
    adminOrdersBox.innerHTML = data.orders.length ? data.orders.map(adminOrderHtml).join("") : '<p class="empty-note">Không có đơn nào.</p>';
  } catch (error) {
    adminOrdersBox.innerHTML = loadErrorHtml(error);
  }
}

document.getElementById("order-filters").addEventListener("click", function (event) {
  const chip = event.target.closest("[data-filter]");
  if (!chip) return;
  orderFilter = chip.dataset.filter;
  loadAdminOrders();
});

adminOrdersBox.addEventListener("click", async function (event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const body = { action: button.dataset.action };
  if (body.action === "cancel") {
    const note = window.prompt("Lý do hủy / ghi chú hoàn tiền (bắt buộc nếu khách đã thanh toán):", "");
    if (note === null) return;
    body.note = note;
  }
  button.disabled = true;
  try {
    await apiPost("/api/admin/orders/" + button.dataset.id + "/action", body);
    showToast("Đã cập nhật đơn.");
    loadAdminOrders();
  } catch (error) {
    button.disabled = false;
    showToast(error.message);
  }
});

requireStaffPage(["admin"]).then(function (ok) {
  if (ok) loadAdminOrders();
});
