# Project Instructions for AI

## 1. Project context
Đây là đồ án website thương mại điện tử **JadeCard** của sinh viên (học phần Phát triển ứng dụng WEB/TMĐT). JadeCard bán thẻ bài Pokémon TCG (hàng nguyên hộp và thẻ lẻ). Tính năng khác biệt là **Check thẻ**: ảnh → OCR → giá VND → lưu vào Bộ sưu tập hoặc bán thẻ cho shop.

Dự án do **một sinh viên** thực hiện, trình độ mới học lập trình web. Mã nguồn phải **đơn giản đến mức sinh viên tự giải thích được từng dòng**.

## 2. Scope
- Chỉ triển khai các chức năng đã được thống nhất trong [REQUIREMENTS.md](REQUIREMENTS.md) **v2.1** (F01–F22; F15 thuộc mục Nâng cao, F16 là một lối vào của F17; cộng đồng F27, F30–F56 theo [docs/ke-hoach-cong-dong.md](docs/ke-hoach-cong-dong.md)). Giao diện Stitch chỉ là tham khảo phong cách; phần nào không theo kế hoạch thì bỏ ([docs/stitch-review-cong-dong.md](docs/stitch-review-cong-dong.md)).
- Shop **chỉ bán Pokémon TCG**. Check thẻ chỉ hỗ trợ thẻ Pokémon **bản tiếng Anh**.
- Thu mua **giữ đơn giản**: web chỉ nhận yêu cầu bán (mỗi yêu cầu một thẻ). Kiểm định, chốt giá và trả tiền diễn ra tại cửa hàng. Không làm gửi bưu điện hay thanh toán thu mua online.
- Không tự thêm chức năng thuộc mục "Ngoài phạm vi" hoặc "Nâng cao" (thanh toán online, chatbot, P2P, escrow, nhắn tin riêng, theo dõi / thông báo, đăng nhập mạng xã hội...). Ký gửi chỉ theo mô hình **ký gửi tại cửa hàng** (v2.0): không giữ tiền online, không gửi bưu điện, không lưu số tài khoản của người bán.
- **Đơn hàng:** giá và tồn kho luôn lấy ở server (`server/products.js` đọc `js/data/products.js`; tồn kho trong bảng `product_stock`), không tin giá trình duyệt gửi. Xác nhận đơn mới trừ kho; hủy đơn hoàn kho đúng một lần (`server/orders.js`).
- Tôn trọng phạm vi của từng buổi học:
  - **Buổi 2:** HTML5 và CSS (viết bằng SCSS, biên dịch ra `css/style.css`). Không viết JavaScript nghiệp vụ.
  - **Buổi 3:** JavaScript thuần và localStorage.
  - **Giai đoạn 4A (cộng đồng, từ 09/11/2026):** backend **Node.js + Express 5 + SQLite** (`node:sqlite`) trong `server/`. Các trang cửa hàng cũ vẫn phải mở được bằng file:// (không bắt buộc server).
  - Ngoại lệ đã được đồng ý: three.js cho thẻ 3D ở trang chủ. **Không dùng framework CSS** (đề Buổi 2 cấm; Tailwind đã được gỡ ngày 08/11/2026).

## 3. Coding principles
- **Công nghệ:** HTML5, **CSS3 viết bằng SCSS** trong `scss/` (Sass 1.83.4, biên dịch bằng `npm run build:css` ra `css/style.css`), **JavaScript thuần (vanilla)**. Không dùng React, Vue, jQuery, Bootstrap, Tailwind hay bundler.
- **CSS:** chỉ sửa file trong `scss/`, không sửa tay `css/style.css` (sẽ bị ghi đè). Sau khi sửa SCSS phải biên dịch lại và đưa cả `css/style.css` lên repo, để mở `index.html` trực tiếp vẫn chạy. Đặt tên class theo ý nghĩa, kiểu BEM (`.product-card__price`, `.btn--primary`); màu, cỡ chữ, điểm ngắt lấy từ `scss/abstracts/_variables.scss`.
- Thư viện bên ngoài đã được duyệt: **three.js r159** (chỉ cho thẻ 3D trang chủ, `js/hero-3d.js`), **Tesseract.js** (cho OCR, giai đoạn sau). Công cụ phát triển: `sass`. Backend (chạy trên server, không gửi xuống trình duyệt): `express`, `cookie-parser`, `bcryptjs`, `multer`, `nodemailer`. Không thêm thư viện khác khi chưa được đồng ý.
- **Backend:** mỗi nhóm API một file trong `server/routes/`. Lỗi trả về JSON `{ error, code, field }` qua `ApiError` (`server/errors.js`). **Mọi quyền kiểm tra ở server** (`requireLogin`, `requireRole` trong `server/session.js`). Thông tin người dùng gửi ra ngoài chỉ qua `publicUser()` (không bao giờ có email, mật khẩu băm). Chạy `npm test` sau khi sửa API.
- **Chống XSS:** server lưu chữ thuần; giao diện luôn đi qua `escapeHtml()` / `formatPostContent()` (`js/community-ui.js`) trước khi chèn HTML.
- Header và footer được lặp lại giống hệt nhau ở mọi trang HTML. Chỉ sửa trong `index.html`, rồi chạy `npm run sync:layout` để chép sang mọi trang. Thẻ sản phẩm chỉ tạo bằng `createProductCard()` (`js/product-card.js`); nút nào có `data-add-id` sẽ tự thêm vào giỏ (xử lý chung trong `js/cart.js`). Nguồn dữ liệu thẻ và giá đã được duyệt là **TCGdex API** (`https://api.tcgdex.net/v2/en/...`). **Không dùng pokemontcg.io** vì dịch vụ đã ngừng phát triển.
- Giữ mã nguồn dễ đọc và dễ bảo trì: tên biến bằng tiếng Anh, có ý nghĩa; mỗi hàm làm một việc; chú thích tiếng Việt ở những chỗ có nghiệp vụ (công thức giá, trạng thái).
- Tách rõ: `css/`, `js/`, `js/data/`, `images/`. Dữ liệu tách khỏi logic hiển thị. Dữ liệu sản phẩm duy nhất ở `js/data/products.js`; giỏ hàng chỉ qua các hàm trong `js/cart.js` (khóa localStorage `cart`).
- Gom phần gọi API giá vào một chỗ (vd. `js/services/price-service.js`) để dễ đổi nguồn giá.
- Không thay đổi kiến trúc lớn khi chưa được đồng ý.
- Không tự ý xóa chức năng đang hoạt động.
- Ưu tiên thay đổi nhỏ, kiểm tra được.

## 4. Workflow
Trước khi sửa mã nguồn:
1. Đọc các tài liệu liên quan (REQUIREMENTS.md, docs/business-workflow.md).
2. Phân tích hiện trạng.
3. Đề xuất phương án (nêu file sẽ sửa, mã chức năng F-xx liên quan).
4. Chờ xác nhận.

Sau khi sửa mã nguồn:
1. Giải thích các thay đổi bằng tiếng Việt, dễ hiểu với người mới học.
2. Nêu các file đã sửa.
3. Hướng dẫn chạy và kiểm thử theo **tiêu chí nghiệm thu** của chức năng.
4. Báo cáo các giới hạn còn tồn tại.

## 5. Security
- Không đưa mật khẩu, API key hoặc token vào mã nguồn hay repo. Cấu hình bí mật để trong `.env` (mẫu: `.env.example`); `.env` và `data/` (CSDL, ảnh tải lên) không đưa lên repo.
- Không tự ý vô hiệu hóa kiểm tra bảo mật hoặc kiểm tra dữ liệu đầu vào.
- Không sử dụng dữ liệu cá nhân thật. Dùng dữ liệu mẫu.
- Không thu thập thông tin nhận tiền (số tài khoản) của khách bán thẻ, vì việc trả tiền diễn ra tại quầy.

## 6. Communication
- Trả lời bằng tiếng Việt.
- Nếu yêu cầu chưa rõ, hãy hỏi lại trước khi triển khai.
- Nếu một yêu cầu vượt phạm vi buổi học hoặc REQUIREMENTS.md, hãy nói rõ và đề xuất đưa vào mục "Nâng cao".
