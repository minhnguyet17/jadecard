# Báo cáo kiểm thử — Cộng đồng (Tài khoản, Diễn đàn, Ký gửi, Đơn hàng, Bộ sưu tập)

- **Ngày kiểm thử:** 09/11/2026
- **Phạm vi:** T4.3 nền backend, T4.4 tài khoản (F30–F33), T4.5–T4.6 diễn đàn (F34–F40), F41 (một phần), F52, F53.
- **Cách chạy:**
  - **API:** `npm test` (bộ kiểm thử `node:test` có sẵn trong Node.js, file [tests/api.test.js](../tests/api.test.js)). Mỗi lần chạy tạo CSDL tạm có dữ liệu mẫu, chạy xong tự xóa.
  - **Giao diện:** chạy tự động bằng Playwright trên Chromium (mở trang thật, gõ phím, dán mã, bấm nút), rồi xem lại ảnh chụp.
- **Kết quả tổng (sau đợt 2):** **30/30 ca API đạt**, **37/37 bước luồng trình duyệt đạt** (đợt 1: UI-01 → UI-14; đợt 2: UI-15 → UI-37). Console không có lỗi JavaScript ở 12 trang (6 trang cũ + 6 trang mới có dữ liệu), không tràn ngang ở 390 / 768 / 1024 / 1280 / 1440px.
- **Ảnh minh chứng:** [docs/screenshots/cong-dong/](screenshots/cong-dong/).

## 1. Kiểm thử API (tự động)

Loại ca: **CN** = chức năng đúng, **DL** = dữ liệu sai / biên, **BM** = bảo mật / truy cập trái phép, **GH** = giới hạn.

| Mã | Chức năng | Loại | Nội dung kiểm tra | Kết quả |
|---|---|---|---|---|
| API-01 | Nền backend | CN | `GET /api/health` trả `{ ok: true }` | ✅ |
| API-02 | F30 Đăng ký | CN | Email được đổi về chữ thường; tài khoản ở trạng thái Chưa xác thực; mật khẩu và OTP chỉ lưu bản băm; OTP 6 số được gửi | ✅ |
| API-03 | F30 Đăng ký | DL | Email trùng (409), tên trùng không phân biệt hoa thường (409), tên 2 ký tự, tên có khoảng trắng, mật khẩu 7 ký tự, email sai định dạng, chưa đồng ý quy định → mỗi lỗi báo đúng ô (`field`) | ✅ |
| API-04 | F31, F32 | CN + DL | Chưa xác thực thì đăng nhập bị chuyển sang OTP; OTP sai báo "còn 4 lần thử"; OTP đúng → kích hoạt, đăng nhập luôn, chức vụ "Chiếu mới"; mã đã dùng không dùng lại được; API không trả email | ✅ |
| API-05 | F31 | GH | Sai 5 lần → mã hết hiệu lực, nhập đúng cũng bị từ chối; gửi lại trong 60 giây không gửi mail mới; sau 60 giây gửi được và mã mới dùng được | ✅ |
| API-06 | F31 | GH | Mã quá 10 phút → "Mã đã hết hạn" | ✅ |
| API-07 | F32 | GH + BM | Sai mật khẩu 5 lần → khóa 15 phút; trong lúc khóa, nhập đúng mật khẩu cũng không vào được | ✅ |
| API-08 | F32 | BM | Email không tồn tại và sai mật khẩu nhận **cùng một thông báo** (không dò được email thành viên); đăng xuất xóa phiên | ✅ |
| API-09 | F33 | CN + BM | Thông báo giống nhau dù email có tồn tại hay không; đổi mật khẩu bằng OTP; **phiên đăng nhập cũ trên thiết bị khác bị đăng xuất**; đăng nhập bằng mật khẩu mới được | ✅ |
| API-10 | F34, F53 | CN | 3 forum F100 / F368 / F666 đúng thứ tự, số topic và số bài đếm thật; tối đa 5 thành viên nổi bật tuần | ✅ |
| API-11 | F35 | CN | Topic ghim chỉ ở trang 1; 20 topic mỗi trang; lọc tag "Định giá" chỉ ra topic Định giá, tổng khớp số trên chip | ✅ |
| API-12 | F36 | CN + BM | Topic dài: 20 bài trang 1, trang 2 bắt đầu từ bài #21; khung tác giả có chức vụ; không có email trong dữ liệu trả về | ✅ |
| API-13 | F37 | BM + DL | Khách tạo topic → 401; thành viên tạo được; tiêu đề < 5 ký tự bị từ chối; tag Mua bán (cần tin ký gửi) bị từ chối; thành viên mở topic ở F100 → 403, Admin được; dùng tag của forum khác bị từ chối | ✅ |
| API-14 | F37 Ảnh | BM + GH | Ảnh PNG thật được lưu với tên ngẫu nhiên và tải về được; **file chứa mã `<script>` đặt đuôi .png bị từ chối** (server đọc byte đầu file); 5 ảnh bị từ chối | ✅ |
| API-15 | F38 | CN + BM | Trả lời được, trả về đúng trang chứa bài mới; topic khóa → không trả lời được; sửa bài của mình được (có `editedAt`); **A sửa bài của B → 403** | ✅ |
| API-16 | F39, F40 | CN + BM | Tự like bài mình → 400; like lần 2 là bỏ like; tác giả 9 like + 1 like → lên "Học việc", bỏ like → về "Chiếu mới"; khách like → 401 | ✅ |
| API-17 | F52 | CN | Tác giả xem bài mình không tính; một người xem 3 lần trong 1 giờ chỉ tính 1 lượt | ✅ |
| API-18 | F41 | CN + BM | Hồ sơ có thang 7 chức vụ, không có ký tự "@" (không lộ email); tên không tồn tại → 404 | ✅ |
| API-19 | Bảo mật web tĩnh | BM | `/server/db.js`, `/data/jadecard.db`, `/.env`, `/package.json`, `/node_modules/...`, `/scss/main.scss` đều 404; trang `.html` vẫn mở được | ✅ |

## 2. Luồng trên trình duyệt (tự động bằng Playwright)

| Mã | Các bước | Kết quả mong đợi | Kết quả thực tế |
|---|---|---|---|
| UI-01 | Bấm "Đăng ký" khi form trống | Báo lỗi ngay dưới ô, không gửi lên server | ✅ "Email không hợp lệ." |
| UI-02 | Nhập mật khẩu `Matkhau#2026` | Thanh độ mạnh hiện mức | ✅ "RẤT MẠNH" |
| UI-03 | Đăng ký hợp lệ | Sang verify.html, email được che, nút gửi lại đếm ngược | ✅ `e*e@example.com`, "Gửi lại sau 1:00" |
| UI-04 | Gõ 6 số sai | Tự gửi khi đủ 6 số, báo còn số lần thử | ✅ "Mã xác thực không đúng. Bạn còn 4 lần thử." |
| UI-05 | **Dán** mã đúng (đọc từ cửa sổ dòng lệnh) vào ô đầu | Tự điền 6 ô, kích hoạt, chuyển vào diễn đàn | ✅ Ảnh `02-verify-otp-success-1280.jpg` |
| UI-06 | Xem header sau khi xác thực | Avatar + tên + tag chức vụ | ✅ "E2E_Tester · Chiếu mới" |
| UI-07 | Tạo topic có ảnh WebP, nội dung chứa `<img src=x onerror=alert(1)>`, `**in đậm**`, link | Mã HTML hiện thành chữ, không chạy; in đậm và link hoạt động; ảnh hiển thị | ✅ Không có hộp thoại alert; ảnh `06-thread-quote-image-1280.jpg` |
| UI-08 | Tiêu đề chứa `<b>đậm</b>` | Hiện nguyên chữ | ✅ |
| UI-09 | Nút Thích trên bài của chính mình | Bị khóa | ✅ |
| UI-10 | Đăng xuất, mở lại topic | Ô trả lời thay bằng lời mời đăng nhập | ✅ |
| UI-11 | Bấm "đăng nhập" trong lời mời, đăng nhập | Quay về đúng topic (`next`) | ✅ |
| UI-12 | Like bài người khác | Nút đổi "Đã thích (1)", tim tô màu | ✅ |
| UI-13 | Trích dẫn rồi gửi trả lời | Khung trích dẫn "E2E_Tester đã viết:" | ✅ |
| UI-14 | Sửa bài trả lời của mình; quên mật khẩu 2 bước | Lưu ngay không tải lại trang; đổi mật khẩu xong về login.html với thông báo thành công | ✅ |

## 3. Giao diện và responsive

| Mã | Kiểm tra | Kết quả |
|---|---|---|
| RS-01 | Header ở 390 / 768 / 1024 / 1280 / 1440px, chưa và đã đăng nhập | ✅ Không tràn. Từ 768–1023px menu chính chuyển thành hàng cuộn ngang; ô tìm kiếm header hiện từ 1280px (L8) |
| RS-02 | Trang topic trên điện thoại 390px | ✅ Khung tác giả thành một hàng ở đầu bài (ảnh `10-mobile-thread-390.jpg`) |
| RS-03 | Danh sách topic trên điện thoại | ✅ Số trả lời / lượt xem chuyển vào dòng phụ (ảnh `11-mobile-forum-f368-390.jpg`) |
| RS-04 | 6 trang cửa hàng cũ sau khi thêm menu Diễn đàn + nút tài khoản | ✅ 0 lỗi Console; giỏ hàng vẫn hoạt động |

## 4. Lỗi phát hiện trong lúc làm và đã sửa

| Mã | Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|---|
| L8 | Ở 1440px, "Trang chủ", "Giới thiệu & Thu mua" bị xuống 2 dòng; ở 768px header tràn ngang 145px | Thêm mục "Diễn đàn" và nút tài khoản làm header chật | `white-space: nowrap` cho menu; menu đầy đủ từ 1024px, ô tìm kiếm header từ 1280px |
| L9 | Script đồng bộ header không chèn thẻ `<script>` menu tài khoản | Kiểm tra chuỗi `js/account-menu.js` trùng với chú thích trong header | Kiểm tra đúng `src="js/account-menu.js"` |
| L10 | Sass cảnh báo khi dùng tên màu (`gray`, `cyan`) làm khóa bảng màu | Sass hiểu là mã màu, không phải chữ | Đặt tên màu trong ngoặc kép |

## 5. Giới hạn còn lại

- Chưa giới hạn số yêu cầu theo địa chỉ IP; chỉ giới hạn theo tài khoản (khóa đăng nhập, 5 lần nhập OTP, 60 giây gửi lại).
- Chưa kiểm thử gửi mail thật qua Gmail (cần Jade tạo App Password); chế độ in OTP ra dòng lệnh đã chạy đúng.
- Chưa có kiểm duyệt (F42), Ký gửi (F43–F51), bộ sưu tập theo tài khoản (F27), thẻ xem nhanh (F54), trả giá (F55), đánh giá người bán (F56).

---

# Đợt 2 (09/11/2026): Bộ sưu tập, Ký gửi, Trả giá, Đơn hàng, Đánh giá, F50/F51, Kiểm duyệt

## 6. Kiểm thử API (tự động, cùng file tests/api.test.js)

| Mã | Chức năng | Loại | Nội dung kiểm tra | Kết quả |
|---|---|---|---|---|
| API-20 | F13, F14, F27 | CN + BM | Thêm thẻ trùng thì cộng số lượng; thẻ chưa có giá lưu trống (không phải 0đ); ảnh thẻ ngoài TCGdex bị từ chối; **Son sửa thẻ của Kenjiro → 403**; bộ sưu tập riêng tư chỉ chủ xem; tổng giá trị ẩn khi chủ không bật; thẻ đang ký gửi có nhãn "Đang bán"; gộp từ trình duyệt bỏ qua dòng hỏng; chưa đăng nhập không đổi cài đặt được (401) | ✅ |
| API-21 | F43 | DL + BM | 1 ảnh, giá 10.000 ₫ bị từ chối; tin mới mã KG-0009, hoa hồng 520.000 ₫ trên 6.500.000 ₫; tin Chờ kiểm định không hiện công khai (khách 404, không có trên trang Ký gửi); **thành viên và cả Mod gọi API kiểm định → 403** | ✅ |
| API-22 | F44 | CN + DL | Đạt mà thiếu ảnh shop chụp, hoặc chọn nghi giả → bị từ chối; Đạt → Đang bán, huy hiệu xác thực, tình trạng thực tế LP thay tình trạng tự khai, giá niêm yết 6.000.000 ₫; không kiểm định 2 lần; Từ chối bắt buộc lý do | ✅ |
| API-23 | F55 | CN + DL + BM | Không tự trả giá tin của mình; dưới 50% hoặc bằng giá niêm yết bị từ chối; mỗi người 1 đề nghị chờ; người mua không tự chấp nhận (403); chấp nhận → tin "Đang giữ", đề nghị khác tự bị từ chối; người khác đặt hàng tin đang giữ → LISTING_UNAVAILABLE; người trả giá mua được với giá đã chốt | ✅ |
| API-24 | F05, F47, F20 | CN + DL | SĐT sai, thiếu địa chỉ khi giao hàng, vượt tồn kho bị từ chối; tổng = giá đã chốt + 2 pack + 30.000 ₫; **cùng clientKey gửi 2 lần chỉ tạo 1 đơn**; đặt xong tin "reserved", kho chưa trừ; xác nhận → kho 40 → 38, tin "Đã bán", hoa hồng 400.000 ₫ tính trên giá cuối 5.000.000 ₫; COD hoàn thành → Đã thanh toán | ✅ |
| API-25 | F56 | CN + BM | Chưa hoàn thành không đánh giá được; 6 sao bị từ chối; người không mua → 403; mỗi dòng đơn một lần (409); hồ sơ người bán: 2 đánh giá, trung bình 4,5, 2 giao dịch thành công | ✅ |
| API-26 | F49 | CN + BM | Thành viên tất toán → 403; tin đang bán → 400; tất toán đúng số tiền 4.600.000 ₫; **không tất toán 2 lần** (409) | ✅ |
| API-27 | F20 | CN + GH + BM | Xác nhận trừ kho, hủy hoàn kho, **hủy lần 2 không hoàn thêm**; tin ký gửi trong đơn hủy quay lại "Đang bán"; kho về 0 sau khi đặt → không xác nhận được (409); A hủy đơn của B → 403; khách tự hủy đơn Chờ xác nhận; khách không đặt hàng được (401) | ✅ |
| API-28 | F50, F51 | BM + CN | **A gắn tin của B → 403**; tin đã gắn topic khác → 409; danh sách tin gắn được chỉ còn tin chưa có topic; thẻ sản phẩm trong topic có đủ thông tin; tin Chờ kiểm định hiện "Chưa xác thực"; tin đã bán → danh sách topic hiện ĐÃ BÁN | ✅ |
| API-29 | F42 | CN + BM | Lý do báo cáo phải nằm trong danh sách; báo cáo trùng → 409; **thành viên xem báo cáo / khóa topic → 403**; Mod ẩn bài → tác giả bị trừ đúng số like của bài, báo cáo tự xử lý; bỏ ẩn → cộng lại; không ẩn riêng bài mở topic; topic ẩn → khách 404, Mod vẫn xem; **Mod khóa Admin → 403**; khóa thành viên → bị đăng xuất ngay, đăng nhập báo BANNED; nhận xét bị ẩn không còn trên hồ sơ | ✅ |
| API-30 | Truy cập trái phép, hết hạn | BM + GH | A rút tin của B → 403; A hủy trả giá của B → 403; "Tin ký gửi của tôi" chỉ có tin của mình; rút tin → trả giá đang chờ bị từ chối; tin quá 7 ngày chưa kiểm định tự chuyển "Hết hạn kiểm định" | ✅ |
| API-31 | Hashtag thẻ / bộ (F34+) | CN + BM | Topic mẫu có hashtag + ảnh bìa; khách gắn hashtag → 401; mã thẻ lạ "../../x" → 400; đăng bài: `#surgingsparks` (chữ thường) và `#PikachuEx_SV08_238` được nhận, `#KhongCo` và "#" trong link bỏ qua; sửa bài bỏ hashtag → bài hết gắn hashtag đó; gợi ý "surging" có bộ sv08 shop đang bán; hashtag chưa có → 404 | ✅ |
| API-32 | OTP chế độ lập trình | BM | `/api/auth/dev-code` trả `enabled: false`, không có mã khi chạy kiểm thử hoặc đã cấu hình Gmail (chỉ hiện mã trên trang khi máy chưa cấu hình Gmail và không chạy production) | ✅ |

## 7. Luồng trên trình duyệt (Playwright, dữ liệu mẫu mới)

| Mã | Các bước | Kết quả thực tế |
|---|---|---|
| UI-15 | Khách mở Bộ sưu tập, tìm "greninja 214" trên TCGdex, chọn thẻ | ✅ Greninja ex, Holo, giá tham khảo 6.041.000 ₫ |
| UI-16 | Thêm 2 lá LP vào Đang có | ✅ Lưu trong localStorage, tổng 12.082.000 ₫ |
| UI-17 | Đăng nhập từ trang Bộ sưu tập | ✅ Quay lại đúng trang, hiện hộp hỏi gộp |
| UI-18 | Bấm "Gộp vào tài khoản" | ✅ Thẻ lên server, bản trên trình duyệt bị xóa |
| UI-19 | Đăng tin ký gửi bấm gửi khi thiếu ảnh / giá | ✅ "Cần ít nhất 2 ảnh thật…", "Giá mong muốn tối thiểu 50.000 ₫" |
| UI-20 | Nhập giá 6.500.000 ₫, 2 ảnh, đồng ý | ✅ Thấy trước phí 520.000 ₫, nhận 5.980.000 ₫; tạo KG-0009 |
| UI-21 | Admin tìm KG-0009, ghi NM, giá 6.200.000 ₫, 1 ảnh shop chụp, Đạt | ✅ Tin rời mục Chờ kiểm định |
| UI-22 | Bao trả giá 5.500.000 ₫ | ✅ "đang chờ người bán trả lời", có nút Hủy đề nghị |
| UI-23 | Tuan chấp nhận ở "Tin ký gửi của tôi" | ✅ Trạng thái "Đang giữ cho người trả giá" |
| UI-24 | Bao tải lại tin, thêm vào giỏ | ✅ Giá đã chốt 5.500.000 ₫, giỏ có dòng Ký gửi |
| UI-25 | Bấm Đặt hàng khi chưa nhập thông tin | ✅ "Vui lòng nhập họ tên người nhận." |
| UI-26 | Nhập tên, SĐT, chọn nhận tại cửa hàng, Đặt hàng | ✅ Sang orders.html, mã DH-00004, giỏ được xóa |
| UI-27 | Admin: Xác nhận → Sẵn sàng tại cửa hàng → Hoàn thành | ✅ "Hoàn thành · Đã thanh toán" |
| UI-28 | Bao chấm 5 sao + nhận xét | ✅ "Đã đánh giá người bán" |
| UI-29 | Admin tab Chờ tất toán → Đã trả tiền tại quầy | ✅ 2 → 1 tin chờ; Tuan thấy "Đã tất toán" |
| UI-30 | Son mở new-thread.html?listing=4 | ✅ Tự chọn tag Mua bán, chọn đúng tin, gợi ý tiêu đề |
| UI-31 | Đăng topic | ✅ Thẻ sản phẩm Pikachu (Illustration Rare) ở đầu topic |
| UI-32 | Kenjiro bấm Báo cáo, chọn lý do trong hộp thoại | ✅ Gửi được |
| UI-33 | Mod mở Kiểm duyệt, bấm Ẩn bài | ✅ Báo cáo 2 → 1 |
| UI-34 | Mod khóa topic từ thanh Kiểm duyệt | ✅ Topic hiện "Đã khóa" |
| UI-35 | Rê chuột lên tên Kenjiro ở "Thành viên nổi bật tuần" | ✅ Thẻ xem nhanh: Grand Master, 2.807 like, 4 thẻ sưu tập, nút Xem bộ sưu tập |
| UI-36 | 11 trang mới ở 390px, trang Ký gửi ở 768px | ✅ Không tràn ngang, 0 lỗi Console |
| UI-37 | 7 trang cũ + thêm 2 sản phẩm vào giỏ | ✅ 0 lỗi, giỏ `[{"id":1,…},{"id":2,…}]` |

## 8. Lỗi phát hiện trong đợt 2 và đã sửa

| Mã | Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|---|
| L11 | Tìm "greninja 214" không ra thẻ nào | Bộ lọc `localId=eq:214` của TCGdex trả về rỗng; bộ lọc thường lại khớp lỏng ("19" ra cả 194, 199) | Dùng bộ lọc thường rồi lọc lại đúng số thẻ ở trình duyệt |
| L12 | Thỉnh thoảng tải chi tiết thẻ báo lỗi CORS | TCGdex trả lỗi tạm thời không kèm header CORS (gọi lại ngay thì được) | `fetchTcgdex()` tự thử lại một lần sau 0,8 giây, báo lỗi dễ hiểu nếu vẫn hỏng |
| L13 | Ca API-13 cũ mong "Mua bán bị khóa" | Đợt 2 mở tag Mua bán, lỗi chuyển sang ô chọn tin ký gửi | Sửa ca kiểm thử: mong lỗi ở ô `listingId` |

## 9. Giới hạn còn lại (đợt 2)

- Tồn kho hiển thị ở trang Sản phẩm vẫn đọc từ `js/data/products.js`; tồn kho khi đặt hàng nằm ở server. Cần trang quản lý sản phẩm (F19) để đồng bộ.
- Tra thẻ cần Internet (TCGdex). Ảnh trong dữ liệu mẫu dùng ảnh có sẵn trong `images/cards/` nên chạy được khi không có mạng.
- Tin / trả giá quá hạn chỉ đổi trạng thái khi có yêu cầu API tới server.
