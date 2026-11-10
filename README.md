# JadeCard — Cửa hàng thẻ bài Pokémon TCG có "Check thẻ"

> **jadecard.vn**: "Jade" đọc gần giống "trade" (trao đổi), đồng thời là tên chủ dự án.
> Đồ án học phần **Phát triển ứng dụng WEB/TMĐT**, nhóm đề tài **A: Website bán hàng chuyên biệt**.

## 1. Giới thiệu

JadeCard là website thương mại điện tử chuyên bán **thẻ bài Pokémon TCG**, bao gồm hàng nguyên hộp (booster pack, booster box, Elite Trainer Box, tin) và **thẻ lẻ (single card)**.

**Vấn đề kinh doanh.** Người chơi và người sưu tầm thẻ ở Việt Nam gặp ba khó khăn:

1. **Không biết thẻ mình đang có đáng giá bao nhiêu.** Giá thẻ được niêm yết trên các sàn quốc tế (TCGplayer, Cardmarket) bằng USD hoặc EUR, và phải tra thủ công từng thẻ.
2. **Khó bán lại thẻ hiếm** với giá minh bạch. Hiện người chơi chủ yếu rao bán trong các nhóm Facebook, dễ bị ép giá hoặc gặp lừa đảo.
3. **Khó mua đúng thẻ lẻ Pokémon mình cần.** Khảo sát website của 3 shop TCG trong nước (tgbstore.com.vn, saigontcg.com, herogame.vn, ngày 07/11/2026) cho thấy **không website nào bán thẻ lẻ Pokémon**. Mục "Pokemon Single" của SaigonTCG trống, và tìm "pikachu" trên hai shop không ra kết quả nào.

> Ba vấn đề trên là **cơ hội quan sát được trong phạm vi khảo sát website**, chưa xét các kênh bán qua Facebook hay cửa hàng trực tiếp. Nhu cầu thực tế đang được kiểm tra bằng một khảo sát nhỏ người chơi ([docs/customer-survey.md](docs/customer-survey.md)).

**Giải pháp và điểm khác biệt: tính năng "Check thẻ".** Người dùng chụp ảnh thẻ, hệ thống dùng OCR đọc tên và số thẻ, người dùng xác nhận đúng thẻ và biến thể, rồi hệ thống lấy **giá tham khảo quốc tế quy đổi ra VND**. Từ kết quả đó, người dùng có thể:
- **lưu thẻ vào Bộ sưu tập** (*Đang có* / *Đang săn*) để theo dõi tổng giá tham khảo và biết khi nào shop có thẻ mình đang săn;
- **gửi yêu cầu bán thẻ cho JadeCard** và biết ngay giá thu mua dự kiến. Chủ shop kiểm tra yêu cầu trước, sau đó khách **mang thẻ đến cửa hàng** để kiểm định và nhận tiền tại quầy.

JadeCard thu mua thẻ hiếm, kiểm định, rồi đăng bán lại dưới dạng thẻ lẻ cho những người đang tìm thẻ đó. Mô hình này tạo thành vòng khép kín: **mua từ cộng đồng, bán lại cho cộng đồng**.

## 2. Khách hàng mục tiêu

- **Người sưu tầm Pokémon TCG** từ 16 đến 35 tuổi, chủ yếu là học sinh, sinh viên và người đi làm trẻ ở các thành phố lớn. Họ mở pack thường xuyên, có nhiều thẻ trùng hoặc thẻ hiếm muốn bán.
- **Người chơi thi đấu** cần mua đúng thẻ lẻ để hoàn thiện bộ bài.
- **Phụ huynh hoặc người mua quà** cần sản phẩm chính hãng, giá rõ ràng.

## 3. Chức năng chính

| Nhóm | Chức năng |
|---|---|
| Mua hàng | Danh sách và chi tiết sản phẩm (hàng nguyên hộp và thẻ lẻ), tìm kiếm và lọc, giỏ hàng, đặt hàng, theo dõi đơn |
| **Check thẻ (USP)** | Chụp hoặc tải ảnh thẻ → OCR → chọn đúng thẻ và biến thể → xem giá tham khảo quốc tế quy đổi VND và giá thu mua dự kiến |
| **Bộ sưu tập** | Tab *Đang có* (tổng giá tham khảo), tab *Đang săn* (báo khi shop có hàng), lưu trên trình duyệt |
| **Bán thẻ cho shop** | Gửi yêu cầu thu mua (mỗi yêu cầu một thẻ), theo dõi trạng thái; kiểm định, chốt giá và trả tiền tại cửa hàng |
| Quản trị | Quản lý sản phẩm, đơn hàng, yêu cầu thu mua (kiểm tra online → giao dịch tại quầy → nhập kho thẻ lẻ), cấu hình tỉ giá và % thu mua |

Chi tiết xem tại [REQUIREMENTS.md](REQUIREMENTS.md).

## 4. Thành viên

Dự án được thực hiện bởi **một thành viên**, kiêm nhiệm tất cả vai trò:

- **Jade**: Trưởng dự án / BA · UI/UX · Frontend · Backend/Database · QA/Tích hợp

Cách chia nhỏ công việc cho một người được trình bày trong [PROJECT_PLAN.md](PROJECT_PLAN.md).

## 5. Công nghệ

| Thành phần | Công nghệ | Ghi chú |
|---|---|---|
| Giao diện | HTML5, **CSS3 viết bằng SCSS (Sass 1.83.4)**, biên dịch ra `css/style.css`; Flexbox, Grid, media query | Không dùng framework CSS. SCSS chỉ giúp viết gọn (biến màu, mixin, chia file); trình duyệt đọc file CSS thường |
| Tương tác | **JavaScript thuần** (không framework) | Buổi 3 |
| Hiệu ứng trang chủ | **three.js r159** | Thẻ Charizard 3D; nếu trình duyệt không hỗ trợ WebGL thì tự quay về ảnh tĩnh |
| Lưu trữ phía trình duyệt | localStorage (khóa `cart`) | Giỏ hàng (Buổi 3), bộ sưu tập khi chưa đăng nhập (giai đoạn sau) |
| OCR | **Tesseract.js** | Chạy ngay trên trình duyệt, miễn phí, không cần server |
| Dữ liệu thẻ và giá | **TCGdex API** (giá TCGplayer theo biến thể) | Đã kiểm tra ngày 07/11/2026: miễn phí, không cần key, cho phép gọi từ trình duyệt. Không dùng pokemontcg.io vì dịch vụ đã ngừng phát triển. Dự phòng: file giá mẫu (JSON) có nhãn "Dữ liệu mô phỏng". |
| Backend | **Node.js (≥ 22.13) + Express 5** | Phục vụ web tĩnh và API `/api/...` trên cùng cổng 5500. Chốt ngày 09/11/2026 (Q1, kế hoạch cộng đồng) |
| CSDL | **SQLite** qua module có sẵn `node:sqlite` | Một file `data/jadecard.db`, tự tạo kèm dữ liệu mẫu khi chạy lần đầu |
| Tài khoản | bcryptjs (băm mật khẩu), cookie phiên httpOnly, OTP 6 số qua **Nodemailer** (Gmail App Password) | Khi lập trình, OTP được in ra cửa sổ dòng lệnh, không cần Gmail |
| Tải ảnh | multer | Ảnh bài viết diễn đàn: JPG / PNG / WebP, ≤ 5MB, tối đa 4 ảnh; server kiểm tra nội dung file |
| Kiểm thử API | `node:test` có sẵn trong Node.js | `npm test` |
| Quản lý mã nguồn | Git, GitHub (Issues) | |
| Hỗ trợ AI | Claude (phân tích, hỗ trợ lập trình), một công cụ AI khác để phản biện | Xem [AI_USAGE_LOG.md](AI_USAGE_LOG.md) |

## 6. Website hiện tại (Buổi 3 + Cộng đồng: tài khoản, diễn đàn, ký gửi)

### Cấu trúc thư mục

```
jadecard-tcg-shop/
├── index.html            Trang chủ (mời mua pack + thẻ Charizard 3D, hàng nguyên hộp, thẻ lẻ, vòng Mua–Check–Bán–Trade)
├── products.html         Danh sách sản phẩm + tìm kiếm, lọc, sắp xếp
├── product-detail.html   Chi tiết sản phẩm (product-detail.html?id=...)
├── cart.html             Giỏ hàng
├── about.html            Giới thiệu cửa hàng + chính sách thu mua + liên hệ
├── check-card.html       Giao diện Check thẻ (bản tĩnh, chức năng làm ở giai đoạn sau)
├── register.html         Đăng ký (F30)          ┐
├── verify.html           Nhập OTP 6 số (F31)    │ Tài khoản
├── login.html            Đăng nhập (F32)        │ (cần chạy server)
├── forgot-password.html  Quên mật khẩu (F33)    ┘
├── forum.html            Trang chủ diễn đàn + thành viên nổi bật tuần (F34, F53)
├── forum-view.html       Danh sách topic của một forum (?f=F368), lọc theo tag (F35)
├── thread.html           Xem topic, trả lời, trích dẫn, like, sửa bài (F36, F38, F39)
├── new-thread.html       Tạo topic, tối đa 4 ảnh (F37)
├── profile.html          Hồ sơ thành viên (?u=Tên), chức vụ, topic gần đây (F41)
├── forum-rules.html      Quy định diễn đàn
├── consign.html          Trang Ký gửi: thẻ đã kiểm định đang bán, lọc theo set / tình trạng / giá (F45)
├── listing.html          Chi tiết tin ký gửi (?id=), mua, trả giá, đánh giá người bán (F46, F47, F55, F56)
├── new-listing.html      Đăng tin ký gửi 4 bước (F43)
├── my-listings.html      Tin ký gửi của tôi: trạng thái, rút tin, trả lời trả giá (F48, F55)
├── collection.html       Bộ sưu tập Đang có / Đang săn, cài đặt riêng tư (F13, F14, F27)
├── orders.html           Đơn hàng của tôi + đánh giá người bán (F07, F56)
├── admin-consignments.html  Admin: kiểm định tại quầy, tất toán (F44, F49)
├── admin-orders.html     Admin: xác nhận / giao / hoàn thành / hủy đơn, trừ và hoàn kho (F20)
├── moderation.html       Mod + Admin: báo cáo bài vi phạm (F42)
├── server/               Backend (Node.js + Express + SQLite)
│   ├── server.js           Điểm khởi động (npm start)
│   ├── app.js              Gắn API + phục vụ web tĩnh (chỉ mở css/, js/, images/, uploads/ và các trang .html)
│   ├── schema.sql          Các bảng CSDL
│   ├── seed.js             Dữ liệu mẫu (thành viên, forum, topic, like)
│   ├── seed-shop.js        Dữ liệu mẫu ký gửi, đơn hàng, bộ sưu tập, trả giá, đánh giá, topic Mua bán
│   ├── routes/             API: auth, forum, moderation, users, collection, listings, orders, admin
│   ├── consign.js          Quy tắc ký gửi: hoa hồng 8% (tối thiểu 20.000 ₫), hạn 7 / 60 ngày, trả giá 48 giờ, giữ 24 giờ
│   ├── orders.js           Nghiệp vụ đơn: xác nhận trừ kho, hủy hoàn kho đúng một lần
│   ├── products.js         Đọc js/data/products.js để lấy giá thật khi đặt hàng; tồn kho trong bảng product_stock
│   └── db.js, session.js, otp.js, mailer.js, uploads.js, cards.js, ranks.js, validate.js, errors.js, users.js, config.js
├── tests/api.test.js     30 ca kiểm thử API tự động (npm test)
├── scripts/sync-layout.js Chép header + footer của index.html sang mọi trang (npm run sync:layout)
├── data/                 CSDL + ảnh tải lên (tự tạo, KHÔNG đưa lên GitHub)
├── .env.example          Mẫu cấu hình (sao chép thành .env; .env KHÔNG đưa lên GitHub)
├── scss/                 Mã nguồn CSS (sửa ở đây)
│   ├── main.scss           File chính, gom các phần bên dưới
│   ├── abstracts/          Biến (màu, font, cỡ chữ, điểm ngắt) và mixin
│   ├── base/               Reset trình duyệt, kiểu chung, lớp tiện ích nhỏ
│   ├── layout/             Header, footer, khung trang
│   ├── components/         Nút, ô nhập, thẻ sản phẩm, thanh mua nhanh
│   └── pages/              Phần riêng của từng trang
├── css/style.css         CSS đã biên dịch từ scss/ (KHÔNG sửa tay)
├── js/
│   ├── data/products.js    Dữ liệu 15 sản phẩm dùng chung
│   ├── utils.js            formatVND(), findProductById()
│   ├── cart.js             Giỏ hàng + localStorage + số trên biểu tượng giỏ
│   ├── product-card.js     createProductCard(): thẻ sản phẩm dùng chung (trang chủ + danh sách)
│   ├── home.js             Trang chủ: lưới sản phẩm, tồn kho, thanh mua nhanh
│   ├── products-page.js    renderProducts(), tìm kiếm / lọc / sắp xếp
│   ├── product-detail.js   Đọc ?id= bằng URLSearchParams, thêm vào giỏ
│   ├── cart-page.js        Tăng / giảm / xóa, thành tiền, tổng tiền
│   ├── hero-3d.js          Thẻ 3D bằng three.js
│   ├── api.js              Gọi API server, người đang đăng nhập (getCurrentUser)
│   ├── community-ui.js     Avatar, tag chức vụ, thời gian, nội dung bài viết an toàn (chống XSS), phân trang
│   ├── account-menu.js     Menu tài khoản trên header (Đăng nhập / avatar + chức vụ)
│   ├── auth-forms.js       Hàm dùng chung cho form: báo lỗi, hiện mật khẩu, độ mạnh mật khẩu, nút gửi lại OTP
│   ├── post-editor.js      Ô soạn bài / chọn ảnh: in đậm, xem trước ảnh, giới hạn số ảnh
│   ├── config.js           Tỉ giá, hoa hồng, phí ship (bản phía trình duyệt; server luôn tính lại)
│   ├── card-service.js     Tra thẻ và giá tham khảo trên TCGdex (mọi lần gọi TCGdex nằm ở đây)
│   ├── card-picker.js      Ô chọn thẻ + biến thể dùng chung (Bộ sưu tập, Đăng tin ký gửi)
│   ├── collection-store.js Lưu bộ sưu tập: trình duyệt khi chưa đăng nhập, server khi đã đăng nhập, gộp lần đầu
│   └── *-page.js           Mỗi trang một file (register, verify, login, forgot, forum, thread, consign, listing, collection, orders, admin-…)
├── images/cards/         Ảnh thẻ (nguồn: TCGdex)
├── images/sealed/        Ảnh minh họa hàng nguyên hộp (tự vẽ, SVG)
├── images/forum/         Ảnh chụp cho bài viết mẫu trên diễn đàn (Pexels, nguồn trong NGUON-ANH.md)
├── docs/                 Tài liệu, báo cáo kiểm thử, ảnh chụp màn hình
```

### Chức năng đã hoàn thành

| Chức năng | Mã | Buổi | Minh chứng |
|---|---|---|---|
| 6 trang HTML cùng phong cách, responsive 1366 / 768 / 390px, hover và focus | — | 2 | [docs/screenshots/buoi-2/](docs/screenshots/buoi-2/), [test-report-buoi2.md](docs/test-report-buoi2.md) |
| Danh sách sản phẩm tạo từ dữ liệu JavaScript | F01 | 3 | [test-report-buoi3.md](docs/test-report-buoi3.md) |
| Chi tiết sản phẩm theo `?id=`, báo lỗi khi mã không tồn tại | F02 | 3 | như trên |
| Tìm theo tên hoặc số thẻ, lọc danh mục và set, sắp xếp giá, kết hợp điều kiện | F03 | 3 | như trên |
| Giỏ hàng: thêm, không trùng dòng, tăng / giảm / xóa, thành tiền, tổng tiền, không vượt tồn kho, lưu localStorage | F04 | 3 | như trên |
| Thẻ Charizard 3D trên trang chủ (chạy đúng cả trên điện thoại màn hình độ nét cao) | — | 3 | [docs/screenshots/buoi-3/](docs/screenshots/buoi-3/) |
| Trang chủ tập trung bán hàng: nút "Mua pack" ngay ở hero, nút "Thêm vào giỏ" trên mọi thẻ sản phẩm, thanh mua nhanh dính ở đáy màn hình | — | 3 | `mobile-home-393.jpg`, TC16–TC18 |
| Tối ưu điện thoại: bộ lọc thu gọn, thanh "Thêm vào giỏ" ở trang chi tiết, không tràn ngang | — | 3 | `mobile-products-393.jpg`, `mobile-detail-393.jpg`, TC20–TC22 |

**Cộng đồng, đợt 1 (09/11/2026, cần chạy server):**

| Chức năng | Mã | Minh chứng |
|---|---|---|
| Nền backend: Express + SQLite, dữ liệu mẫu, `/api/health`, chặn tải file server / CSDL / `.env` | T4.3 | API-01, API-19 |
| Đăng ký, OTP 6 số (hết hạn 10 phút, sai tối đa 5 lần, gửi lại sau 60 giây, chỉ lưu hash), đăng nhập (khóa 15 phút sau 5 lần sai), đăng xuất, quên mật khẩu (thông báo trung tính, đăng xuất mọi phiên cũ), menu tài khoản trên header | F30–F33 | API-02 → API-09, [test-report-cong-dong.md](docs/test-report-cong-dong.md) |
| Diễn đàn F100 / F368 / F666: trang chủ, danh sách topic (ghim, lọc tag, 20 topic/trang), xem topic (20 bài/trang, khung tác giả) | F34–F36 | API-10 → API-12 |
| Tạo topic có ảnh, trả lời, trích dẫn, sửa bài của mình, like / bỏ like, chức vụ theo like (7 cấp) | F37–F40 | API-13 → API-16 |
| Hồ sơ thành viên: chức vụ, tiến độ tới cấp sau, thang chức vụ, topic gần đây | F41 (một phần) | API-18 |
| Lượt xem topic, thành viên nổi bật tuần | F52, F53 | API-10, API-17 |

**Cộng đồng, đợt 2 (09/11/2026, cần chạy server):**

| Chức năng | Mã | Minh chứng |
|---|---|---|
| Bộ sưu tập Đang có / Đang săn: tra thẻ trên TCGdex, chọn biến thể, giá tham khảo lúc lưu, "JadeCard đang có hàng", "Ký gửi thẻ này" | F13, F14 | UI-15 → UI-18 |
| Bộ sưu tập theo tài khoản: gộp từ trình duyệt khi đăng nhập, công khai / riêng tư, ẩn tổng giá trị, tab Bộ sưu tập trên hồ sơ có nhãn "Đang bán" | F27, F41 | API-20 |
| Ký gửi tại cửa hàng: đăng tin (2–6 ảnh, xem trước hoa hồng), kiểm định tại quầy, trang Ký gửi, chi tiết tin, tin của tôi, rút tin, tất toán | F43–F49 | API-21, 22, 26, UI-19 → UI-21, UI-29 |
| Mua tin ký gửi qua giỏ hàng và **đặt hàng** (giao hàng / nhận tại cửa hàng, COD / chuyển khoản, chống đặt 2 lần), đơn của tôi, Admin xác nhận (trừ kho) → giao → hoàn thành, hủy hoàn kho một lần | F05, F07, F20, F47 | API-24, 27, UI-24 → UI-27 |
| Gắn tin vào topic Mua bán F368, thẻ sản phẩm ở đầu mọi trang topic, link tin ký gửi trong bài tự thành thẻ | F50, F51 | API-28, UI-31 |
| Kiểm duyệt: báo cáo bài, ghim / khóa / ẩn topic, ẩn bài (trừ like), khóa tài khoản, ẩn nhận xét | F42 | API-29, UI-32 → UI-34 |
| Thẻ xem nhanh khi rê avatar, trả giá (giữ 24 giờ), đánh giá người bán 1–5 sao | F54, F55, F56 | API-23, 25, UI-22, 23, 28, 35 |
| Hashtag thẻ / bộ pack trong bài viết (nút "Gắn thẻ / bộ", tra TCGdex), link + thẻ mời mua nếu shop có bán, trang `tag.html`; ảnh chụp cho bài mẫu | (mở rộng F37, F38) | API-31 |
| Gửi OTP qua Gmail thật (thư HTML, `npm run mail:test`); chế độ chạy thử hiện mã trên trang | F31, F33 | API-32 |

**Chưa làm (giai đoạn sau):** Check thẻ bằng ảnh / OCR (F08) và màn hình Check thẻ đầy đủ (F09–F12; phần tra thẻ thủ công + giá tham khảo đã có trong ô chọn thẻ), yêu cầu bán thẻ cho shop (F17–F18, F21), quản lý sản phẩm (F19), màn hình cấu hình giá (F22).

### Cách mở và chạy

Cần **Node.js 22.13 trở lên** (kiểm tra bằng `node -v`) và Internet để tải font, three.js.

1. Mở terminal tại thư mục dự án, chạy `npm install` (chỉ lần đầu).
2. Chạy `npm start`. Lệnh này biên dịch SCSS, khởi động server và mở `http://localhost:5500`. Lần đầu chạy, server tự tạo `data/jadecard.db` kèm dữ liệu mẫu. Bấm Ctrl+C để tắt.
3. Muốn xóa hết dữ liệu và tạo lại dữ liệu mẫu: tắt server rồi chạy `npm run db:reset`.

Các trang cửa hàng (trang chủ, sản phẩm, giỏ hàng...) vẫn mở được bằng cách nhấp đúp file `.html`. Tài khoản và diễn đàn **bắt buộc chạy server**; mở trực tiếp thì trang báo "Không kết nối được máy chủ".

**Tài khoản mẫu** (mật khẩu chung `jadecard123`, dữ liệu mẫu, không phải người thật):

| Email | Tên hiển thị | Vai trò / chức vụ |
|---|---|---|
| admin@jadecard.test | Admin_Jade | Admin (được mở topic ở F100) |
| mod@jadecard.test | Mod_Khang | Mod JadeCard |
| kenjiro@example.com | Kenjiro | Grand Master |
| minh@example.com | Minh_CardVault | Master |
| son@example.com | Son_Grail | Thợ săn lão làng |
| tuan@example.com | Tuan_Poke | Thợ săn sơ cấp |
| pikafan@example.com | PikaFan | cấp thấp (Chiếu mới / Học việc) |

Dữ liệu mẫu có sẵn để thử: 8 tin ký gửi (KG-0006 đang **Chờ kiểm định** để Admin thử kiểm định; KG-0008 đã bán, đơn hoàn thành, đang **chờ tất toán**), đơn DH-00003 của PikaFan **chờ xác nhận**, một đề nghị trả giá của Huy_Collector cho KG-0001 (Son_Grail trả lời ở "Tin ký gửi của tôi"; mật khẩu Huy là `jadecard123`), một báo cáo bài đang chờ Mod. Đăng nhập Admin rồi mở menu avatar → **Quản trị**.

**Đã có CSDL từ trước (đợt 1)?** Server tự tạo thêm bảng mới khi khởi động, nhưng dữ liệu mẫu ký gửi chỉ có khi tạo lại: tắt server, chạy `npm run db:reset`.

**Gửi OTP:** khi chưa cấu hình Gmail, mã OTP được **in ra cửa sổ dòng lệnh** đang chạy `npm start` và **hiện ngay trên trang nhập mã** (khung vàng "Chế độ chạy thử"), nên máy nào cũng đăng ký thử được. Muốn gửi mail thật (khi demo): sao chép `.env.example` thành `.env`, điền `SMTP_USER` (Gmail) và `SMTP_PASS` (**Mật khẩu ứng dụng** 16 ký tự, không phải mật khẩu Gmail; cần bật xác minh 2 bước), đặt `SESSION_SECRET` là một chuỗi ngẫu nhiên dài, chạy `npm run mail:test` để gửi thư thử, rồi **khởi động lại server** (server chỉ đọc `.env` lúc khởi động). **Không đưa `.env` lên GitHub.**

**Sửa header / footer:** sửa trong `index.html`, rồi chạy `npm run sync:layout` để chép sang mọi trang.

**Sửa giao diện:** sửa file trong `scss/`, không sửa `css/style.css`. Chạy `npm run watch:css` để Sass tự biên dịch lại mỗi khi lưu, hoặc `npm run build:css` để biên dịch một lần.


### Cách kiểm tra

- **Responsive:** mở Chrome DevTools (F12) → bật Device Toolbar (Ctrl+Shift+M) → nhập độ rộng 1366, 768, 390.
- **Giỏ hàng:** thêm vài sản phẩm, rồi xem DevTools → Application → Local Storage → khóa `cart`. Tải lại trang thì giỏ vẫn còn.
- **Lỗi JavaScript:** DevTools → Console phải không có dòng màu đỏ.
- Danh sách ca kiểm thử đầy đủ: [docs/test-report-buoi3.md](docs/test-report-buoi3.md).
- **API (tài khoản, diễn đàn, ký gửi, đơn hàng, kiểm duyệt):** chạy `npm test` → 32 ca phải đạt. Bảng ca kiểm thử: [docs/test-report-cong-dong.md](docs/test-report-cong-dong.md).

### Hạn chế hiện tại

- Đặt hàng là bản tối giản (F05, F07, F20): COD / chuyển khoản xác nhận tay, chưa có thanh toán online; giỏ hàng chỉ lưu trên trình duyệt đang dùng.
- Tồn kho hiển thị trên trang Sản phẩm vẫn đọc từ `js/data/products.js`; tồn kho thật khi đặt hàng nằm ở server (bảng `product_stock`). Chưa có trang quản lý sản phẩm (F19) để đồng bộ hai nơi.
- Tra thẻ và giá tham khảo cần Internet (TCGdex). TCGdex đôi khi trả lỗi tạm thời; trang tự thử lại một lần.
- Tin / trả giá quá hạn được cập nhật ở đầu mỗi yêu cầu API (không có chương trình chạy ngầm), nên trạng thái đổi khi có người mở trang.
- Thông tin chuyển khoản của shop chưa hiển thị trên web (shop gửi khi xác nhận đơn).
- Chưa giới hạn số yêu cầu theo địa chỉ IP (chỉ giới hạn theo tài khoản: khóa đăng nhập, số lần nhập OTP, 60 giây gửi lại).
- Từ 768px đến 1023px, menu chính chuyển thành hàng cuộn ngang (giống điện thoại); ô tìm kiếm trên header hiện từ 1280px. Menu chính theo bảng duyệt Stitch: Trang chủ · Sản phẩm · Ký gửi · Diễn đàn · Check thẻ; "Giới thiệu" và "Chính sách thu mua" chuyển xuống footer.
- Trang Check thẻ mới là giao diện tĩnh với kết quả minh họa (chưa đọc ảnh bằng OCR).
- Hashtag thẻ / bộ trong diễn đàn: thẻ mời mua đọc tồn kho từ `js/data/products.js`, chưa kiểm tra hết hàng.
- Giá thẻ lẻ là dữ liệu mẫu, chốt theo giá TCGdex ngày 07/11/2026, chưa tự cập nhật.
- Cần Internet để tải font và three.js từ CDN.

## 7. Kế hoạch thực hiện

| Giai đoạn | Nội dung | Buổi học |
|---|---|---|
| 1 | Khảo sát và xác định yêu cầu | Buổi 1 |
| 2 | Thiết kế giao diện (HTML/CSS, responsive) | Buổi 2 |
| 3 | Xây dựng chức năng frontend (JS, localStorage, Check thẻ) | Buổi 3+ |
| 4 | Backend và cơ sở dữ liệu | Theo lịch môn học |
| 5 | Tích hợp và kiểm thử | Theo lịch môn học |
| 6 | Triển khai và hoàn thiện | Cuối học phần |

## 8. Liên kết

- Bảng yêu cầu: [REQUIREMENTS.md](REQUIREMENTS.md)
- Kế hoạch: [PROJECT_PLAN.md](PROJECT_PLAN.md)
- Kế hoạch cộng đồng (Tài khoản, Diễn đàn, Ký gửi, Bộ sưu tập công khai, REQUIREMENTS v2.0): [docs/ke-hoach-cong-dong.md](docs/ke-hoach-cong-dong.md) · Prompt Stitch: [docs/stitch-prompts-cong-dong.md](docs/stitch-prompts-cong-dong.md)
- Phân tích website: [docs/competitor-analysis.md](docs/competitor-analysis.md)
- Vai trò người dùng: [docs/user-roles.md](docs/user-roles.md)
- Quy trình nghiệp vụ: [docs/business-workflow.md](docs/business-workflow.md)
- Quy tắc cho AI: [AGENTS.md](AGENTS.md) · Nhật ký dùng AI: [AI_USAGE_LOG.md](AI_USAGE_LOG.md)
- Báo cáo Word theo từng chương/buổi: nộp riêng cho giảng viên (không để trong repo, repo chỉ chứa mã nguồn và tài liệu đề yêu cầu)
