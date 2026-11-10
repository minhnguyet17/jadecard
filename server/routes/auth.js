// ======================================================================
// API TÀI KHOẢN: /api/auth/...
//   POST /register   đăng ký (F30)
//   POST /verify     nhập OTP xác thực email (F31)
//   POST /resend     gửi lại OTP (F31, F33)
//   POST /login      đăng nhập (F32)
//   POST /logout     đăng xuất (F32)
//   GET  /me         ai đang đăng nhập (header dùng để hiện avatar)
//   POST /forgot     quên mật khẩu: gửi OTP (F33)
//   POST /reset      quên mật khẩu: OTP + mật khẩu mới (F33)
//   GET  /dev-code   CHỈ chế độ lập trình (chưa cấu hình Gmail): mã OTP gần nhất để hiện trên trang
// ======================================================================
const express = require("express");
const bcrypt = require("bcryptjs");
const { db, nowIso } = require("../db");
const { ApiError } = require("../errors");
const { issueCode, checkCode, RESEND_WAIT_SECONDS } = require("../otp");
const { startSession, endSession, endAllSessions } = require("../session");
const { publicUser } = require("../users");
const { devCodeFor, showCodeOnPage } = require("../mailer");
const v = require("../validate");

const router = express.Router();

const BCRYPT_ROUNDS = 10;
const MAX_FAILED_LOGINS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
// Băm sẵn một mật khẩu giả: khi email không tồn tại vẫn so mật khẩu với nó,
// để thời gian trả lời giống hệt trường hợp email có thật (không đoán được email nào tồn tại).
const DUMMY_HASH = bcrypt.hashSync("jadecard-dummy-password", BCRYPT_ROUNDS);

function findUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
}

// ---------- F30: Đăng ký ----------
router.post("/register", async (req, res) => {
  const email = v.normalizeEmail(req.body.email);
  const displayName = v.normalizeDisplayName(req.body.displayName);
  const password = req.body.password;

  v.checkEmail(email);
  v.checkDisplayName(displayName);
  v.checkPassword(password);
  if (req.body.acceptRules !== true) {
    throw new ApiError(400, "Bạn cần đồng ý với Quy định diễn đàn.", { field: "acceptRules" });
  }

  const existing = findUserByEmail(email);
  if (existing) {
    // Đã đăng ký nhưng chưa nhập OTP: gợi ý đi tiếp bước xác thực, không tạo tài khoản mới
    const code = existing.email_verified ? "EMAIL_TAKEN" : "EMAIL_UNVERIFIED";
    throw new ApiError(409, "Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.", {
      field: "email",
      code,
    });
  }
  if (db.prepare("SELECT 1 FROM users WHERE display_name = ?").get(displayName)) {
    throw new ApiError(409, "Tên hiển thị này đã có người dùng.", { field: "displayName" });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const result = db
    .prepare("INSERT INTO users (email, display_name, password_hash, created_at) VALUES (?, ?, ?, ?)")
    .run(email, displayName, passwordHash, nowIso());

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
  const retryAfter = await issueCode(user, "verify");
  res.status(201).json({ email, retryAfter });
});

// ---------- F31: Nhập OTP xác thực email → kích hoạt + đăng nhập luôn ----------
router.post("/verify", (req, res) => {
  const email = v.normalizeEmail(req.body.email);
  const user = findUserByEmail(email);
  if (!user) {
    throw new ApiError(400, "Mã xác thực không đúng.", { field: "code", code: "CODE_WRONG" });
  }
  if (user.email_verified) {
    throw new ApiError(400, "Email này đã được xác thực. Bạn hãy đăng nhập.", { code: "ALREADY_VERIFIED" });
  }

  checkCode(user, "verify", req.body.code);

  db.prepare("UPDATE users SET email_verified = 1 WHERE id = ?").run(user.id);
  startSession(res, user.id);
  res.json({ user: publicUser(user) });
});

// ---------- Chế độ lập trình: xem mã OTP ngay trên trang ----------
// Chỉ bật khi chưa cấu hình Gmail và không chạy production. Khi đã có SMTP_USER / SMTP_PASS
// trong .env, đường dẫn này luôn trả { enabled: false } — mã chỉ còn nằm trong email.
router.get("/dev-code", (req, res) => {
  if (!showCodeOnPage) return res.json({ enabled: false });
  const email = v.normalizeEmail(req.query.email);
  const purpose = req.query.purpose === "reset" ? "reset" : "verify";
  res.json({ enabled: true, code: devCodeFor(email, purpose) });
});

// ---------- Gửi lại OTP (xác thực email hoặc quên mật khẩu) ----------
// Luôn trả lời giống nhau dù email có tồn tại hay không.
router.post("/resend", async (req, res) => {
  const email = v.normalizeEmail(req.body.email);
  const purpose = req.body.purpose === "reset" ? "reset" : "verify";
  const user = findUserByEmail(email);

  let retryAfter = RESEND_WAIT_SECONDS;
  const canSend = user && !user.banned && (purpose === "reset" || !user.email_verified);
  if (canSend) retryAfter = await issueCode(user, purpose);

  res.json({ ok: true, retryAfter });
});

// ---------- F32: Đăng nhập ----------
router.post("/login", async (req, res) => {
  const email = v.normalizeEmail(req.body.email);
  const password = String(req.body.password || "");
  const user = findUserByEmail(email);
  const wrongMessage = "Email hoặc mật khẩu không đúng.";

  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH); // làm chậm như khi có email thật
    throw new ApiError(401, wrongMessage, { field: "password" });
  }

  // Đang bị khóa vì sai mật khẩu 5 lần
  if (user.locked_until && user.locked_until > nowIso()) {
    const minutes = Math.ceil((Date.parse(user.locked_until) - Date.now()) / 60000);
    throw new ApiError(429, `Bạn đã nhập sai mật khẩu 5 lần. Vui lòng thử lại sau ${minutes} phút.`, {
      code: "LOGIN_LOCKED",
    });
  }

  const isCorrect = await bcrypt.compare(password, user.password_hash);
  if (!isCorrect) {
    const failed = user.failed_logins + 1;
    if (failed >= MAX_FAILED_LOGINS) {
      db.prepare("UPDATE users SET failed_logins = 0, locked_until = ? WHERE id = ?").run(nowIso(LOGIN_LOCK_MS), user.id);
      throw new ApiError(429, "Bạn đã nhập sai mật khẩu 5 lần. Tài khoản tạm khóa đăng nhập 15 phút.", {
        code: "LOGIN_LOCKED",
      });
    }
    db.prepare("UPDATE users SET failed_logins = ? WHERE id = ?").run(failed, user.id);
    throw new ApiError(401, wrongMessage, { field: "password" });
  }

  // Mật khẩu đúng: xóa bộ đếm sai
  db.prepare("UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = ?").run(user.id);

  if (user.banned) {
    throw new ApiError(403, "Tài khoản này đã bị khóa do vi phạm Quy định diễn đàn.", { code: "BANNED" });
  }

  // Chưa xác thực email: gửi OTP (nếu đã quá 60 giây từ lần gửi trước) và chuyển sang trang nhập OTP
  if (!user.email_verified) {
    const retryAfter = await issueCode(user, "verify");
    throw new ApiError(403, "Email chưa được xác thực. Hãy nhập mã OTP đã gửi tới email của bạn.", {
      code: "EMAIL_NOT_VERIFIED",
      data: { email: user.email, retryAfter },
    });
  }

  startSession(res, user.id);
  res.json({ user: publicUser(user) });
});

// ---------- F32: Đăng xuất ----------
router.post("/logout", (req, res) => {
  endSession(req, res);
  res.json({ ok: true });
});

// ---------- Người đang đăng nhập (null nếu chưa đăng nhập) ----------
router.get("/me", (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

// ---------- F33: Quên mật khẩu, bước 1: gửi OTP ----------
router.post("/forgot", async (req, res) => {
  const email = v.normalizeEmail(req.body.email);
  v.checkEmail(email);

  const user = findUserByEmail(email);
  let retryAfter = RESEND_WAIT_SECONDS;
  if (user && !user.banned) retryAfter = await issueCode(user, "reset");

  // Thông báo luôn giống nhau dù email có tồn tại hay không (không để lộ ai là thành viên)
  res.json({
    message: "Nếu email này đã đăng ký, bạn sẽ nhận được mã 6 số trong vài phút. Hãy kiểm tra cả thư mục Spam.",
    retryAfter,
  });
});

// ---------- F33: Quên mật khẩu, bước 2: OTP + mật khẩu mới ----------
router.post("/reset", async (req, res) => {
  const email = v.normalizeEmail(req.body.email);
  v.checkPassword(req.body.password);

  const user = findUserByEmail(email);
  if (!user || user.banned) {
    throw new ApiError(400, "Mã xác thực không đúng.", { field: "code", code: "CODE_WRONG" });
  }

  checkCode(user, "reset", req.body.code);

  const passwordHash = await bcrypt.hash(req.body.password, BCRYPT_ROUNDS);
  // Nhận được OTP qua email cũng chứng minh email là thật → đánh dấu đã xác thực
  db.prepare(
    "UPDATE users SET password_hash = ?, email_verified = 1, failed_logins = 0, locked_until = NULL WHERE id = ?"
  ).run(passwordHash, user.id);

  endAllSessions(user.id); // đổi mật khẩu xong: mọi phiên cũ bị đăng xuất
  res.clearCookie("sid", { path: "/" });
  res.json({ ok: true });
});

module.exports = router;
