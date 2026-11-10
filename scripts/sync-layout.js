// ======================================================================
// ĐỒNG BỘ HEADER + FOOTER CHO MỌI TRANG — chạy bằng: npm run sync:layout
//
// Header và footer được lặp lại y hệt ở mọi file .html (web tĩnh, không có
// "template"). Thay vì sửa tay từng trang, ta sửa ở index.html rồi chạy script này:
//   1. Chép khối HEADER và FOOTER của index.html sang mọi trang .html khác.
//   2. Đánh dấu mục menu của trang đang mở (aria-current="page").
//   3. Trang nào chưa nạp js/api.js + js/account-menu.js (menu tài khoản) thì thêm vào.
// ======================================================================
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const HEADER = /<!-- =+ HEADER \(dùng chung mọi trang\) =+ -->[\s\S]*?<\/header>/;
const FOOTER = /<!-- =+ FOOTER \(dùng chung mọi trang\) =+ -->[\s\S]*?<\/footer>/;

// Trang → mục menu được tô sáng. Trang không có trong bảng thì không tô mục nào.
const ACTIVE_MENU = {
  "index.html": "index.html",
  "products.html": "products.html",
  "product-detail.html": "products.html",
  "check-card.html": "check-card.html",
  "about.html": "about.html",
  "forum.html": "forum.html",
  "forum-view.html": "forum.html",
  "thread.html": "forum.html",
  "new-thread.html": "forum.html",
  "forum-rules.html": "forum.html",
  "tag.html": "forum.html",
  "profile.html": "forum.html",
  "consign.html": "consign.html",
  "listing.html": "consign.html",
  "new-listing.html": "consign.html",
  "my-listings.html": "consign.html",
};

const source = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const header = source.match(HEADER)[0].replace(/ aria-current="page"/g, "");
const footer = source.match(FOOTER)[0];

const pages = fs.readdirSync(ROOT).filter((file) => file.endsWith(".html"));

for (const page of pages) {
  const file = path.join(ROOT, page);
  let html = fs.readFileSync(file, "utf8");
  if (!HEADER.test(html) || !FOOTER.test(html)) {
    console.log("Bỏ qua (không có khối HEADER/FOOTER):", page);
    continue;
  }

  let pageHeader = header;
  const active = ACTIVE_MENU[page];
  if (active) {
    // Thêm aria-current vào cả menu máy tính lẫn menu điện thoại
    pageHeader = pageHeader.split(`<a href="${active}">`).join(`<a href="${active}" aria-current="page">`);
  }

  html = html.replace(HEADER, () => pageHeader).replace(FOOTER, () => footer);

  // Menu tài khoản cần 3 file JS; chèn ngay sau js/cart.js nếu trang còn thiếu
  if (!html.includes('src="js/account-menu.js"')) {
    html = html.replace(
      '<script src="js/cart.js"></script>',
      '<script src="js/cart.js"></script>\n  <script src="js/api.js"></script>\n  <script src="js/community-ui.js"></script>\n  <script src="js/account-menu.js"></script>'
    );
  }

  fs.writeFileSync(file, html);
  console.log("Đã đồng bộ:", page);
}
