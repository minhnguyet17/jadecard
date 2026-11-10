// ======================================================================
// Hàm tiện ích dùng chung
// ======================================================================

// Định dạng số thành tiền Việt Nam. Ví dụ: 1250000 -> "1.250.000 ₫"
function formatVND(amount) {
  return amount.toLocaleString("vi-VN") + " ₫";
}

// Tìm một sản phẩm trong mảng `products` theo id (trả về undefined nếu không có)
function findProductById(id) {
  return products.find(function (product) {
    return product.id === id;
  });
}
