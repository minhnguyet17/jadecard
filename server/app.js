// ======================================================================
// ỨNG DỤNG EXPRESS: phục vụ website (HTML, CSS, JS, ảnh) và API /api/...
// File server.js gọi createApp() rồi mở cổng. Bài kiểm thử cũng gọi createApp().
// ======================================================================
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const cookieParser = require("cookie-parser");
const { ROOT } = require("./db");
const { errorHandler, ApiError } = require("./errors");
const { loadUser } = require("./session");
const { UPLOAD_DIR } = require("./uploads");

function createApp() {
  const app = express();
  app.disable("x-powered-by"); // không tiết lộ server dùng Express

  // Vài header bảo mật cơ bản cho mọi câu trả lời
  app.use((req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff"); // trình duyệt không "đoán" loại file (chống chạy file ảnh như script)
    res.set("X-Frame-Options", "DENY"); // không cho trang web khác nhúng JadeCard vào khung
    res.set("Referrer-Policy", "same-origin");
    next();
  });

  // ---------- API ----------
  const api = express.Router();
  api.use(express.json({ limit: "100kb" })); // đọc dữ liệu JSON gửi lên
  api.use(cookieParser()); // đọc cookie (mã phiên "sid")
  api.use((req, res, next) => {
    req.body = req.body || {}; // yêu cầu không có nội dung → coi như đối tượng rỗng
    next();
  });
  api.use(loadUser); // biết ai đang đăng nhập (req.user)
  api.use(require("./consign").runExpiry); // cập nhật tin ký gửi / trả giá đã quá hạn

  api.get("/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
  api.use("/auth", require("./routes/auth"));
  api.use(require("./routes/forum"));
  api.use(require("./routes/tags"));
  api.use(require("./routes/moderation"));
  api.use(require("./routes/users"));
  api.use(require("./routes/collection"));
  api.use(require("./routes/listings"));
  api.use(require("./routes/orders"));
  api.use(require("./routes/admin"));

  api.use(() => {
    throw new ApiError(404, "Không có API này.");
  });
  api.use(errorHandler);
  app.use("/api", api);

  // ---------- Website tĩnh ----------
  // Chỉ mở đúng các thư mục giao diện. Thư mục server/, data/ (chứa CSDL), file .env... không ai tải được.
  const staticOptions = { index: false, dotfiles: "deny" };
  app.use("/css", express.static(path.join(ROOT, "css"), staticOptions));
  app.use("/js", express.static(path.join(ROOT, "js"), staticOptions));
  app.use("/images", express.static(path.join(ROOT, "images"), staticOptions));
  app.use("/uploads", express.static(UPLOAD_DIR, staticOptions)); // ảnh người dùng tải lên

  // Các trang .html nằm ở thư mục gốc dự án (index.html, forum.html, login.html...)
  app.get("/", (req, res) => res.sendFile(path.join(ROOT, "index.html")));
  app.get("/:page", (req, res, next) => {
    const page = req.params.page;
    const file = path.join(ROOT, page);
    if (/^[a-z0-9-]+\.html$/.test(page) && fs.existsSync(file)) return res.sendFile(file);
    next();
  });

  // Không khớp gì ở trên → trang 404
  app.use((req, res) => {
    res.status(404).type("html").send(
      '<!DOCTYPE html><meta charset="utf-8"><title>Không tìm thấy trang — JadeCard</title>' +
        '<body style="background:#07070b;color:#e4e1e8;font-family:sans-serif;padding:3rem">' +
        '<h1>404 · Không tìm thấy trang</h1><p><a style="color:#67e8f9" href="/">Về trang chủ JadeCard</a></p>'
    );
  });

  return app;
}

module.exports = { createApp };
