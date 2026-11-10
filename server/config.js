// ======================================================================
// CẤU HÌNH: đọc từ file .env (không đưa lên GitHub). Mẫu ở .env.example.
// Thiếu file .env thì dùng giá trị mặc định cho máy cá nhân.
// ======================================================================
const fs = require("node:fs");
const path = require("node:path");

const envFile = path.join(__dirname, "..", ".env");
if (fs.existsSync(envFile) && process.env.NODE_ENV !== "test") {
  process.loadEnvFile(envFile); // có sẵn trong Node.js, không cần thư viện dotenv
}

const config = {
  port: Number(process.env.PORT) || 5500,
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",

  // Khóa bí mật để băm mã OTP. Khi demo thật phải đặt chuỗi ngẫu nhiên dài trong .env.
  secret: process.env.SESSION_SECRET || "jadecard-dev-secret-chi-dung-tren-may-ca-nhan",

  // Gửi mail qua Gmail. Để trống → OTP chỉ in ra cửa sổ dòng lệnh (chế độ lập trình).
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  mailFrom: process.env.MAIL_FROM || "JadeCard <no-reply@jadecard.vn>",

  // Mở trình duyệt khi chạy npm start (đặt OPEN_BROWSER=0 để tắt)
  openBrowser: process.env.OPEN_BROWSER !== "0",
};

if (!process.env.SESSION_SECRET && config.isProduction) {
  throw new Error("Thiếu SESSION_SECRET trong file .env");
}

module.exports = config;
