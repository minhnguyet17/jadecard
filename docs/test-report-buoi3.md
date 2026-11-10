# Báo cáo kiểm thử — Buổi 3 (JavaScript)

- **Ngày kiểm thử:** 07/11/2026 (TC01–TC15); chạy lại toàn bộ và thêm TC16–TC24 ngày 08/11/2026, sau khi chuyển CSS sang SCSS và làm lại trang chủ
- **Trình duyệt:** Google Chrome. Các ca được chạy tự động bằng puppeteer-core (mở trang thật, bấm nút, gõ phím, đọc localStorage), rồi kiểm tra lại bằng ảnh chụp.
- **Kết quả tổng:** **26/26 ca đạt.** Console không có lỗi JavaScript ở cả 6 trang.
- **Ảnh minh chứng:** [docs/screenshots/buoi-3/](screenshots/buoi-3/).

## 1. Kiểm thử chức năng

| Mã | Chức năng | Dữ liệu đầu vào | Các bước | Kết quả mong đợi | Kết quả thực tế |
|---|---|---|---|---|---|
| TC01 | Danh sách sản phẩm | — | Mở products.html | Hiển thị đủ dữ liệu từ `products.js` | ✅ 15 sản phẩm, đầu tiên là Umbreon VMAX (Alt Art) |
| TC02 | Xem chi tiết | Sản phẩm đầu tiên | Bấm "Chi tiết" | Mở đúng sản phẩm được chọn | ✅ `product-detail.html?id=1` → "Umbreon VMAX (Alt Art)" |
| TC03 | Tìm kiếm | "pikachu"; "199/165" | Gõ vào ô tìm kiếm | Chỉ hiện sản phẩm phù hợp | ✅ "pikachu" → 2 thẻ Pikachu; "199/165" → Charizard ex (SIR) |
| TC04 | Lọc danh mục | Hàng nguyên hộp | Chọn danh mục | Chỉ hiện danh mục đó | ✅ 4 sản phẩm |
| TC05 | Sắp xếp giá | Tăng dần, giảm dần | Chọn sắp xếp | Thứ tự giá đúng; mảng `products` gốc không đổi | ✅ Đúng cả hai chiều; thứ tự gốc vẫn là 1, 2, 3, ..., 15 |
| TC05b | Kết hợp điều kiện | Thẻ lẻ + "charizard" + giá giảm dần; rồi "zzz" | Chọn cả ba điều kiện | Kết quả thỏa mọi điều kiện; không có kết quả thì báo | ✅ Charizard (Holo) > Charizard ex (SIR) > Charizard ex; "zzz" hiện "Không tìm thấy sản phẩm phù hợp" |
| TC06 | Thêm vào giỏ (trang chi tiết) | id=6, số lượng 1 | Bấm "Thêm vào giỏ" | Sản phẩm vào giỏ, biểu tượng giỏ = 1 | ✅ `[{"id":6,"quantity":1}]`, biểu tượng = 1 |
| TC06b | Thêm vào giỏ (trang danh sách) | 2 × Booster Pack, 1 × Tin | Bấm nút giỏ trên thẻ | Biểu tượng giỏ cập nhật | ✅ Biểu tượng = 5 (2 + 2 + 1) |
| TC07 | Thêm lại sản phẩm đã có | id=6 (tồn kho 2), bấm thêm 2 lần nữa | Bấm "Thêm vào giỏ" | Tăng số lượng, không tạo dòng trùng, không vượt tồn | ✅ Số lượng = 2, vẫn 1 dòng; lần vượt tồn báo "Giỏ hàng đã có đủ số lượng tồn kho của sản phẩm này" |
| TC08 | Thay đổi số lượng | Giảm Charizard ex từ 2 → 1; đổi sang nhận tại cửa hàng | Bấm "−", chọn cách nhận | Thành tiền và tổng tiền cập nhật | ✅ 16.080.000 ₫ (có phí ship) → tạm tính 8.340.000 ₫ → nhận tại shop 8.340.000 ₫ |
| TC09 | Xóa sản phẩm | Charizard ex | Bấm "Xóa" | Sản phẩm biến mất, tổng tính lại | ✅ Còn 2 dòng, 630.000 ₫ (2 × 120.000 + 390.000) |
| TC10 | Tải lại trang giỏ | — | F5 trang cart.html | Dữ liệu được khôi phục | ✅ Vẫn 2 dòng, 630.000 ₫, biểu tượng = 3 |
| TC11 | Giỏ hàng trống | Xóa hết | Bấm "Xóa" các dòng | Hiện thông báo phù hợp | ✅ "Giỏ hàng của bạn đang trống", số trên biểu tượng được ẩn |
| TC12 | Console | — | Mở cả 6 trang | Không có lỗi JavaScript | ✅ 0 lỗi |
| TC13 | Mã sản phẩm không tồn tại | `?id=999` | Mở URL | Báo không tìm thấy, có link quay lại | ✅ "Không tìm thấy sản phẩm" |
| TC14 | Dữ liệu localStorage bị hỏng | `cart = "dữ liệu hỏng{"` | Mở cart.html | Không lỗi, coi như giỏ trống | ✅ Hiện giỏ trống, không lỗi Console |
| TC15 | Thẻ Charizard 3D | — | Mở index.html | Thẻ 3D được dựng, ảnh dự phòng ẩn | ✅ Có canvas WebGL, ảnh tĩnh được ẩn |
| TC16 | Nút mua trên thẻ sản phẩm ở trang chủ | — | Mở index.html | Mỗi thẻ có nút "Thêm vào giỏ" | ✅ 8 thẻ, 8 nút; số gói còn lại lấy từ `products.js` (40) |
| TC17 | Nút "Mua pack" ở hero | — | Bấm "Mua pack · 120.000 ₫" | Booster Pack vào giỏ, thông báo có link "Xem giỏ" | ✅ `[{"id":15,"quantity":1}]`, biểu tượng = 1, có link |
| TC18 | Thanh mua nhanh (trang chủ) | — | Mở trang, cuộn xuống 1600px, bấm nút trên thanh | Ẩn khi đang thấy nút mua ở hero, hiện khi cuộn qua, bấm được | ✅ Đầu trang ẩn, cuộn xuống hiện, giỏ tăng lên 2 |
| TC19 | Lọc theo đường dẫn | `?category=sealed`, `?category=single` | Mở URL | Chỉ hiện đúng danh mục | ✅ 4 hàng nguyên hộp, 11 thẻ lẻ |
| TC20 | Bộ lọc trên điện thoại | 390px | Mở products.html, bấm "Lọc & sắp xếp" | Ban đầu chỉ có ô tìm kiếm, bấm mới mở phần còn lại | ✅ Ẩn → hiện; sản phẩm thấy ngay màn hình đầu |
| TC21 | Thẻ 3D trên điện thoại độ nét cao | 390px, DPR 3 | Mở index.html; mở 6 trang | Canvas vừa đúng khung; không trang nào tràn ngang | ✅ Khung 136×187, canvas 136×187 (vẽ 272×374 điểm ảnh); không tràn |
| TC22 | Thanh mua ở trang chi tiết (điện thoại) | id=6 | Mở trang, bấm nút trên thanh | Thanh hiện khi nút chính khuất, bấm thêm được | ✅ `[{"id":6,"quantity":1}]` |
| TC23 | Giỏ trống có nút mua | Giỏ trống | Bấm "Thêm Booster Pack" | Hàng vào giỏ, trang giỏ hiện ngay | ✅ 1 dòng, tổng 150.000 ₫ (có phí ship) |
| TC24 | Không còn Tailwind | — | Kiểm tra DOM | Không có script Tailwind, không còn class kiểu tiện ích | ✅ 0 script, 0 class; nền và font lấy từ `css/style.css` |

## 2. Kiểm tra giao diện

| Tiêu chí | Kết quả |
|---|---|
| Thẻ sản phẩm không vỡ bố cục, ảnh không méo | ✅ Ảnh dùng `aspect-ratio` + `object-cover` |
| Nút tìm kiếm, lọc, thêm vào giỏ dễ dùng trên điện thoại | ✅ Xem `products-390.jpg`, `cart-390.jpg` |
| Giỏ hàng hiển thị phù hợp trên màn hình nhỏ | ✅ Mỗi dòng xếp lại thành 2 cột, phần tóm tắt nằm dưới |
| Màu sắc, font chữ thống nhất | ✅ Màu, font, cỡ chữ khai báo một lần trong `scss/abstracts/_variables.scss` |
| Bố cục giữ nguyên sau khi chuyển sang SCSS | ✅ So ảnh từng điểm ảnh với bản Tailwind: Giỏ hàng, Giới thiệu, Check thẻ khác 0,00% ở 1366px và 768px; ở 390px chỉ khác do menu điện thoại cao thêm 8px (vùng chạm lớn hơn) |
| Không mất chức năng của Buổi 2 | ✅ Các trang Buổi 2 vẫn còn; ảnh nghiêng CSS được giữ làm dự phòng cho thẻ 3D |

## 3. Kiểm tra tích hợp

| Rủi ro tích hợp (theo đề) | Cách dự án tránh |
|---|---|
| Tên hàm khác nhau cho cùng một chức năng | Mọi thao tác giỏ hàng đi qua `js/cart.js` (`loadCart`, `saveCart`, `addToCart`...) |
| Mỗi trang khai báo dữ liệu theo cấu trúc khác nhau | Chỉ có một nguồn dữ liệu: `js/data/products.js` |
| Đường dẫn JavaScript hoặc ảnh sai | Script quét 170 đường dẫn nội bộ: 0 lỗi |
| Nhiều đoạn mã cùng xử lý một sự kiện | Nút trong danh sách dùng một sự kiện chung trên khung chứa (event delegation), không gắn lại sau mỗi lần lọc |
| Giỏ hàng không đồng bộ giữa các trang | Giỏ lưu trong localStorage với một khóa duy nhất `cart`; mỗi trang gọi `updateCartBadge()` khi mở, và lắng nghe sự kiện `storage` khi giỏ đổi ở tab khác |

## 4. Lỗi đã gặp và cách sửa

| Mã | Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|---|
| L1 | Thẻ 3D có thể không hiện khi mở trang bằng cách nhấp đúp `index.html` | Chrome không cho WebGL dùng ảnh trong máy khi trang mở bằng `file://` (lý do bảo mật) | Lấy ảnh mặt thẻ từ máy chủ TCGdex, vốn cho phép dùng chéo (`Access-Control-Allow-Origin: *`); vẫn giữ ảnh tĩnh làm dự phòng |
| L2 | Khung 3D bị tính kích thước bằng 0 khi còn đang ẩn | Hàm `resize()` chạy trước khi khung được hiện | Bỏ qua khi kích thước bằng 0; gọi lại `resize()` sau khi hiện khung |
| L3 | Thẻ 3D nhỏ so với khung | Camera đặt quá xa | Đưa camera từ z = 7,2 lại z = 6,3 |
| L4 | Trên điện thoại, thẻ 3D phình to và bị cắt, chỉ thấy một góc | Canvas có số điểm ảnh = kích thước × DPR (2–3 lần) nhưng không được đặt kích thước CSS, nên hiển thị to gấp đôi khung | Đặt canvas `width/height: 100%`; theo dõi khung bằng `ResizeObserver`; dừng vẽ khi thẻ khuất màn hình |
| L5 | Nút "Thêm vào giỏ" trên thẻ sản phẩm xuống 2 dòng ở 390px | Thẻ chỉ rộng ~147px, chứa cả nút "Chi tiết" | Trên điện thoại chỉ giữ nút "Thêm vào giỏ" (bấm ảnh / tên để xem chi tiết) |
| L6 | Trang Giới thiệu dài thêm 12px sau khi chuyển sang SCSS | Quy tắc `.policy-head p` áp cả lên dòng chữ nhỏ phía trên tiêu đề | Đổi thành class riêng `.policy-head__text` |
| L7 | Bảng thấp hơn bản cũ vài px | Phần reset đặt `padding: 0` cho mọi ô bảng, còn bản cũ giữ 1px mặc định | Trả lại `padding: 1px` cho `td`, `th` |

## 5. Hướng dẫn kiểm tra lại bằng tay

1. Mở `products.html`, gõ "pikachu", chọn "Thẻ lẻ", chọn "Giá: cao đến thấp".
2. Bấm vào một sản phẩm, thêm vào giỏ 2 lần, xem số trên biểu tượng giỏ.
3. Mở DevTools (F12) → Application → Local Storage → xem khóa `cart`.
4. Vào `cart.html`, tăng, giảm, xóa; bấm F5 để kiểm tra dữ liệu được khôi phục.
5. Xem tab Console: không có dòng màu đỏ.
