// ======================================================================
// TRANG CHỦ (index.html)
// 1. Tạo các lưới sản phẩm từ dữ liệu (data-product-ids="15,14,13,12")
// 2. Điền số tồn kho thật vào các chỗ có data-stock-of="id"
// 3. Hiện thanh mua nhanh ở đáy màn hình khi đã cuộn qua phần hero
// ======================================================================

// 1. Lưới sản phẩm: đọc danh sách id, tìm sản phẩm, tạo thẻ bằng createProductCard()
document.querySelectorAll("[data-product-ids]").forEach(function (grid) {
  const ids = grid.dataset.productIds.split(",").map(Number);
  const list = ids.map(findProductById).filter(Boolean);
  grid.innerHTML = list.map(function (product) {
    return createProductCard(product, "h3");
  }).join("");
});

// 2. Tồn kho: lấy từ products.js để con số luôn khớp dữ liệu
document.querySelectorAll("[data-stock-of]").forEach(function (element) {
  const product = findProductById(Number(element.dataset.stockOf));
  if (product) {
    element.textContent = product.stock;
  }
});

// 3. Thanh mua nhanh: hiện khi các nút mua ở hero KHÔNG nằm trên màn hình
//    (đã cuộn qua, hoặc màn hình điện thoại thấp chưa thấy tới).
//    Nhờ vậy lúc nào trên màn hình cũng có một nút mua.
const heroBuyButton = document.querySelector("#hero-actions .btn");
const buyBar = document.getElementById("buy-bar");

if (heroBuyButton && buyBar && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(function (entries) {
    // Coi là "nhìn thấy" khi nút hiện gần trọn (từ 95%), tránh trường hợp nút mới ló một nửa
    const buttonVisible = entries[0].intersectionRatio >= 0.95;
    buyBar.classList.toggle("is-visible", !buttonVisible);
    document.body.classList.toggle("has-buy-bar", !buttonVisible);
  }, { threshold: [0, 0.95, 1] });
  observer.observe(heroBuyButton);
}
