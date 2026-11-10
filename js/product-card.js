// ======================================================================
// THẺ SẢN PHẨM DÙNG CHUNG (trang chủ + trang Sản phẩm)
// Một hàm duy nhất tạo HTML cho thẻ sản phẩm, để hai trang luôn giống nhau.
// Nút "Thêm vào giỏ" có thuộc tính data-add-id; js/cart.js lắng nghe
// sự kiện bấm của mọi nút này trên toàn trang.
// ======================================================================

// Ngưỡng hiện nhãn khan hiếm "Chỉ còn N"
const LOW_STOCK = 3;

// headingTag: thẻ tiêu đề cho tên sản phẩm ("h3" ở trang chủ, "h2" ở trang Sản phẩm)
function createProductCard(product, headingTag) {
  const tag = headingTag || "h3";
  const isSingle = product.category === "Thẻ lẻ";
  const meta = isSingle
    ? product.set.toUpperCase() + " · " + product.number + " · " + product.condition
    : "HÀNG NGUYÊN HỘP · CÒN " + product.stock;
  const detailUrl = "product-detail.html?id=" + product.id;
  const badge = product.stock > 0 && product.stock <= LOW_STOCK
    ? `<span class="product-card__badge">CHỈ CÒN ${product.stock}</span>`
    : "";

  return `
    <article class="product-card${isSingle ? "" : " product-card--sealed"}">
      <a href="${detailUrl}" class="product-card__media" tabindex="-1" aria-hidden="true">
        <img src="${product.image}" alt="" loading="lazy">
        ${badge}
      </a>
      <p class="product-card__meta">${meta}</p>
      <${tag} class="product-card__name"><a href="${detailUrl}">${product.name}</a></${tag}>
      <p class="product-card__price">${formatVND(product.price)}</p>
      <div class="product-card__actions">
        <button type="button" class="btn btn--primary product-card__add" data-add-id="${product.id}" aria-label="Thêm ${product.name} vào giỏ">
          <span class="icon" aria-hidden="true">add_shopping_cart</span><span class="product-card__add-label">Thêm vào giỏ</span>
        </button>
        <a href="${detailUrl}" class="product-card__detail" title="Xem chi tiết" aria-label="Xem chi tiết ${product.name}">
          <span class="icon" aria-hidden="true">visibility</span>
        </a>
      </div>
    </article>`;
}
