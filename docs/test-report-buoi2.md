# Báo cáo kiểm thử — Buổi 2 (HTML & CSS)

- **Ngày kiểm thử:** 07/11/2026
- **Phiên bản:** bản giao diện Buổi 2 (các trang tĩnh, chưa có JavaScript nghiệp vụ)
- **Trình duyệt:** Google Chrome (chạy tự động qua puppeteer-core để chụp màn hình và đo tràn ngang) và kiểm tra bằng mắt trên ảnh chụp.
- **Ảnh minh chứng:** [docs/screenshots/buoi-2/](screenshots/buoi-2/). Mỗi trang có 3 ảnh: `-1366`, `-768`, `-390`.

## 1. Danh sách kiểm thử

| Mã | Tiêu chí | Cách kiểm tra | Kết quả |
|---|---|---|---|
| B2-01 | Có ít nhất 4 trang HTML | Đếm file | ✅ Có 5 trang: index, products, product-detail, about, check-card |
| B2-02 | Các trang liên kết đúng | Script quét mọi `href`/`src` nội bộ và kiểm tra file có tồn tại; kiểm tra neo `about.html#thu-mua` | ✅ 170 liên kết và đường dẫn ảnh, 0 lỗi |
| B2-03 | CSS áp dụng thống nhất | Mọi trang dùng chung một file `css/style.css` (biên dịch từ `scss/`); header và footer giống hệt nhau | ✅ |
| B2-04 | Hình ảnh đúng đường dẫn, không méo | Xem ảnh chụp; ảnh dùng `aspect-ratio` + `object-cover` | ✅ (sau khi sửa lỗi L1 bên dưới) |
| B2-05 | Danh sách có ít nhất 8 sản phẩm | Đếm thẻ sản phẩm trên products.html | ✅ 15 sản phẩm (11 thẻ lẻ, 4 hộp) |
| B2-06 | Chi tiết sản phẩm có ảnh, tên, giá, mô tả, thuộc tính, nút mua, link quay lại | Xem product-detail.html | ✅ Có 6 thuộc tính thẻ lẻ và giá tham khảo quốc tế |
| B2-07 | Trang giới thiệu có nội dung, hình ảnh, liên hệ | Xem about.html | ✅ Có thêm chính sách thu mua tại cửa hàng |
| B2-08 | Không tràn ngang ở 1366 / 768 / 390px | Đo `document.documentElement.scrollWidth` so với độ rộng màn hình | ✅ Cả 5 trang × 3 kích thước: scrollWidth bằng đúng độ rộng |
| B2-09 | Danh sách đổi số cột theo màn hình | Xem ảnh | ✅ 4 cột (1366) → 3 cột (768) → 2 cột (390) |
| B2-10 | Menu không chồng lấn trên điện thoại | Xem ảnh 390px | ✅ Menu chuyển thành một hàng cuộn ngang |
| B2-11 | Hover cho link, nút, thẻ sản phẩm | Rê chuột | ✅ Thẻ nhấc lên 4px, viền sáng cyan; nút đổi màu; thẻ Charizard nghiêng 3D bằng CSS |
| B2-12 | Focus nhìn thấy khi dùng bàn phím | Nhấn Tab qua các link, nút, ô nhập | ✅ Viền cyan 2px (`:focus-visible`), không xóa outline |
| B2-13 | Tôn trọng người dùng bật "giảm chuyển động" | `@media (prefers-reduced-motion)` | ✅ Tắt transition |

## 2. Lỗi phát hiện và cách xử lý

| Mã | Lỗi / vấn đề | Nguyên nhân | Cách xử lý | Kết quả |
|---|---|---|---|---|
| L1 | Ảnh hộp thiếc (tin.svg) không hiển thị | Trong file SVG có chữ "Scarlet & Violet": ký tự `&` không hợp lệ trong XML | Đổi thành `&amp;`; kiểm tra lại cả 4 file SVG bằng trình phân tích XML | ✅ Đã sửa |
| L2 | Ảnh chụp ở 390px bị cắt mép phải, tưởng là tràn ngang | Chrome trên Windows không cho cửa sổ nhỏ hơn khoảng 500px, nên ảnh chụp bị cắt. **Không phải lỗi của trang.** | Đổi sang chụp bằng puppeteer với viewport đúng 390px và đo `scrollWidth` | ✅ Xác nhận không tràn ngang |
| L3 | Font tiêu đề Syne trong bản thiết kế Stitch không có tiếng Việt | Bộ font Syne trên Google Fonts không có subset `vietnamese` | Dùng Be Vietnam Pro (bản Stitch mới cũng đã đổi sang font này) | ✅ |
| L4 | Mã nguồn Stitch có nội dung không đúng dự án (đấu giá, kho lưu ký, bảo hiểm...) | Stitch tạo mẫu cho một sàn đấu giá | Chỉ giữ phong cách, viết lại nội dung theo REQUIREMENTS v1.0 | ✅ |

## 3. Hạn chế còn lại

- Ô tìm kiếm, bộ lọc và nút "Thêm vào giỏ" mới là giao diện, sẽ hoạt động ở Buổi 3.
- Trang chi tiết mới hiển thị một sản phẩm cố định.
- Cần Internet để tải font.

> **Cập nhật 08/11/2026:** CSS được viết lại bằng SCSS, gỡ Tailwind. Ảnh trong `docs/screenshots/buoi-2/` chụp bản Tailwind; so từng điểm ảnh, các trang Giỏ hàng, Giới thiệu, Check thẻ giống hệt bản mới ở 1366px và 768px (khác 0,00%). Trang chủ được thiết kế lại ở Buổi 3 (xem test-report-buoi3.md).
