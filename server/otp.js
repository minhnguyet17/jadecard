// ======================================================================
// MÃ OTP 6 SỐ (F31 xác thực email, F33 quên mật khẩu)
// Quy tắc:
//   - Hết hạn sau 10 phút.
//   - Nhập sai tối đa 5 lần, sau đó mã hết hiệu lực, phải gửi mã mới.
//   - Chỉ được gửi lại sau 60 giây.
//   - CSDL chỉ lưu bản băm (HMAC-SHA256) của mã.
// ======================================================================
const crypto = require("node:crypto");
const { db, nowIso } = require("./db");
const config = require("./config");
const { ApiError } = require("./errors");
const { sendOtpEmail, explainSmtpError } = require("./mailer");

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_WAIT_SECONDS = 60;
const MAX_ATTEMPTS = 5;

function hashCode(code) {
  return crypto.createHmac("sha256", config.secret).update(String(code)).digest("hex");
}

function latestCode(userId, purpose) {
  return db
    .prepare("SELECT * FROM email_codes WHERE user_id = ? AND purpose = ? ORDER BY id DESC LIMIT 1")
    .get(userId, purpose);
}

// Số giây còn phải chờ trước khi được gửi mã mới (0 = gửi được ngay)
function secondsUntilResend(userId, purpose) {
  const last = latestCode(userId, purpose);
  if (!last) return 0;
  const elapsed = (Date.now() - Date.parse(last.created_at)) / 1000;
  return Math.max(0, Math.ceil(RESEND_WAIT_SECONDS - elapsed));
}

// Tạo mã mới và gửi email. Trả về số giây phải chờ trước lần gửi tiếp theo.
async function issueCode(user, purpose) {
  const wait = secondsUntilResend(user.id, purpose);
  if (wait > 0) return wait; // vừa gửi xong, chưa cho gửi lại

  // randomInt dùng bộ sinh số ngẫu nhiên an toàn (không dùng Math.random cho mã bảo mật)
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");

  // Mỗi người chỉ có 1 mã còn hiệu lực cho mỗi mục đích: xóa mã cũ trước
  db.prepare("DELETE FROM email_codes WHERE user_id = ? AND purpose = ?").run(user.id, purpose);
  const inserted = db
    .prepare(
      "INSERT INTO email_codes (user_id, purpose, code_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)"
    )
    .run(user.id, purpose, hashCode(code), nowIso(CODE_TTL_MS), nowIso());

  try {
    await sendOtpEmail(user.email, code, purpose);
  } catch (error) {
    // Gửi mail lỗi thì xóa mã vừa tạo, để người dùng bấm gửi lại được ngay
    db.prepare("DELETE FROM email_codes WHERE id = ?").run(inserted.lastInsertRowid);
    console.error("Lỗi gửi email:", explainSmtpError(error));
    throw new ApiError(502, "Không gửi được email lúc này. Vui lòng thử lại sau ít phút.");
  }
  return RESEND_WAIT_SECONDS;
}

// Kiểm tra mã người dùng nhập. Đúng thì xóa mã (mỗi mã chỉ dùng 1 lần), sai thì báo lỗi.
function checkCode(user, purpose, code) {
  const row = latestCode(user.id, purpose);
  const resendHint = 'Hãy bấm "Gửi lại mã" để nhận mã mới.';

  if (!row || row.expires_at < nowIso()) {
    throw new ApiError(400, "Mã đã hết hạn. " + resendHint, { code: "CODE_EXPIRED", field: "code" });
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    throw new ApiError(400, "Bạn đã nhập sai 5 lần nên mã này không còn hiệu lực. " + resendHint, {
      code: "CODE_LOCKED",
      field: "code",
    });
  }

  const isMatch = /^\d{6}$/.test(String(code)) && crypto.timingSafeEqual(
    Buffer.from(hashCode(code), "hex"),
    Buffer.from(row.code_hash, "hex")
  );

  if (!isMatch) {
    const attempts = row.attempts + 1;
    db.prepare("UPDATE email_codes SET attempts = ? WHERE id = ?").run(attempts, row.id);
    const left = MAX_ATTEMPTS - attempts;
    const message =
      left > 0
        ? `Mã xác thực không đúng. Bạn còn ${left} lần thử.`
        : "Mã xác thực không đúng. Bạn đã sai 5 lần nên mã này không còn hiệu lực. " + resendHint;
    throw new ApiError(400, message, { code: left > 0 ? "CODE_WRONG" : "CODE_LOCKED", field: "code", data: { attemptsLeft: left } });
  }

  db.prepare("DELETE FROM email_codes WHERE id = ?").run(row.id);
}

module.exports = { issueCode, checkCode, secondsUntilResend, RESEND_WAIT_SECONDS };
