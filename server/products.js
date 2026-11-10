// ======================================================================
// SẢN PHẨM CỦA SHOP PHÍA SERVER
// Dữ liệu sản phẩm vẫn chỉ có MỘT nơi là js/data/products.js (dùng chung với giao diện).
// Server đọc file đó để biết tên, giá thật khi tạo đơn hàng (không tin giá trình duyệt gửi lên).
// Tồn kho được quản lý trong bảng product_stock: lần đầu lấy theo products.js,
// sau đó trừ khi admin xác nhận đơn, hoàn khi hủy đơn đã trừ kho (F20, PB12).
// ======================================================================
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { db, ROOT } = require("./db");

// Chạy file products.js trong một "hộp cát" riêng để lấy mảng products
function loadProducts() {
  const code = fs.readFileSync(path.join(ROOT, "js", "data", "products.js"), "utf8");
  const sandbox = {};
  vm.runInNewContext(code + "\nthis.products = products;", sandbox);
  return sandbox.products;
}

const products = loadProducts();

// Sản phẩm nào chưa có dòng tồn kho thì thêm (sản phẩm mới trong products.js)
const insertStock = db.prepare("INSERT OR IGNORE INTO product_stock (product_id, stock) VALUES (?, ?)");
for (const product of products) insertStock.run(product.id, product.stock);

function findProduct(id) {
  return products.find((product) => product.id === Number(id));
}

function getStock(productId) {
  const row = db.prepare("SELECT stock FROM product_stock WHERE product_id = ?").get(productId);
  return row ? row.stock : 0;
}

module.exports = { products, findProduct, getStock };
