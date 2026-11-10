// ======================================================================
// TRANG GIỎ HÀNG (cart.html)
//   Buổi 3: hiển thị các dòng trong giỏ, tăng/giảm/xóa, thành tiền và tổng tiền (localStorage).
//   Giai đoạn 4 (F05, F47): giỏ có thể chứa tin ký gửi; form đặt hàng gửi đơn lên server.
// Cần: js/cart.js, js/api.js, js/auth-forms.js
// ======================================================================

const cartItems = document.getElementById("cart-items");
const cartEmpty = document.getElementById("cart-empty");
const cartContent = document.getElementById("cart-content");
const summaryQty = document.getElementById("summary-qty");
const summarySubtotal = document.getElementById("summary-subtotal");
const summaryShipping = document.getElementById("summary-shipping");
const summaryTotal = document.getElementById("summary-total");

const SHIPPING_FEE = 30000; // phí giao hàng cố định (giả định của đồ án)

// HTML cho một dòng sản phẩm của shop
function createCartRow(item) {
  const product = findProductById(item.id);
  const lineTotal = product.price * item.quantity;
  const meta = product.category === "Thẻ lẻ"
    ? product.set + " · " + product.number + " · " + product.condition
    : product.category;

  return `
    <li class="cart-row">
      <a href="product-detail.html?id=${product.id}" class="cart-row__thumb">
        <img src="${product.image}" alt="${product.name}">
      </a>
      <div class="cart-row__info">
        <a href="product-detail.html?id=${product.id}" class="cart-row__name">${product.name}</a>
        <p class="cart-row__meta">${meta}</p>
        <p class="cart-row__unit">Đơn giá: ${formatVND(product.price)}</p>
        <div class="qty">
          <button type="button" class="qty__btn" data-action="decrease" data-id="${product.id}" aria-label="Giảm số lượng ${product.name}" ${item.quantity <= 1 ? "disabled" : ""}>−</button>
          <span class="qty__value" aria-label="Số lượng">${item.quantity}</span>
          <button type="button" class="qty__btn" data-action="increase" data-id="${product.id}" aria-label="Tăng số lượng ${product.name}" ${item.quantity >= product.stock ? "disabled" : ""}>+</button>
          <span class="qty__stock">Còn ${product.stock}</span>
        </div>
      </div>
      <div class="cart-row__side">
        <p class="cart-row__total">${formatVND(lineTotal)}</p>
        <button type="button" class="cart-row__remove" data-action="remove" data-id="${product.id}"><span class="icon" aria-hidden="true">delete</span> Xóa</button>
      </div>
    </li>`;
}

// HTML cho một dòng tin ký gửi (F47): số lượng luôn là 1, không có nút tăng/giảm
function createListingRow(item) {
  const url = "listing.html?id=" + item.listingId;
  return `
    <li class="cart-row">
      <a href="${url}" class="cart-row__thumb">
        <img src="${escapeHtml(cardImageSrc(item.image))}" alt="${escapeHtml(item.name)}">
      </a>
      <div class="cart-row__info">
        <a href="${url}" class="cart-row__name">${escapeHtml(item.name)}</a>
        <p class="cart-row__meta"><span class="tag tag--emerald">Ký gửi · ${escapeHtml(item.code)}</span></p>
        <p class="cart-row__unit">Số lượng: 1 (mỗi tin ký gửi là một lá thẻ). Giá được kiểm tra lại khi đặt hàng.</p>
      </div>
      <div class="cart-row__side">
        <p class="cart-row__total">${formatVND(item.price)}</p>
        <button type="button" class="cart-row__remove" data-action="remove-listing" data-id="${item.listingId}"><span class="icon" aria-hidden="true">delete</span> Xóa</button>
      </div>
    </li>`;
}

// Ảnh TCGdex cần thêm đuôi chất lượng; ảnh trong dự án dùng nguyên
function cardImageSrc(image) {
  return /^https:\/\/assets\.tcgdex\.net\//.test(image) ? image + "/low.webp" : image;
}

// Phí giao hàng theo cách nhận hàng đang chọn
function getShippingFee() {
  return getDelivery() === "ship" ? SHIPPING_FEE : 0;
}

function getDelivery() {
  return document.querySelector('input[name="delivery"]:checked').value;
}

// Vẽ lại toàn bộ giỏ hàng và phần tổng tiền (gọi sau mỗi thao tác)
function renderCart() {
  const cart = loadCart();
  const isEmpty = cart.length === 0;
  cartEmpty.classList.toggle("hidden", !isEmpty);
  cartContent.classList.toggle("hidden", isEmpty);
  if (isEmpty) {
    return;
  }

  cartItems.innerHTML = cart
    .map(function (item) {
      return item.listingId ? createListingRow(item) : createCartRow(item);
    })
    .join("");

  const subtotal = getCartTotal();
  const shipping = getShippingFee();
  summaryQty.textContent = getCartCount();
  summarySubtotal.textContent = formatVND(subtotal);
  summaryShipping.textContent = shipping === 0 ? "Miễn phí" : formatVND(shipping);
  summaryTotal.textContent = formatVND(subtotal + shipping);
  document.getElementById("address-field").classList.toggle("hidden", getDelivery() !== "ship");
}

// Một sự kiện chung cho các nút trong danh sách (tăng / giảm / xóa)
cartItems.addEventListener("click", function (event) {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }
  const id = Number(button.dataset.id);
  if (button.dataset.action === "remove-listing") {
    removeListingFromCart(id);
    showToast("Đã xóa thẻ ký gửi khỏi giỏ");
    renderCart();
    return;
  }
  const item = loadCart().find(function (line) { return !line.listingId && line.id === id; });
  if (!item) {
    return;
  }

  if (button.dataset.action === "increase") {
    setCartQuantity(id, item.quantity + 1);
  } else if (button.dataset.action === "decrease") {
    setCartQuantity(id, item.quantity - 1);
  } else if (button.dataset.action === "remove") {
    removeFromCart(id);
    showToast("Đã xóa sản phẩm khỏi giỏ");
  }
  renderCart();
});

// Đổi cách nhận hàng thì tính lại tổng tiền
document.querySelectorAll('input[name="delivery"]').forEach(function (radio) {
  radio.addEventListener("change", renderCart);
});

// Giỏ hàng thay đổi ở tab khác thì vẽ lại
window.addEventListener("storage", function (event) {
  if (event.key === CART_KEY) {
    renderCart();
  }
});

// Giỏ thay đổi ngay trên trang này (ví dụ bấm "Thêm Booster Pack" khi giỏ trống) thì vẽ lại
document.addEventListener("cartchange", renderCart);

// ======================================================================
// ĐẶT HÀNG (F05) — phải đăng nhập
// ======================================================================
const checkoutForm = document.getElementById("checkout-form");

// Mã ngẫu nhiên cho lần đặt hàng này: bấm "Đặt hàng" 2 lần (hoặc mạng chậm gửi lại)
// thì server nhận ra cùng một mã và không tạo đơn thứ hai.
function getCheckoutKey() {
  let key = sessionStorage.getItem("checkoutKey");
  if (!key) {
    key = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem("checkoutKey", key);
  }
  return key;
}

getCurrentUser().then(function (user) {
  document.getElementById("checkout-fields").classList.toggle("hidden", !user);
  document.getElementById("order-button").classList.toggle("hidden", !user);
  document.getElementById("login-to-order").classList.toggle("hidden", Boolean(user));
});

checkoutForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  clearFormErrors(checkoutForm);

  const delivery = getDelivery();
  const values = {
    recipientName: document.getElementById("recipientName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    address: document.getElementById("address").value.trim(),
    delivery: delivery,
    payment: checkoutForm.querySelector('input[name="payment"]:checked').value,
  };

  let ok = true;
  if (values.recipientName.length < 2) {
    setFieldError("recipientName", "Vui lòng nhập họ tên người nhận.");
    ok = false;
  }
  if (!/^(0|\+84)\d{9}$/.test(values.phone.replace(/[\s.]/g, ""))) {
    setFieldError("phone", "Số điện thoại gồm 10 số, bắt đầu bằng 0.");
    ok = false;
  }
  if (delivery === "ship" && values.address.length < 10) {
    setFieldError("address", "Vui lòng nhập địa chỉ giao hàng đầy đủ.");
    ok = false;
  }
  if (!ok) return;

  values.clientKey = getCheckoutKey();
  values.items = loadCart().map(function (item) {
    return item.listingId ? { type: "listing", id: item.listingId } : { type: "product", id: item.id, quantity: item.quantity };
  });

  const button = document.getElementById("order-button");
  setBusy(button, true, "Đang đặt hàng…");
  try {
    const result = await apiPost("/api/orders", values);
    saveCart([]); // đặt xong thì xóa giỏ
    sessionStorage.removeItem("checkoutKey");
    window.location.href = "orders.html?placed=" + encodeURIComponent(result.order.code);
  } catch (error) {
    setBusy(button, false);
    if (error.code === "LISTING_UNAVAILABLE") {
      removeListingFromCart(error.data.listingId); // tin đã có người mua: bỏ khỏi giỏ
      renderCart();
    }
    showServerError(error);
  }
});

renderCart();
