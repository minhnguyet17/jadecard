// ======================================================================
// ĐƠN HÀNG CỦA TÔI (F07) + ĐÁNH GIÁ NGƯỜI BÁN (F56) — orders.html
//   - Trạng thái đơn và trạng thái thanh toán (tải lại trang để thấy cập nhật mới)
//   - Tự hủy khi đơn còn "Chờ xác nhận"
//   - Đơn hoàn thành có thẻ ký gửi → chấm 1–5 sao + nhận xét người bán (mỗi dòng đơn một lần)
// ======================================================================
const ordersBox = document.getElementById("order-list");
const DELIVERY_LABELS = { ship: "Giao hàng tận nơi", pickup: "Nhận tại cửa hàng" };
const PAYMENT_LABELS = { cod: "COD", transfer: "Chuyển khoản" };

function orderItemHtml(item) {
  const url = item.kind === "listing" ? "listing.html?id=" + item.listingId : "product-detail.html?id=" + item.productId;
  let review = "";
  if (item.reviewed) review = '<span class="tag tag--emerald">Đã đánh giá người bán</span>';
  else if (item.canReview) {
    review =
      '<form class="review-form" data-review-item="' + item.id + '">' +
      '<fieldset class="star-input"><legend class="field__label">Đánh giá người bán</legend>' +
      [5, 4, 3, 2, 1]
        .map(function (n) {
          return '<input type="radio" id="star-' + item.id + "-" + n + '" name="stars" value="' + n + '"><label for="star-' + item.id + "-" + n + '" title="' + n + ' sao">★</label>';
        })
        .join("") +
      "</fieldset>" +
      '<textarea class="textarea review-form__text" name="comment" maxlength="500" placeholder="Thẻ có đúng ảnh và mô tả không? Người bán phản hồi trả giá có nhanh không? (không bắt buộc)"></textarea>' +
      '<p class="field__error" aria-live="polite"></p>' +
      '<button type="submit" class="btn btn--primary btn--sm">Gửi đánh giá</button></form>';
  }
  return (
    '<li class="order-item">' +
    '<img src="' + escapeHtml(listingImage(item.image)) + '" alt="" loading="lazy">' +
    '<div class="order-item__info"><a href="' + url + '">' + escapeHtml(item.name) + "</a>" +
    '<p class="order-item__meta">' + (item.kind === "listing" ? '<span class="tag tag--emerald">Ký gửi</span> ' : "") + formatVND(item.price) + " × " + item.quantity + "</p>" +
    review + "</div></li>"
  );
}

function orderHtml(order, highlight) {
  return (
    '<article class="order-card' + (highlight ? " order-card--new" : "") + '" id="' + order.code + '">' +
    '<header class="order-card__head">' +
    '<div><p class="order-card__code mono">' + escapeHtml(order.code) + "</p>" +
    '<p class="order-card__date">' + formatDateTime(order.createdAt) + " · " + DELIVERY_LABELS[order.delivery] + " · " + PAYMENT_LABELS[order.payment] + "</p></div>" +
    '<div class="order-card__status"><span class="status status--' + order.status + '">' + escapeHtml(order.statusLabel) + "</span>" +
    '<span class="status status--' + (order.paymentStatus === "paid" ? "completed" : "pending") + '">' + escapeHtml(order.paymentLabel) + "</span></div>" +
    "</header>" +
    '<ul class="order-card__items">' + order.items.map(orderItemHtml).join("") + "</ul>" +
    '<footer class="order-card__foot">' +
    '<p>Tạm tính ' + formatVND(order.subtotal) + " · Phí giao " + (order.shippingFee ? formatVND(order.shippingFee) : "miễn phí") +
    ' · <strong class="order-card__total">Tổng ' + formatVND(order.total) + "</strong></p>" +
    (order.adminNote ? '<p class="order-card__note">Ghi chú của shop: ' + escapeHtml(order.adminNote) + "</p>" : "") +
    (order.canCancel ? '<button type="button" class="btn btn--soft btn--sm" data-cancel-order="' + order.id + '">Hủy đơn</button>' : "") +
    "</footer></article>"
  );
}

async function loadOrders() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.replace("login.html?next=orders.html");
    return;
  }
  const placed = getQueryParam("placed");
  if (placed) {
    const box = document.getElementById("placed-alert");
    box.className = "alert alert--success";
    box.innerHTML =
      '<span class="icon" aria-hidden="true">task_alt</span><div><strong class="alert__title">Đặt hàng thành công: ' + escapeHtml(placed) + "</strong>" +
      "<span>Đơn chưa giữ hàng cho đến khi shop xác nhận (thẻ ký gửi được giữ ngay). Nếu chọn chuyển khoản, shop sẽ gửi thông tin sau khi xác nhận; nội dung chuyển khoản là mã đơn.</span></div>";
  }
  try {
    const data = await apiGet("/api/orders");
    ordersBox.innerHTML = data.orders.length
      ? data.orders
          .map(function (order) {
            return orderHtml(order, order.code === placed);
          })
          .join("")
      : '<div class="empty-state empty-state--stack"><span class="icon icon--5xl text-dim" aria-hidden="true">receipt_long</span><p class="empty-state__title">Bạn chưa có đơn hàng nào</p><a class="btn btn--primary btn--sm" href="products.html">Mua sắm ngay</a></div>';
  } catch (error) {
    ordersBox.innerHTML = loadErrorHtml(error);
  }
}

ordersBox.addEventListener("click", async function (event) {
  const button = event.target.closest("[data-cancel-order]");
  if (!button || !window.confirm("Hủy đơn hàng này?")) return;
  try {
    await apiPost("/api/orders/" + button.dataset.cancelOrder + "/cancel");
    showToast("Đã hủy đơn.");
    loadOrders();
  } catch (error) {
    showToast(error.message);
  }
});

ordersBox.addEventListener("submit", async function (event) {
  const form = event.target.closest("[data-review-item]");
  if (!form) return;
  event.preventDefault();
  const stars = form.querySelector("input[name=stars]:checked");
  const errorBox = form.querySelector(".field__error");
  if (!stars) {
    errorBox.textContent = "Hãy chọn số sao.";
    return;
  }
  try {
    await apiPost("/api/order-items/" + form.dataset.reviewItem + "/review", { stars: Number(stars.value), comment: form.querySelector("textarea").value });
    showToast("Cảm ơn bạn đã đánh giá!");
    loadOrders();
  } catch (error) {
    errorBox.textContent = error.message;
  }
});

loadOrders();
