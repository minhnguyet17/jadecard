// ======================================================================
// GIỎ HÀNG DÙNG CHUNG CHO MỌI TRANG (Buổi 3)
//
// Cấu trúc giỏ hàng: một mảng các dòng
//   - Sản phẩm của shop: { id, quantity }   ví dụ { id: 6, quantity: 2 }
//     Chỉ lưu id và số lượng. Tên, ảnh, giá luôn lấy lại từ mảng `products`.
//   - Tin ký gửi (từ giai đoạn 4, F47): { listingId, quantity: 1, name, image, price, code }
//     Mỗi tin là một lá thẻ nên số lượng luôn là 1. Tên, giá lưu kèm để hiển thị;
//     khi đặt hàng, server kiểm tra lại tin còn bán không và tính lại giá.
//
// Giỏ hàng được lưu trong localStorage với khóa "cart" (dạng chuỗi JSON).
// ======================================================================

const CART_KEY = "cart";

// Đọc giỏ hàng từ localStorage. Chưa có dữ liệu hoặc dữ liệu hỏng thì trả về mảng rỗng.
function loadCart() {
  const saved = localStorage.getItem(CART_KEY);
  if (saved === null) {
    return [];
  }
  try {
    const cart = JSON.parse(saved);
    // Bỏ những dòng không hợp lệ hoặc sản phẩm không còn tồn tại
    return cart.filter(function (item) {
      if (item.listingId) return true;
      return findProductById(item.id) !== undefined && item.quantity > 0;
    });
  } catch (error) {
    return [];
  }
}

// Lưu giỏ hàng vào localStorage, cập nhật số trên biểu tượng giỏ hàng,
// rồi phát sự kiện "cartchange" để trang nào cần (ví dụ trang Giỏ hàng) vẽ lại.
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
  document.dispatchEvent(new CustomEvent("cartchange"));
}

// Thêm sản phẩm vào giỏ. Nếu đã có thì tăng số lượng thay vì tạo dòng mới.
// Số lượng không được vượt quá tồn kho. Trả về số lượng thực sự đã thêm.
function addToCart(productId, quantity) {
  const product = findProductById(productId);
  if (!product || product.stock <= 0) {
    return 0;
  }
  const cart = loadCart();
  const existing = cart.find(function (item) {
    return !item.listingId && item.id === productId;
  });
  const currentQty = existing ? existing.quantity : 0;
  const added = Math.min(quantity, product.stock - currentQty);
  if (added <= 0) {
    return 0;
  }
  if (existing) {
    existing.quantity += added;
  } else {
    cart.push({ id: productId, quantity: added });
  }
  saveCart(cart);
  return added;
}

// Đặt lại số lượng của một dòng (giới hạn trong khoảng 1 đến tồn kho)
function setCartQuantity(productId, quantity) {
  const product = findProductById(productId);
  const cart = loadCart();
  const item = cart.find(function (line) {
    return !line.listingId && line.id === productId;
  });
  if (!item || !product) {
    return;
  }
  item.quantity = Math.max(1, Math.min(quantity, product.stock));
  saveCart(cart);
}

// Xóa một sản phẩm khỏi giỏ
function removeFromCart(productId) {
  const cart = loadCart().filter(function (item) {
    return item.listingId || item.id !== productId;
  });
  saveCart(cart);
}

// ---------- Tin ký gửi (F47) ----------
// listing: { id, code, cardName, cardNumber, image } ; price: giá người này được mua
// (giá niêm yết, hoặc giá đã chốt khi trả giá F55). Trả về false nếu tin đã có trong giỏ.
function addListingToCart(listing, price) {
  const cart = loadCart();
  if (cart.some(function (item) { return item.listingId === listing.id; })) {
    return false;
  }
  cart.push({
    listingId: listing.id,
    quantity: 1,
    code: listing.code,
    name: listing.cardName + " · " + listing.cardNumber,
    image: listing.image,
    price: price,
  });
  saveCart(cart);
  return true;
}

function removeListingFromCart(listingId) {
  const cart = loadCart().filter(function (item) {
    return item.listingId !== listingId;
  });
  saveCart(cart);
}

// Đơn giá của một dòng: tin ký gửi lấy giá đã lưu, sản phẩm lấy từ products.js
function getLinePrice(item) {
  return item.listingId ? item.price : findProductById(item.id).price;
}

// Tổng số lượng sản phẩm trong giỏ (dùng cho số trên biểu tượng giỏ hàng)
function getCartCount() {
  return loadCart().reduce(function (sum, item) {
    return sum + item.quantity;
  }, 0);
}

// Tổng tiền hàng = Σ (đơn giá × số lượng)
function getCartTotal() {
  return loadCart().reduce(function (sum, item) {
    return sum + getLinePrice(item) * item.quantity;
  }, 0);
}

// Cập nhật số trên biểu tượng giỏ hàng ở header (mọi trang đều có #cart-count)
function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  if (!badge) {
    return;
  }
  const count = getCartCount();
  badge.textContent = count;
  badge.classList.toggle("hidden", count === 0);
}

// Làm số trên biểu tượng giỏ "nảy" lên một chút để người dùng thấy giỏ vừa thay đổi
function bumpCartBadge() {
  const badge = document.getElementById("cart-count");
  if (!badge) {
    return;
  }
  badge.classList.remove("is-bump");
  void badge.offsetWidth; // ép trình duyệt chạy lại hiệu ứng
  badge.classList.add("is-bump");
}

// Hiện thông báo nhỏ ở cuối màn hình (ví dụ "Đã thêm vào giỏ").
// showCartLink = true thì kèm link "Xem giỏ" để người dùng đi tiếp tới giỏ hàng.
// Giao diện của thông báo nằm trong scss/components/_surfaces.scss (#toast).
function showToast(message, showCartLink) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  if (showCartLink && !window.location.pathname.endsWith("cart.html")) {
    const link = document.createElement("a");
    link.href = "cart.html";
    link.textContent = "Xem giỏ →";
    toast.appendChild(link);
  }
  toast.style.opacity = "1";
  clearTimeout(toast.hideTimer);
  toast.hideTimer = setTimeout(function () {
    toast.style.opacity = "0";
  }, 2600);
}

// Mọi nút có data-add-id (thẻ sản phẩm, nút "Mua pack", thanh mua nhanh...) đều thêm 1 sản phẩm vào giỏ.
// Dùng một sự kiện chung cho cả trang (event delegation), nên nút tạo sau bằng JavaScript vẫn hoạt động.
document.addEventListener("click", function (event) {
  const button = event.target.closest("[data-add-id]");
  if (!button) {
    return;
  }
  const product = findProductById(Number(button.dataset.addId));
  if (!product) {
    return;
  }
  const added = addToCart(product.id, 1);
  if (added > 0) {
    bumpCartBadge();
    showToast("Đã thêm \"" + product.name + "\" vào giỏ", true);
  } else {
    showToast("Giỏ hàng đã có đủ số lượng tồn kho của sản phẩm này", true);
  }
});

// Khi mở bất kỳ trang nào: hiển thị đúng số lượng trên biểu tượng giỏ hàng
document.addEventListener("DOMContentLoaded", updateCartBadge);

// Nếu giỏ hàng thay đổi ở một tab khác, cập nhật lại số trên biểu tượng
window.addEventListener("storage", function (event) {
  if (event.key === CART_KEY) {
    updateCartBadge();
  }
});
