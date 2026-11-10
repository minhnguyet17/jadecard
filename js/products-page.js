// ======================================================================
// TRANG DANH SÁCH SẢN PHẨM (products.html) — Buổi 3
// Hiển thị sản phẩm từ mảng `products`, kết hợp tìm kiếm + lọc + sắp xếp.
// ======================================================================

// Các phần tử trên trang
const productList = document.getElementById("product-list");
const resultCount = document.getElementById("result-count");
const emptyMessage = document.getElementById("empty-message");
const keywordInput = document.getElementById("filter-keyword");
const setSelect = document.getElementById("filter-set");
const sortSelect = document.getElementById("sort");
const resetButton = document.getElementById("filter-reset");

const filters = document.getElementById("filters");
const filterToggle = document.getElementById("filter-toggle");

// Thẻ sản phẩm được tạo bằng createProductCard() trong js/product-card.js (dùng chung với trang chủ)

// Hiển thị một danh sách sản phẩm lên lưới. Danh sách rỗng thì hiện thông báo.
function renderProducts(list) {
  productList.innerHTML = list.map(function (product) {
    return createProductCard(product, "h2");
  }).join("");
  resultCount.textContent = "Hiển thị " + list.length + " / " + products.length + " sản phẩm";
  emptyMessage.classList.toggle("hidden", list.length > 0);
}

// Đọc các điều kiện đang chọn trên bộ lọc
function getSelectedCategory() {
  const checked = document.querySelector('input[name="category"]:checked');
  return checked ? checked.value : "";
}

// Lọc + sắp xếp theo các điều kiện, trả về MẢNG MỚI (không sửa mảng products gốc)
function getFilteredProducts() {
  const keyword = keywordInput.value.trim().toLowerCase();
  const category = getSelectedCategory();
  const setName = setSelect.value;
  const sort = sortSelect.value;

  // 1. Lọc: filter() luôn tạo mảng mới
  const result = products.filter(function (product) {
    // Tìm theo tên hoặc số thẻ (ví dụ "pikachu" hoặc "199/165")
    const matchKeyword =
      keyword === "" ||
      product.name.toLowerCase().includes(keyword) ||
      (product.number !== null && product.number.includes(keyword));
    const matchCategory = category === "" || product.category === category;
    const matchSet = setName === "" || product.set === setName;
    return matchKeyword && matchCategory && matchSet;
  });

  // 2. Sắp xếp theo giá (sort() sửa trực tiếp mảng, nhưng đây là mảng mới nên an toàn)
  if (sort === "price-asc") {
    result.sort(function (a, b) { return a.price - b.price; });
  } else if (sort === "price-desc") {
    result.sort(function (a, b) { return b.price - a.price; });
  }
  return result;
}

// Mỗi khi người dùng thay đổi một điều kiện: tính lại và hiển thị lại
function updateList() {
  renderProducts(getFilteredProducts());
}

// Tạo danh sách set cho ô chọn từ chính dữ liệu (không gõ tay)
function fillSetOptions() {
  const sets = [];
  products.forEach(function (product) {
    if (!sets.includes(product.set)) {
      sets.push(product.set);
    }
  });
  sets.sort();
  sets.forEach(function (setName) {
    const option = document.createElement("option");
    option.value = setName;
    option.textContent = setName;
    setSelect.appendChild(option);
  });
}

// ---------------- Gắn sự kiện ----------------
keywordInput.addEventListener("input", updateList);
setSelect.addEventListener("change", updateList);
sortSelect.addEventListener("change", updateList);
document.querySelectorAll('input[name="category"]').forEach(function (radio) {
  radio.addEventListener("change", updateList);
});
resetButton.addEventListener("click", function () {
  keywordInput.value = "";
  setSelect.value = "";
  sortSelect.value = "";
  document.querySelector('input[name="category"][value=""]').checked = true;
  updateList();
});

// Nút "Thêm vào giỏ" trên từng thẻ được xử lý chung trong js/cart.js
// (một sự kiện cho cả trang, nên thẻ tạo lại sau mỗi lần lọc vẫn bấm được).

// Điện thoại: nút "Lọc & sắp xếp" mở / đóng phần danh mục, set, sắp xếp
filterToggle.addEventListener("click", function () {
  const isOpen = filters.classList.toggle("is-open");
  filterToggle.setAttribute("aria-expanded", isOpen);
});

// ---------------- Khởi động trang ----------------
fillSetOptions();
const params = new URLSearchParams(window.location.search);
// Đến từ ô tìm kiếm ở header (products.html?q=...): điền sẵn từ khóa
if (params.get("q")) {
  keywordInput.value = params.get("q");
}
// Đến từ nút "Xem tất cả pack" (?category=sealed) hoặc "Xem thẻ lẻ" (?category=single)
const CATEGORY_PARAMS = { sealed: "Hàng nguyên hộp", single: "Thẻ lẻ" };
const categoryFromUrl = CATEGORY_PARAMS[params.get("category")];
if (categoryFromUrl) {
  document.querySelector('input[name="category"][value="' + categoryFromUrl + '"]').checked = true;
}
updateList();
