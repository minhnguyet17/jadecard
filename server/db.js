// ======================================================================
// KẾT NỐI CƠ SỞ DỮ LIỆU SQLite
// Dùng module có sẵn của Node.js (node:sqlite, cần Node 22.13 trở lên),
// không phải cài thêm thư viện. Toàn bộ dữ liệu nằm trong một file.
// ======================================================================
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const ROOT = path.join(__dirname, "..");

// Vị trí file CSDL. Bài kiểm thử tự động đặt DB_FILE riêng để không đụng dữ liệu thật.
const DB_FILE = process.env.DB_FILE || path.join(ROOT, "data", "jadecard.db");

// Mở (hoặc tạo mới) file CSDL rồi chạy schema.sql.
// schema.sql chỉ toàn lệnh "CREATE ... IF NOT EXISTS": bảng đã có thì bỏ qua, bảng mới thì tạo thêm.
function openDatabase(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const isNew = !fs.existsSync(file);

  const db = new DatabaseSync(file);
  db.exec("PRAGMA foreign_keys = ON;"); // bật kiểm tra khóa ngoại (SQLite mặc định tắt)
  db.exec("PRAGMA journal_mode = WAL;"); // ghi an toàn hơn khi có nhiều yêu cầu cùng lúc
  db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
  return { db, isNew };
}

const { db, isNew } = openDatabase(DB_FILE);

// Chạy nhiều câu lệnh như một khối: lỗi giữa chừng thì hủy hết (không để dữ liệu nửa vời).
function transaction(work) {
  db.exec("BEGIN");
  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

// Thời điểm hiện tại dạng chuỗi ISO (giờ UTC). Cộng thêm số mili giây nếu cần.
function nowIso(addMs = 0) {
  return new Date(Date.now() + addMs).toISOString();
}

module.exports = { db, isNew, transaction, nowIso, DB_FILE, ROOT };
