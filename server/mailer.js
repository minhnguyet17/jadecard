// ======================================================================
// GỬI MÃ OTP QUA EMAIL (F31, F33)
//   - Chế độ demo: gửi thật qua Gmail bằng Mật khẩu ứng dụng (App Password), thư viện Nodemailer.
//     Cấu hình SMTP_USER / SMTP_PASS trong file .env (xem .env.example).
//   - Chế độ lập trình (chưa có SMTP_USER / SMTP_PASS): không gửi mail thật,
//     in mã ra cửa sổ dòng lệnh VÀ hiện mã ngay trên trang nhập OTP (để máy chưa cấu hình
//     Gmail, ví dụ máy chấm bài, vẫn đăng ký được). Chế độ production không bao giờ lộ mã.
// ======================================================================
const nodemailer = require("nodemailer");
const config = require("./config");

const useSmtp = Boolean(config.smtpUser && config.smtpPass);
// Chỉ hiện mã trên trang khi chưa cấu hình Gmail, không phải production, không phải bài kiểm thử
const showCodeOnPage = !useSmtp && !config.isProduction && !config.isTest;

const transporter = useSmtp
  ? nodemailer.createTransport({
      service: "gmail",
      // App Password Google hiển thị dạng "abcd efgh ijkl mnop": bỏ khoảng trắng cho chắc
      auth: { user: config.smtpUser, pass: config.smtpPass.replace(/\s+/g, "") },
    })
  : null;

// Bài kiểm thử tự động đọc mã OTP từ mảng này (chỉ dùng khi NODE_ENV=test)
const testOutbox = [];
// Chế độ lập trình: mã gần nhất của từng email (để trang nhập OTP hiện ra)
const devCodes = new Map();

const SUBJECTS = {
  verify: "Mã xác thực email JadeCard",
  reset: "Mã đặt lại mật khẩu JadeCard",
};

const INTROS = {
  verify: "Cảm ơn bạn đã đăng ký JadeCard. Nhập mã dưới đây để kích hoạt tài khoản:",
  reset: "Bạn vừa yêu cầu đặt lại mật khẩu JadeCard. Nhập mã dưới đây để tạo mật khẩu mới:",
};

function plainText(code, purpose) {
  return (
    INTROS[purpose] + "\n\n" +
    `Mã của bạn là: ${code}\n\n` +
    "Mã có hiệu lực trong 10 phút. Không chia sẻ mã này với bất kỳ ai, kể cả nhân viên JadeCard.\n" +
    "Nếu bạn không yêu cầu mã này, hãy bỏ qua email.\n\n" +
    "JadeCard — website đồ án môn Phát triển ứng dụng WEB/TMĐT"
  );
}

// Thư HTML đơn giản: CSS viết thẳng vào thẻ (inline) vì Gmail bỏ thẻ <style>
function htmlBody(code, purpose) {
  const digits = code
    .split("")
    .map(
      (d) =>
        `<td style="width:44px;height:54px;background:#13151f;border:1px solid #2c3145;border-radius:10px;` +
        `font:700 28px/54px Consolas,monospace;color:#5eead4;text-align:center">${d}</td>`
    )
    .join('<td style="width:8px"></td>');
  return `<!doctype html>
<html lang="vi"><body style="margin:0;padding:0;background:#0b0c12">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0c12;padding:32px 12px">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#171a26;border:1px solid #262b3d;border-radius:16px;font-family:Arial,Helvetica,sans-serif;color:#e5e7eb">
    <tr><td style="padding:28px 28px 8px">
      <p style="margin:0;font-size:22px;font-weight:800;letter-spacing:.5px;color:#ffffff">Jade<span style="color:#5eead4">Card</span></p>
      <p style="margin:4px 0 0;font-size:12px;color:#9ca3af">Shop thẻ Pokémon TCG · Cộng đồng thợ săn</p>
    </td></tr>
    <tr><td style="padding:16px 28px 0">
      <h1 style="margin:0 0 12px;font-size:20px;color:#ffffff">${SUBJECTS[purpose]}</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#d1d5db">${INTROS[purpose]}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px"><tr>${digits}</tr></table>
      <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#d1d5db">Mã có hiệu lực trong <strong style="color:#ffffff">10 phút</strong>. Nhập sai 5 lần thì mã hết hiệu lực.</p>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#fbbf24">Không chia sẻ mã này với bất kỳ ai, kể cả nhân viên JadeCard.</p>
    </td></tr>
    <tr><td style="padding:16px 28px 24px;border-top:1px solid #262b3d;font-size:12px;line-height:1.6;color:#6b7280">
      Nếu bạn không yêu cầu mã này, hãy bỏ qua email — tài khoản của bạn vẫn an toàn.<br>
      JadeCard là website đồ án môn Phát triển ứng dụng WEB/TMĐT (bản demo).
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

async function sendOtpEmail(to, code, purpose) {
  if (config.isTest) {
    testOutbox.push({ to, code, purpose });
    return;
  }

  if (!useSmtp) {
    devCodes.set(to, { code, purpose });
    console.log("\n┌──────────────────────────────────────────────");
    console.log(`│ [Chế độ lập trình] OTP gửi tới ${to}`);
    console.log(`│ ${SUBJECTS[purpose]}: ${code}`);
    console.log("└──────────────────────────────────────────────\n");
    return;
  }

  await transporter.sendMail({
    from: config.mailFrom,
    to,
    subject: SUBJECTS[purpose],
    text: plainText(code, purpose),
    html: htmlBody(code, purpose),
  });
  console.log(`Đã gửi email OTP (${purpose}) tới ${to}`);
}

// Chế độ lập trình: mã gần nhất của email này (null nếu đang gửi Gmail thật)
function devCodeFor(email, purpose) {
  if (!showCodeOnPage) return null;
  const entry = devCodes.get(email);
  return entry && entry.purpose === purpose ? entry.code : null;
}

// Kiểm tra đăng nhập Gmail khi server khởi động, báo lỗi dễ hiểu nếu sai App Password
async function checkSmtp() {
  if (!useSmtp) return { ok: false, reason: "not-configured" };
  try {
    await transporter.verify();
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: explainSmtpError(error) };
  }
}

function explainSmtpError(error) {
  if (error.code === "EAUTH" || /535|Username and Password not accepted/i.test(error.message)) {
    return (
      "Gmail từ chối đăng nhập. Kiểm tra SMTP_USER và SMTP_PASS trong .env: SMTP_PASS phải là " +
      "Mật khẩu ứng dụng 16 ký tự (không phải mật khẩu Gmail thường) và tài khoản phải bật Xác minh 2 bước."
    );
  }
  if (["ECONNECTION", "ETIMEDOUT", "ESOCKET", "EDNS"].includes(error.code)) {
    return "Không kết nối được máy chủ Gmail (smtp.gmail.com). Kiểm tra Internet hoặc tường lửa.";
  }
  return error.message;
}

module.exports = { sendOtpEmail, testOutbox, useSmtp, showCodeOnPage, devCodeFor, checkSmtp, explainSmtpError, htmlBody, plainText, SUBJECTS };
