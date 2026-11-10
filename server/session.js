// ======================================================================
// PHIÊN ĐĂNG NHẬP (F32) VÀ KIỂM TRA QUYỀN
// Cách làm:
//   1. Đăng nhập đúng → tạo một mã phiên ngẫu nhiên, gửi cho trình duyệt trong cookie "sid".
//      Cookie có httpOnly (JavaScript trên trang không đọc được) và SameSite=Lax.
//   2. Server chỉ lưu bản băm sha256 của mã phiên trong bảng sessions.
//   3. Mỗi yêu cầu gửi lên: đọc cookie → tìm phiên → biết ai đang đăng nhập (req.user).
// Mọi quyền đều kiểm tra ở đây, phía server. Không tin vào giao diện.
// ======================================================================
const crypto = require("node:crypto");
const { db, nowIso } = require("./db");
const config = require("./config");
const { ApiError } = require("./errors");

const COOKIE_NAME = "sid";
const SESSION_DAYS = 7;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: config.isProduction, // chạy https thật thì chỉ gửi cookie qua https
  path: "/",
};

// Tạo phiên mới cho người dùng và gắn cookie vào câu trả lời
function startSession(res, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(
    hashToken(token),
    userId,
    nowIso(SESSION_MS),
    nowIso()
  );
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_MS });
}

// Đăng xuất phiên hiện tại
function endSession(req, res) {
  const token = req.cookies[COOKIE_NAME];
  if (token) db.prepare("DELETE FROM sessions WHERE id = ?").run(hashToken(token));
  res.clearCookie(COOKIE_NAME, cookieOptions);
}

// Đăng xuất mọi phiên của một người (sau khi đổi mật khẩu, F33; khi bị khóa tài khoản, F42)
function endAllSessions(userId) {
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

// Middleware chạy cho mọi /api: tìm người đang đăng nhập, gắn vào req.user (hoặc null)
function loadUser(req, res, next) {
  req.user = null;
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    const user = db
      .prepare(
        `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.id = ? AND s.expires_at > ? AND u.banned = 0`
      )
      .get(hashToken(token), nowIso());
    req.user = user || null;
  }
  next();
}

// Bắt buộc đăng nhập. Phiên chỉ được tạo sau khi đã xác thực email,
// nên "đã đăng nhập" cũng có nghĩa là "đã xác thực email".
function requireLogin(req, res, next) {
  if (!req.user) {
    throw new ApiError(401, "Bạn cần đăng nhập để làm việc này.", { code: "LOGIN_REQUIRED" });
  }
  next();
}

// Bắt buộc có một trong các vai trò. Ví dụ: requireRole("mod", "admin")
function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user) {
      throw new ApiError(401, "Bạn cần đăng nhập để làm việc này.", { code: "LOGIN_REQUIRED" });
    }
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "Bạn không có quyền làm việc này.");
    }
    next();
  };
}

module.exports = { startSession, endSession, endAllSessions, loadUser, requireLogin, requireRole };
