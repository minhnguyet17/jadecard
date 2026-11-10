// ======================================================================
// TRANG CHI TIẾT SẢN PHẨM (product-detail.html?id=...) — Buổi 3
// Đọc mã sản phẩm trên URL, tìm trong mảng `products` rồi hiển thị.
// ======================================================================

const detailContainer = document.getElementById("product-detail");
const breadcrumbName = document.getElementById("breadcrumb-name");

// Một ô thuộc tính (Set, Số thẻ, ...)
function attributeBox(label, value) {
  return `<div><dt>${label}</dt><dd>${value}</dd></div>`;
}

// Hiển thị thông báo khi không tìm thấy sản phẩm
function renderNotFound() {
  document.title = "Không tìm thấy sản phẩm — JadeCard";
  breadcrumbName.textContent = "Không tìm thấy";
  detailContainer.innerHTML = `
    <div class="empty-state empty-state--stack detail__not-found">
      <span class="icon icon--5xl text-dim" aria-hidden="true">search_off</span>
      <h1 class="detail__not-found-title">Không tìm thấy sản phẩm</h1>
      <p class="text-muted">Mã sản phẩm trên đường dẫn không đúng hoặc sản phẩm không còn bán.</p>
      <a href="products.html" class="btn btn--primary btn--sm">Quay lại danh sách sản phẩm</a>
    </div>`;
}

// Thanh mua nhanh ở đáy màn hình: hiện khi nút "Thêm vào giỏ" chính đã bị cuộn khỏi màn hình
function createBuyBar(product) {
  const bar = document.createElement("div");
  bar.id = "buy-bar";
  bar.className = "buy-bar";
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "Mua nhanh " + product.name);
  bar.innerHTML = `
    <img class="buy-bar__thumb" src="${product.image}" alt="">
    <div class="buy-bar__text">
      <p class="buy-bar__name">${product.name}</p>
      <p class="buy-bar__price">${formatVND(product.price)} <span>· còn ${product.stock}</span></p>
    </div>
    <button type="button" class="btn btn--primary buy-bar__btn" data-add-id="${product.id}">
      <span class="icon" aria-hidden="true">add_shopping_cart</span> Thêm vào giỏ
    </button>`;
  document.body.appendChild(bar);

  const form = document.getElementById("add-form");
  if (!("IntersectionObserver" in window)) {
    return;
  }
  const observer = new IntersectionObserver(function (entries) {
    const formVisible = entries[0].isIntersecting;
    bar.classList.toggle("is-visible", !formVisible);
    document.body.classList.toggle("has-buy-bar", !formVisible);
  });
  observer.observe(form);
}

// Hiển thị thông tin sản phẩm
function renderProduct(product) {
  const isSingle = product.category === "Thẻ lẻ";
  document.title = product.name + " — JadeCard";
  breadcrumbName.textContent = product.name;

  // Thuộc tính: thẻ lẻ có 6 trường; hàng nguyên hộp có danh mục, set, ngôn ngữ
  const attributes = isSingle
    ? attributeBox("Set", product.set) +
      attributeBox("Số thẻ", product.number) +
      attributeBox("Độ hiếm", product.rarity) +
      attributeBox("Ngôn ngữ", product.language) +
      attributeBox("Biến thể", product.variant) +
      attributeBox("Tình trạng", product.condition)
    : attributeBox("Danh mục", product.category) +
      attributeBox("Set", product.set) +
      attributeBox("Ngôn ngữ", product.language);

  // Giá tham khảo quốc tế chỉ có ở thẻ lẻ
  const referencePrice = product.marketUsd !== null
    ? `<div class="price-box__ref">
         <p class="price-box__label">Giá tham khảo quốc tế</p>
         <p class="price-box__ref-value">${product.marketUsd.toLocaleString("vi-VN")} USD</p>
         <p class="price-box__note">TCGplayer (qua TCGdex), cập nhật 07/11/2026. Chỉ mang tính tham khảo.</p>
       </div>`
    : "";

  const outOfStock = product.stock <= 0;

  detailContainer.innerHTML = `
    <div class="detail__media">
      <div class="detail__glow" aria-hidden="true"></div>
      <div class="detail__frame holo-border">
        <img src="${product.image}" alt="${product.name}">
      </div>
    </div>

    <div class="detail__info">
      <div class="tags">
        <span class="tag">${product.category.toUpperCase()}</span>
        ${isSingle ? `<span class="tag tag--emerald">TÌNH TRẠNG: ${product.condition}</span>` : ""}
        <span class="tag tag--yellow">${outOfStock ? "HẾT HÀNG" : "CÒN " + product.stock}</span>
      </div>
      <h1 class="detail__title">${product.name}</h1>
      <p class="detail__desc">${product.description}</p>

      <div class="price-box">
        <div>
          <p class="price-box__label">Giá bán tại JadeCard</p>
          <p class="price-box__value">${formatVND(product.price)}</p>
        </div>
        ${referencePrice}
      </div>

      <dl class="attr-grid">${attributes}</dl>

      <form id="add-form" class="add-form">
        <label for="qty">Số lượng</label>
        <input id="qty" type="number" min="1" max="${product.stock}" value="1" ${outOfStock ? "disabled" : ""}>
        <button type="submit" class="btn btn--primary" ${outOfStock ? "disabled" : ""}>
          <span class="icon" aria-hidden="true">add_shopping_cart</span> ${outOfStock ? "Hết hàng" : "Thêm vào giỏ"}
        </button>
      </form>
      <p id="qty-error" class="form-error hidden" role="alert"></p>

      <ul class="perks">
        <li><span class="icon" aria-hidden="true">videocam</span> Quay video khi đóng gói${isSingle ? ", bọc sleeve và toploader" : ""}.</li>
        <li><span class="icon" aria-hidden="true">local_shipping</span> Giao hàng 30.000 ₫ toàn quốc, hoặc nhận miễn phí tại cửa hàng.</li>
      </ul>

      <a href="products.html" class="link-arrow"><span class="icon" aria-hidden="true">arrow_back</span> Quay lại danh sách sản phẩm</a>
    </div>`;

  // Sự kiện "Thêm vào giỏ": kiểm tra số lượng nhập vào trước khi thêm
  document.getElementById("add-form").addEventListener("submit", function (event) {
    event.preventDefault();
    const qtyInput = document.getElementById("qty");
    const errorText = document.getElementById("qty-error");
    const quantity = Number(qtyInput.value);

    if (!Number.isInteger(quantity) || quantity < 1) {
      errorText.textContent = "Số lượng phải là số nguyên từ 1 trở lên.";
      errorText.classList.remove("hidden");
      return;
    }
    errorText.classList.add("hidden");

    const added = addToCart(product.id, quantity);
    if (added === 0) {
      showToast("Giỏ hàng đã có đủ số lượng tồn kho của sản phẩm này", true);
    } else if (added < quantity) {
      bumpCartBadge();
      showToast("Chỉ còn " + product.stock + " sản phẩm, đã thêm " + added + " vào giỏ", true);
    } else {
      bumpCartBadge();
      showToast("Đã thêm " + added + " × \"" + product.name + "\" vào giỏ", true);
    }
  });

  if (!outOfStock) {
    createBuyBar(product);
  }
}

// ---------------- Khởi động trang ----------------
// Đọc id từ URL, ví dụ product-detail.html?id=3  ->  3
const params = new URLSearchParams(window.location.search);
const productId = Number(params.get("id"));
const product = findProductById(productId);

if (product) {
  renderProduct(product);
} else {
  renderNotFound();
}
