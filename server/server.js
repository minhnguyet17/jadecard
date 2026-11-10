// ======================================================================
// ĐIỂM KHỞI ĐỘNG SERVER — chạy bằng lệnh: npm start
//   1. Đọc cấu hình (.env)
//   2. Mở CSDL; lần đầu chạy thì tạo bảng và dữ liệu mẫu
//   3. Mở cổng 5500 và (nếu được) mở trình duyệt
// ======================================================================
const { exec } = require("node:child_process");
const config = require("./config");
const { isNew, DB_FILE } = require("./db");
const { seedDatabase } = require("./seed");
const { createApp } = require("./app");
const { useSmtp, checkSmtp } = require("./mailer");
const { upgradeDemoForum } = require("./seed-forum-media");

if (isNew) {
  seedDatabase();
  console.log("Đã tạo CSDL mới kèm dữ liệu mẫu:", DB_FILE);
}
// Ảnh + hashtag cho các topic mẫu (chạy 1 lần, cả với CSDL cũ — không cần db:reset)
upgradeDemoForum();

const app = createApp();

app.listen(config.port, () => {
  const url = `http://localhost:${config.port}`;
  console.log("──────────────────────────────────────────────");
  console.log(` JadeCard đang chạy tại ${url}`);
  console.log(` Gửi OTP: ${useSmtp ? "Gmail " + config.smtpUser + " (đang kiểm tra đăng nhập…)" : "chế độ lập trình — in ra cửa sổ này và hiện trên trang nhập mã"}`);
  console.log(" Dừng server: bấm Ctrl + C");
  console.log("──────────────────────────────────────────────");
  if (config.openBrowser) openBrowser(url);
  if (useSmtp) {
    checkSmtp().then((result) => {
      if (result.ok) console.log(" ✔ Đăng nhập Gmail thành công, OTP sẽ được gửi qua email thật.");
      else console.log(" ✘ Gmail lỗi: " + result.reason);
    });
  }
});

// Mở trình duyệt mặc định (Windows / macOS / Linux)
function openBrowser(url) {
  const command =
    process.platform === "win32" ? `start "" "${url}"` : process.platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`;
  exec(command, () => {}); // mở không được cũng không sao: tự gõ địa chỉ vào trình duyệt
}
