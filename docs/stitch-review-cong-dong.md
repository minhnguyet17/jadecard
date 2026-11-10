# Đánh giá giao diện Stitch: Tài khoản, Diễn đàn, Ký gửi

> **Ngày:** 09/11/2026
> **Nguồn:** `stitch_forum_f368/`, `stitch_login_account/`, `stitch_san_ky_gui/` (11 màn hình, chỉ có bản máy tính).
> **Đã áp dụng (09/11/2026):** 11 màn hình đã được lập trình lại bằng HTML + SCSS + JavaScript thuần theo bảng giữ / sửa / bỏ dưới đây, kèm bản điện thoại.
> **Đối chiếu với:** REQUIREMENTS v2.0 và [ke-hoach-cong-dong.md](ke-hoach-cong-dong.md).

**Nguyên tắc khi lập trình:**
- Stitch chỉ là **tham khảo phong cách**. Code viết lại bằng HTML + SCSS + JavaScript thuần (không dùng Tailwind của Stitch).
- Nội dung đi theo REQUIREMENTS.
- **Bản điện thoại** do mình tự làm theo bố cục máy tính, vì Stitch chưa có.

---

## 1. Những điều áp dụng cho mọi màn hình

| Stitch | Xử lý | Lý do |
|---|---|---|
| Thương hiệu "JadeCard Vault & Forum", "Jade Appraisal" | **Sửa** thành logo JadeCard hiện tại | Một thương hiệu duy nhất |
| Header riêng: Diễn đàn · Sàn ký gửi · Kiểm định · Xếp hạng · Bộ sưu tập, không có giỏ hàng | **Sửa:** giữ header của shop, menu thành Trang chủ · Sản phẩm · **Ký gửi** · **Diễn đàn** · Check thẻ, có ô tìm kiếm, giỏ hàng và **avatar + tag chức vụ**. Bộ sưu tập, Tin ký gửi của tôi, Đăng xuất để trong menu avatar | Diễn đàn và ký gửi là một phần của shop. Không có trang "Kiểm định" hay "Xếp hạng" riêng |
| Chữ trang trí kỹ thuật: "MAINNET ACTIVE", "VAULT NETWORK: SYNCHRONIZED", "V4.8 ULTRA", "SHA256", "4096-bit RSA", "PORT 8443", "AES-256" | **Bỏ** | Sai sự thật, dễ bị hỏi lúc chấm bài |
| Số liệu bịa: "20.244+ nhà sưu tầm", "18,2 tỷ giao dịch", "94,8% giao dịch xác thực", "khớp lệnh 24h", "1.482 đang trực tuyến" | **Bỏ**, hoặc thay bằng số đếm thật từ cơ sở dữ liệu (số topic, số bài, số tin đang bán) | Không đưa số liệu không có thật lên web |
| Lời hứa dịch vụ: bảo hiểm 100%, hoàn 200%, kho lạnh Thụy Sĩ, giao hỏa tốc 2 giờ, soi kính 30x / 400x | **Bỏ**. Chỉ giữ: kiểm định tận tay tại cửa hàng, quay video đóng gói, phí giao hàng 30.000 ₫ hoặc nhận tại cửa hàng | Chỉ hứa những gì REQUIREMENTS có |
| Địa chỉ "72 Bà Triệu, Hoàn Kiếm, Hà Nội", hotline 1900 6868, bản đồ Hà Nội | **Sửa** thành dữ liệu mẫu đang dùng: 123 Đường Mẫu, Quận 1, TP.HCM (ghi "dữ liệu mẫu"). Bỏ bản đồ | Không dùng thông tin có thể là của người / doanh nghiệp thật |
| Giá USD kèm theo ("≈ $295") | **Bỏ** ở tin ký gửi; nếu cần thì hiện "Giá tham khảo quốc tế" theo F11 (tỉ giá 26.000) | Số USD của Stitch không khớp tỉ giá của dự án |
| Nhãn chấm điểm PSA 10, BGS 9.5, CGC, điểm centering, "Forensic Telemetry Report" | **Bỏ**. Tình trạng chỉ là NM / LP / MP / HP | Chấm điểm thẻ (grading) nằm ngoài phạm vi |
| Thông báo (chuông), tin nhắn, nút "Nhắn tin", "Theo dõi", "Trả giá riêng", sao đánh giá người bán, "Tài khoản đã định danh (KYC)" | **Chờ Jade chọn** (mục 4). Mặc định là bỏ | Ngoài phạm vi v2.0 |

---

## 2. Từng màn hình

### Tài khoản

| Màn hình | Giữ | Sửa / bỏ |
|---|---|---|
| **Đăng ký** | Bố cục 2 cột (lợi ích bên trái, form bên phải), lỗi "Email đã được đăng ký" ngay dưới ô, thanh độ mạnh mật khẩu, bộ đếm 0/20 cho tên hiển thị, ô đồng ý Quy định diễn đàn | Bỏ Google ID / Apple Passkey (đăng nhập mạng xã hội ngoài phạm vi). Quy tắc mật khẩu: **ít nhất 8 ký tự** (không bắt buộc chữ hoa / ký tự đặc biệt), thanh độ mạnh chỉ để gợi ý. Viết lại 3 lợi ích theo đúng chức năng: lên chức vụ, ký gửi tại cửa hàng, theo dõi đơn hàng |
| **Nhập OTP** | 6 ô số, đếm ngược "Gửi lại sau 0:42", "Đổi địa chỉ email khác", trạng thái sai mã và kích hoạt thành công, cảnh báo không chia sẻ OTP | Nhãn "Xác thực hai lớp (2FA)" → **"Xác thực email"** (đây không phải 2FA). Sai 5 lần thì **mã hết hiệu lực, phải gửi mã mới** (đúng F31), không khóa 15 phút |
| **Đăng nhập + Quên mật khẩu** | Hai khối cạnh nhau, quên mật khẩu 2 bước có chỉ báo bước, thông báo trung tính "Nếu email tồn tại..." (đúng F33) | Bỏ Passkey FIDO2 / Google Auth, bỏ thẻ "Charizard PSA 10", "Vault Singapore". "Gửi liên kết OTP" → "Gửi mã OTP". Ô "Email hoặc tên hiển thị" và "Ghi nhớ đăng nhập": chờ Jade chọn (mục 4) |

### Diễn đàn

| Màn hình | Giữ | Sửa / bỏ |
|---|---|---|
| **Trang chủ diễn đàn** | Khối F100 / F368 / F666 có mã Fxx, số topic, số bài, topic mới nhất kèm tác giả và tag chức vụ; khối Quy định diễn đàn với câu "Mọi giao dịch Mua bán bắt buộc qua Ký gửi JadeCard" | Bỏ "Chỉ số thẻ Sàn Ký Gửi hôm nay" (+12,4%...): đó là lịch sử giá, ngoài phạm vi. Thay bằng **"Tin ký gửi mới nhất"** (lấy từ dữ liệu thật). Khối "Thành viên nổi bật tuần" và "Đang trực tuyến": chờ Jade chọn |
| **Danh sách topic F368** | Tiêu đề lớn "F368 / Thợ săn tiền thưởng", chip lọc tag kèm số lượng, mục "Chủ đề ghim", dòng Mua bán có ảnh nhỏ, giá niêm yết và huy hiệu "JadeCard đã xác thực", phân trang | Bỏ "JADECARD ESCROW · Bảo chứng hoàn tiền 100%". Cột "Lượt xem": chờ Jade chọn. Tag Bóc thẻ / Định giá / Mua bán giữ đúng màu |
| **Topic Mua bán** | **Thẻ sản phẩm ở đầu topic** (ảnh, tên, set, số thẻ, tình trạng, giá, người bán + chức vụ, "Thêm vào giỏ hàng") đúng F50; link tin ký gửi trong bài trả lời tự hiện thành thẻ nhỏ đúng F51; khung tác giả bên trái (ngày tham gia, số bài, lượt thích, "Đã bán thành công"); Like / Trích dẫn / Trả lời / Báo cáo; ô trả lời nhanh có thanh công cụ đơn giản (đậm, nghiêng, trích dẫn, ảnh) | Bỏ dòng "Giao dịch tương tự gần nhất ... đã bán 9.200.000" (lịch sử giá). Bỏ "Uy tín cộng đồng 100%". "Xem biên bản kiểm định" → mở kết quả kiểm định (ngày, tình trạng thực tế, thật / giả, ảnh shop chụp). "Tình trạng Near Mint (NM 9.0–9.5)" → "NM". "Theo dõi topic", "Theo dõi phản hồi qua thông báo": chờ Jade chọn |
| **Hồ sơ + Bộ sưu tập** | Đầu hồ sơ (avatar, tên, tag chức vụ, ngày tham gia, số bài, lượt thích, số lần ký gửi thành công), **thanh tiến độ "412 / 1.000 like tới Master"**, thang 7 chức vụ, 3 tab với **Bộ sưu tập** đứng đầu, Đang có / Đang săn, lọc theo set và độ hiếm, nhãn **"Đang bán"** trên thẻ đang ký gửi, **thẻ xem nhanh khi rê chuột vào avatar** | "Tổng giá trị Binder" chỉ hiện khi chủ bật (mặc định ẩn, F27). Nhãn PSA / BGS / CGC → tình trạng NM / LP... kèm số lượng. Bỏ "Chỉ số uy tín thợ săn" (tỉ lệ hoàn tất, thời gian phản hồi, Tier A+). Nút "Nhắn tin", "Theo dõi": chờ Jade chọn |

### Ký gửi

| Màn hình | Giữ | Sửa / bỏ |
|---|---|---|
| **Sàn ký gửi** | Bố cục giống trang Sản phẩm (bộ lọc trái, lưới thẻ phải), huy hiệu "JadeCard đã xác thực", khung người bán (avatar, tên, tag chức vụ, số giao dịch thành công), nút "Thêm vào giỏ" và "Xem chi tiết", banner "Ký gửi thẻ của bạn, JadeCard kiểm định và bán hộ · Phí 8%" | Bỏ 3 số liệu bịa ở banner, bỏ "bảo hiểm 100%, kho lạnh Thụy Sĩ, cấp số Slab". Bỏ công tắc "Kho JadeCard · ship hỏa tốc 2H". Bộ lọc tình trạng: NM / LP / MP / HP (bỏ "PSA/BGS Slab"). Bỏ "(100% uy tín)" |
| **Chi tiết tin ký gửi** | Hai nhóm ảnh "JadeCard chụp khi kiểm định" / "Người bán cung cấp", khối kết quả kiểm định (tình trạng thực tế, ngày kiểm định, thẻ thật, thẻ đang được giữ tại cửa hàng), khung người bán, link "Topic F368 liên kết", "Thêm vào giỏ hàng" | Bỏ "Trả giá riêng", "Nhắn tin cho người bán", sao đánh giá, KYC. Bỏ "Chính sách bảo trợ" (bảo hiểm, hoàn 200%, giao 2H) → thay bằng chính sách thật: kiểm định tận tay, quay video đóng gói, giao hàng 30.000 ₫ hoặc nhận tại cửa hàng. Bỏ "Báo cáo giám định chuyên sâu" (centering, corners...). "Tiền mặt / Escrow" → bỏ |
| **Đăng tin ký gửi (4 bước)** | Thanh 4 bước, thẻ đã chọn kèm 4 ảnh, **ô giá mong muốn + bảng trừ phí rõ ràng** (giá − 8% = bạn nhận), mã tin KG-0042, hạn **mang thẻ đến trong 7 ngày**, ô **"Tự động tạo topic rao bán trong F368"** (hợp với F50) | "Khung giá thị trường dựa trên 8 giao dịch" → thay bằng **giá tham khảo quốc tế quy đổi VND** (F11, TCGdex). "Số tiền thực nhận (rút về tài khoản), tự động đối soát chuyển khoản" → **"Bạn nhận tại quầy khi thẻ được bán"**. Bỏ "Phí thanh toán chuyển khoản nội địa". Phí 8% chỉ gồm kiểm định và bán hộ (bỏ bảo hiểm, kho lạnh, soi 400x). Địa chỉ → dữ liệu mẫu, bỏ bản đồ |
| **Quản lý ký gửi + Admin kiểm định** | Bảng "Tin ký gửi của tôi" (mã, ảnh, tình trạng, giá niêm yết, bạn thực nhận, trạng thái, Rút tin / Gắn vào F368) = **F48**; khối kiểm định: tìm theo mã KG, ảnh người bán chụp bên trái, biên bản bên phải (Thật / Nghi giả, tình trạng thực tế, giá niêm yết chốt, ảnh shop chụp, Đạt / Từ chối) = **F44**; tab "Đối soát & tất toán quầy" = **F49** | **Tách thành 2 trang**: `my-listings.html` cho thành viên và `admin/consignments.html` cho admin (quyền khác nhau, kiểm tra ở server). Bỏ "Hồ sơ Slab số", "Xuất bảng sao kê", "v4.8 Secured". Tình trạng "NM 9.0–9.5" → NM |

---

## 3. Màn hình còn thiếu (mình tự dựng theo phong cách chung)

- **Tạo topic:** dùng lại ô soạn thảo của trang topic, thêm chọn tag tiền tố và ô chọn tin ký gửi khi tag là Mua bán.
- **Topic thường** (không phải Mua bán): giống topic Mua bán nhưng không có thẻ sản phẩm.
- **Trang Quy định diễn đàn.**
- **Bản điện thoại cho cả 11 màn hình.** Khung tác giả chuyển thành một hàng ở đầu bài; bộ lọc thu gọn giống trang Sản phẩm; thẻ sản phẩm trong topic Mua bán dính ở đáy màn hình giống thanh mua nhanh hiện có.

---

## 4. Tính năng Stitch thêm vào: Jade chọn giữ hay bỏ

**Jade đã chọn (09/11/2026), REQUIREMENTS lên v2.1:**

| Tính năng | Quyết định | Mã |
|---|---|---|
| Lượt xem topic | **Giữ** | F52 |
| Thành viên nổi bật tuần (trang chủ diễn đàn) | **Giữ** | F53 |
| Thẻ xem nhanh khi rê avatar | **Giữ** | F54 |
| Trả giá tin ký gửi | **Thêm** | F55 |
| Đánh giá người bán (sao + nhận xét) | **Thêm** | F56 |
| Tự tạo topic F368 khi đăng ký gửi | Bỏ (người bán tự mở topic Mua bán và gắn tin, F50) | |
| Đăng nhập bằng tên hiển thị, "Ghi nhớ đăng nhập" | Bỏ (đăng nhập bằng email) | |
| Nhắn tin riêng | Bỏ | |
| Theo dõi topic / thành viên, chuông thông báo | Bỏ | |
| Đăng nhập Google / Apple / Passkey | Bỏ | |
| "Đang trực tuyến" | Bỏ | |

**Vì sao "Trả giá riêng" vẫn hợp với mô hình ký gửi:**
- Trả giá chỉ là một đề nghị trên web. Khi người bán đồng ý, thẻ (đang ở cửa hàng) được giữ 24 giờ cho người trả giá và bán theo giá đã chốt qua đơn hàng của shop.
- JadeCard vẫn thu hoa hồng trên giá cuối cùng.
- Không có tiền chuyển trực tiếp giữa hai thành viên.
