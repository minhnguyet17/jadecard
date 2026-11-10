// ======================================================================
// GỬI THỬ MỘT EMAIL OTP để kiểm tra cấu hình Gmail trong .env
//   npm run mail:test                      → gửi tới chính SMTP_USER
//   npm run mail:test -- ban@example.com   → gửi tới địa chỉ khác
// Mã trong thư thử là mã giả 123456, không dùng để đăng nhập được.
// ======================================================================
const config = require("../server/config");
const nodemailer = require("nodemailer");
const { explainSmtpError, htmlBody, plainText, SUBJECTS } = require("../server/mailer");

async function main() {
  if (!config.smtpUser || !config.smtpPass) {
    console.log("Chưa cấu hình Gmail: hãy điền SMTP_USER và SMTP_PASS trong file .env (xem hướng dẫn trong .env.example).");
    process.exit(1);
  }
  const to = process.argv[2] || config.smtpUser;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: config.smtpUser, pass: config.smtpPass.replace(/\s+/g, "") },
  });

  console.log(`Đang đăng nhập Gmail ${config.smtpUser}…`);
  try {
    await transporter.verify();
    console.log("✔ Đăng nhập thành công. Đang gửi thư thử tới " + to + "…");
    const info = await transporter.sendMail({
      from: config.mailFrom,
      to,
      subject: "[Thư thử] " + SUBJECTS.verify,
      text: plainText("123456", "verify"),
      html: htmlBody("123456", "verify"),
    });
    console.log("✔ Đã gửi. Mã thư: " + info.messageId);
    console.log("  Mở hộp thư " + to + " (xem cả mục Spam / Quảng cáo nếu chưa thấy).");
  } catch (error) {
    console.log("✘ " + explainSmtpError(error));
    process.exit(1);
  }
}

main();
