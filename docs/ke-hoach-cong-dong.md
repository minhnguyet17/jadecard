# Kế hoạch: Tài khoản, Diễn đàn và Ký gửi

> **Trạng thái (cập nhật 09/11/2026, cuối ngày):** **Đã lập trình xong toàn bộ kế hoạch** (đợt B → I, REQUIREMENTS v2.1: F27, F30–F56), kèm đặt hàng tối giản (F05, F07, F20) vì F47 cần đơn hàng. Kiểm thử: 30 ca API + luồng trình duyệt, xem [test-report-cong-dong.md](test-report-cong-dong.md). Phần dưới đây giữ nguyên làm hồ sơ kế hoạch.
> **Ngày:** 09/11/2026
> **Thứ tự làm việc:** chốt kế hoạch → Jade dựng giao diện bằng Stitch (prompt ở [stitch-prompts-cong-dong.md](stitch-prompts-cong-dong.md)) → lập trình theo giao diện Stitch.

**Mục tiêu:** TCG là một cộng đồng. JadeCard không chỉ bán hàng mà phải giữ chân người chơi bằng ba thứ:
1. **Tài khoản** để mỗi người có danh tính.
2. **Diễn đàn** để khoe bóc thẻ, hỏi giá, bàn chiến thuật và lên "chức vụ".
3. **Ký gửi** để người chơi bán thẻ qua JadeCard. JadeCard xác thực thẻ và ăn hoa hồng.

Ba phần nối với nhau: tin ký gửi được rao trong F368, chức vụ của người bán hiện ngay trên tin. Vòng **Mua → Check → Bán → Trade** ở trang chủ trở thành vòng thật.

---

## 1. Các quyết định

**Đã chốt (09/11/2026):**
- **Q1:** backend Node.js + Express + SQLite.
- **Q2:** xác thực bằng OTP 6 số.
- **Q3:** ký gửi tại cửa hàng.
- **Q4:** "Chiếu mới" là cấp thấp nhất.
- **Q6:** hoa hồng 8%, tối thiểu 20.000 ₫ (giả định).
- **Q7:** bộ sưu tập theo tài khoản, xem được khi bấm avatar (mục 4.5). Đây là ý của Jade.

**Q5 (thời điểm lập trình):** làm sau khi có giao diện Stitch.

**Sau khi duyệt Stitch (REQUIREMENTS v2.1):**
- **Thêm:** F52 lượt xem, F53 thành viên nổi bật tuần, F54 thẻ xem nhanh khi rê avatar, F55 trả giá tin ký gửi, F56 đánh giá người bán.
- **Vẫn bỏ:** nhắn tin, theo dõi / thông báo, đăng nhập mạng xã hội, tự tạo topic khi đăng ký gửi, đăng nhập bằng tên hiển thị.
- Xem [stitch-review-cong-dong.md](stitch-review-cong-dong.md).

| # | Câu hỏi | Đề xuất | Lý do |
|---|---|---|---|
| Q1 | Làm backend bằng gì? | **Node.js + Express + SQLite**, gửi mail bằng Nodemailer | Cùng ngôn ngữ JavaScript với phần đã học. Cơ sở dữ liệu là một file, không cần tài khoản cloud. Chạy bằng một lệnh `npm start`. Phương án khác: Firebase/Supabase làm sẵn đăng nhập và mail, nhưng giấu mất phần backend mà môn học sẽ chấm. |
| Q2 | Xác thực email bằng link hay OTP? | **OTP 6 số** | Xem mục 3.1. Link và OTP đều cần một dịch vụ gửi mail, nên OTP không tránh được dịch vụ ngoài. Nhưng link sẽ trỏ về `localhost`: bấm link trong mail trên điện thoại sẽ không mở được web đang chạy trên máy tính. OTP thì nhập ở đâu cũng được. |
| Q3 | "Ký quỹ" vận hành thế nào? | **Ký gửi tại cửa hàng** | Xem mục 5.1. Người bán mang thẻ đến shop để kiểm định. Shop giữ thẻ, bán hộ, rồi trả tiền tại quầy (đã trừ hoa hồng). Không phải giữ tiền online, không cần cổng thanh toán, không lưu số tài khoản. Đúng tinh thần "keep it simple" của luồng thu mua. |
| Q4 | Chức vụ tính thế nào? | **Dùng chung mọi forum, tính theo tổng like nhận được** | Xem mục 4.4. Cần chốt thứ tự "Chiếu mới" và "Học việc": trong tiếng lóng, "chiếu mới" là người mới tinh, nên đề xuất xếp thấp nhất. |
| Q5 | Làm khi nào? | **Thiết kế (Stitch) ngay; lập trình backend khi môn học tới phần backend**, hoặc làm trước nếu Jade muốn | Đề môn học hiện mới tới Buổi 3 (JavaScript + localStorage). Làm trước thì có thể lệch với công nghệ backend thầy yêu cầu sau này. |
| Q6 | Phí hoa hồng ký gửi? | **8%, tối thiểu 20.000 ₫** (giả định để mô phỏng) | Jade chốt con số. |

---

## 2. Thay đổi phạm vi (REQUIREMENTS v1.0 → v2.0)

Ở bản v1.0 đã chốt:
- **Ký gửi (F25)** nằm ở mục "Nâng cao" và "Ngoài phạm vi".
- **Sàn mua bán giữa người dùng (P2P)** nằm ở mục "Ngoài phạm vi".
- Chưa có diễn đàn.

Yêu cầu mới vì vậy là một lần mở rộng phạm vi. Khi Jade đồng ý, mình sẽ sửa REQUIREMENTS lên **v2.0**:
- Đưa F25 Ký gửi vào phạm vi, theo mô hình "ký gửi tại cửa hàng". Vẫn **không** làm P2P tự giao dịch.
- Thêm nhóm chức năng mới:
  - Tài khoản (mở rộng F06): F30–F33.
  - Diễn đàn: F34–F42.
  - Ký gửi: F43–F49.
- Cập nhật vai trò (thêm **Thành viên**, **Điều hành viên / Mod**), luồng nghiệp vụ và trạng thái ký gửi.
- Ghi lại quyết định trong AI_USAGE_LOG và nhật ký thay đổi.

Các quy tắc cũ vẫn giữ:
- Mọi việc liên quan tiền và thẻ thật đều diễn ra **tại cửa hàng**.
- Không thanh toán online, không lưu thông tin ngân hàng của khách.

---

## 3. Tài khoản (F30–F33)

### 3.1. Link hay OTP?

| | Link xác thực | OTP 6 số (đề xuất) |
|---|---|---|
| Cần dịch vụ gửi mail | Có | Có |
| Độ khó lập trình | Tương đương | Tương đương |
| Chạy trên máy cá nhân (`localhost`) | Link chỉ mở được trên đúng máy đang chạy web | Đọc mail ở đâu cũng nhập được |
| Trải nghiệm | Phải chuyển qua lại giữa mail và trình duyệt | Ở lại trang, nhập 6 số |

**Gửi mail, không tốn tiền:**
- **Khi lập trình:** server không gửi mail thật mà in mã OTP ra cửa sổ dòng lệnh. Không cần dịch vụ ngoài.
- **Khi demo:** gửi mail thật qua **Gmail SMTP + App Password**, dùng thư viện Nodemailer. Miễn phí, nhưng cần bật xác minh 2 bước cho Gmail. Mật khẩu ứng dụng để trong file `.env`, **không đưa lên GitHub**.

### 3.2. Chức năng

| Mã | Chức năng | Tiêu chí nghiệm thu |
|---|---|---|
| F30 | Đăng ký | Nhập email, tên hiển thị (3–20 ký tự, không trùng), mật khẩu (ít nhất 8 ký tự). Email đã có thì báo lỗi. Tài khoản ở trạng thái **Chưa xác thực**. |
| F31 | Xác thực email bằng OTP | OTP 6 số, hết hạn sau 10 phút, sai tối đa 5 lần. Được gửi lại sau 60 giây. Đúng mã thì tài khoản được kích hoạt và tự đăng nhập. Server chỉ lưu bản mã hóa (hash) của OTP. |
| F32 | Đăng nhập / đăng xuất | Tài khoản chưa xác thực thì được chuyển sang trang nhập OTP. Sai mật khẩu 5 lần thì khóa 15 phút. Phiên đăng nhập dùng cookie httpOnly. |
| F33 | Quên mật khẩu | Nhập email → nhận OTP → nhập OTP và mật khẩu mới. Thông báo **luôn giống nhau** dù email có tồn tại hay không, để tránh lộ email thành viên. Đổi xong thì mọi phiên cũ bị đăng xuất. |

**Trang mới:**
- `register.html`, `verify.html` (nhập OTP), `login.html`, `forgot-password.html`.
- Header có menu tài khoản: ảnh đại diện, tên kèm chức vụ, Hồ sơ, Tin ký gửi của tôi, Đăng xuất.

---

## 4. Diễn đàn (F34–F42), kiểu VOZ / F319

### 4.1. Cấu trúc
```
Diễn đàn
└── Khu vực (ví dụ "Cộng đồng JadeCard")
    └── Forum Fxx (F368, F666...)
        └── Topic (có tag tiền tố: [Bóc thẻ], [Mua bán]...)
            └── Bài trả lời (có like, trích dẫn)
```

### 4.2. Các forum đề xuất

| Mã | Tên | Dành cho | Tag tiền tố |
|---|---|---|---|
| F368 | Thợ săn tiền thưởng | Bóc thẻ, khoe thẻ, định giá thẻ, rao vặt | `Bóc thẻ`, `Định giá`, `Mua bán` |
| F666 | Thần bài | Luật chơi, xây deck, sức mạnh của thẻ, meta | `Hỏi đáp`, `Deck`, `Luật chơi`, `Meta` |
| F100 | Thông báo JadeCard | Tin hàng về, sự kiện, quy định diễn đàn (chỉ admin đăng) | `Thông báo`, `Sự kiện` |

Jade có thể thêm forum khác, ví dụ F777 cho tán gẫu.

### 4.3. Chức năng

| Mã | Chức năng | Tiêu chí nghiệm thu |
|---|---|---|
| F34 | Trang chủ diễn đàn | Danh sách forum. Mỗi forum có số topic, số bài, topic mới nhất. |
| F35 | Danh sách topic | Topic ghim nằm trên cùng. Các topic còn lại sắp theo bài trả lời mới nhất, 20 topic mỗi trang. Lọc được theo tag tiền tố. |
| F36 | Xem topic | 20 bài mỗi trang. Khung tác giả gồm ảnh đại diện, tên, **tag chức vụ**, số bài, số like nhận được. |
| F37 | Tạo topic | Tiêu đề, tag tiền tố, nội dung, tối đa 4 ảnh (mỗi ảnh tối đa 5MB, JPG/PNG/WebP). Phải đăng nhập và đã xác thực email. |
| F38 | Trả lời, trích dẫn | Trả lời ở cuối topic. Nút "Trích dẫn" chèn đoạn trích của bài gốc. Topic bị khóa thì không trả lời được. |
| F39 | Like | Mỗi người like một bài một lần, bấm lại để bỏ like. Không tự like bài mình. Like làm thay đổi chức vụ của tác giả. |
| F40 | Chức vụ | Xem mục 4.4. Tag hiện ngay cạnh tên ở mọi nơi: topic, bài viết, hồ sơ, tin ký gửi. |
| F41 | Hồ sơ thành viên | Tên, chức vụ, thanh tiến độ tới chức vụ tiếp theo, ngày tham gia, số bài, số like, các topic gần đây, tin ký gửi đang bán. |
| F42 | Kiểm duyệt | Thành viên được báo cáo bài vi phạm. Mod/Admin được ghim, khóa, ẩn topic hoặc bài, và khóa tài khoản. |

**Nội dung bài viết:**
- Chỉ là chữ thuần, có xuống dòng, link tự nhận, trích dẫn, in đậm đơn giản.
- **Mọi nội dung đều được lọc HTML** để chống chèn mã độc (XSS).
- MVP không làm trình soạn thảo định dạng phức tạp.

### 4.4. Chức vụ (đề xuất)

| Chức vụ | Like nhận được | Ghi chú |
|---|---|---|
| Chiếu mới | 0 | Mặc định khi vừa xác thực email |
| Học việc | 10 | |
| Thợ săn sơ cấp | 50 | |
| Thợ săn chuyên nghiệp | 150 | |
| Thợ săn lão làng | 400 | |
| Master | 1.000 | |
| Grand Master | 2.500 | |

**Chống gian lận like:**
- Không tự like.
- Chỉ tính like từ tài khoản đã xác thực.
- Bài bị ẩn thì trừ like tương ứng.

**Tag nhân viên:** `Admin` và `Mod JadeCard` là tag riêng, hiện song song với chức vụ.

### 4.5. Xem bộ sưu tập của thành viên khác (F27, F41)

Đây là điểm thu hút của cộng đồng: bấm vào **avatar hoặc tên** của bất kỳ ai sẽ mở **hồ sơ**, và tab đầu tiên là **Bộ sưu tập** của người đó. Avatar và tên hiện ở topic, bài viết, tin ký gửi, bảng xếp hạng.

- **Tab Bộ sưu tập:** hai mục *Đang có* (lưới ảnh thẻ, số lượng, tình trạng) và *Đang săn*.
  - Thẻ nào người đó đang ký gửi thì có nhãn **"Đang bán"** và link sang tin ký gửi.
  - Đây là cầu nối từ khoe thẻ sang mua bán qua JadeCard.
- **Quyền riêng tư:**
  - Mặc định công khai **danh sách thẻ** nhưng **ẩn tổng giá trị**. Chủ có thể bật hiện tổng giá trị, hoặc ẩn cả bộ sưu tập.
  - Lý do: công khai bộ sưu tập giá trị cao có thể khiến người dùng bị nhắm tới khi giao dịch trực tiếp.
- **Lưu trữ (sửa quy tắc PB22 của v1.0):**
  - Chưa đăng nhập: vẫn lưu trên trình duyệt như hiện nay.
  - Lần đầu đăng nhập: hỏi có gộp bộ sưu tập trên trình duyệt vào tài khoản không.
  - Đã đăng nhập: lưu trên server.
- **Thứ tự làm:** Bộ sưu tập bản trình duyệt (F13, F14, việc T3.8) nên làm trước. Khi có tài khoản, chỉ cần chuyển chỗ lưu sang server.
- **Ý tưởng để sau (ngoài phạm vi):** "Ai đang có lá bạn săn". Hệ thống tự ghép danh sách Đang săn của bạn với Đang có của người khác. Chưa làm, vì sẽ khuyến khích thành viên tự giao dịch, trong khi mọi mua bán phải qua Ký gửi.

---

## 5. Ký gửi (F43–F49)

### 5.1. Mô hình đề xuất: ký gửi tại cửa hàng

"Ký quỹ" trong tài chính nghĩa là giữ tiền làm bảo đảm. Chức năng Jade mô tả (người chơi đăng bán, JadeCard xác thực thẻ và ăn hoa hồng) gần với **ký gửi** hơn. Có ba cách vận hành:

| Phương án | Cách chạy | Đánh giá |
|---|---|---|
| **A. Ký gửi tại cửa hàng (đề xuất)** | Người bán đăng tin → mang thẻ đến shop → shop kiểm định, giữ thẻ, niêm yết → người mua mua như sản phẩm của shop → bán xong, shop trả tiền cho người bán tại quầy, trừ hoa hồng | An toàn nhất, không lừa đảo, không giữ tiền online. Thu hoa hồng chắc chắn. Người bán phải đến cửa hàng. |
| B. Rao vặt + xác thực tùy chọn | Người bán tự giao dịch với người mua. JadeCard chỉ kiểm định khi hai bên mang thẻ đến | Khó thu hoa hồng, dễ bị lừa ngoài sàn, shop phải gánh rủi ro uy tín |
| C. Giữ tiền online (escrow thật) | Người mua chuyển tiền cho JadeCard giữ, người bán gửi thẻ qua bưu điện | Cần cổng thanh toán và vận chuyển. Giữ tiền hộ người khác có thể cần giấy phép. Ngoài sức một đồ án |

### 5.2. Trạng thái tin ký gửi (phương án A)

```
Chờ kiểm định ──(mang thẻ đến, đạt)──► Đang bán ──(có người mua)──► Đã bán ──(trả tiền tại quầy)──► Đã tất toán
     │                                    │
     ├─(không đạt / thẻ giả)──► Từ chối      ├─(người bán rút)──► Đã rút, trả thẻ
     └─(quá 7 ngày chưa mang thẻ)──► Hết hạn └─(60 ngày chưa bán)──► Hết hạn, trả thẻ
```

### 5.3. Chức năng

| Mã | Chức năng | Tiêu chí nghiệm thu |
|---|---|---|
| F43 | Đăng tin ký gửi | Chọn thẻ (tìm theo tên hoặc số thẻ, dùng lại Check thẻ), biến thể, tình trạng tự đánh giá, 2–6 ảnh thật, giá mong muốn. Thấy trước phí hoa hồng và số tiền dự kiến nhận. Tin ở trạng thái "Chờ kiểm định", chưa hiện công khai. |
| F44 | Kiểm định tại quầy (Admin) | Admin tìm tin theo mã, ghi tình trạng thực tế, thật hay giả, giá niêm yết đã thống nhất với người bán, ảnh chụp tại shop. Đạt thì tin chuyển sang "Đang bán" và có huy hiệu **JadeCard đã xác thực**. |
| F45 | Trang Ký gửi | **Giao diện giống trang Sản phẩm.** Mỗi thẻ có thêm khung người bán (ảnh đại diện, tên, tag chức vụ) và huy hiệu xác thực. Lọc theo set, tình trạng, khoảng giá. |
| F46 | Chi tiết tin ký gửi | Ảnh người bán chụp và ảnh shop chụp, thông tin thẻ, giá, kết quả kiểm định (ngày, tình trạng thực tế), thông tin người bán (chức vụ, số giao dịch thành công), link tới topic F368 nếu có. Nút "Thêm vào giỏ". |
| F47 | Mua tin ký gửi | Dùng chung giỏ hàng và đơn hàng của shop (F04, F05). Mỗi tin chỉ có 1 thẻ nên số lượng luôn bằng 1. Có đơn thì tin bị giữ, xác nhận bán thì chuyển sang "Đã bán". |
| F48 | Tin ký gửi của tôi | Người bán theo dõi trạng thái từng tin, rút tin, xem số tiền sẽ nhận. |
| F49 | Tất toán (Admin) | Admin ghi "đã trả tiền cho người bán tại quầy" và số tiền sau hoa hồng. Không lưu số tài khoản ngân hàng. |

### 5.4. Liên kết với F368 (F50, F51)

- Khi tạo topic trong F368 với tag **Mua bán**, người dùng chọn **một tin ký gửi của chính mình** để gắn vào.
- Topic Mua bán hiện **thẻ thông tin sản phẩm** ở đầu **mọi trang** của topic, thay cho link:
  - Thẻ gồm ảnh, tên, giá, trạng thái, huy hiệu xác thực, người bán kèm chức vụ, nút "Xem / Mua".
  - Thẻ luôn hiển thị theo trạng thái mới nhất. Khi tin chuyển sang "Đã bán", thẻ hiện dấu "ĐÃ BÁN" và topic có thêm tag `Đã bán`.
- Nếu ai đó dán link một tin ký gửi vào bài viết bất kỳ, link đó cũng tự hiện thành thẻ sản phẩm thu nhỏ, giống cách Facebook hiện link.
- **Quy tắc:**
  - Mỗi topic gắn tối đa 1 tin, mỗi tin gắn tối đa 1 topic.
  - Chỉ gắn được tin của chính mình.
  - Tin "Chờ kiểm định" vẫn gắn được, nhưng thẻ hiện nhãn "Chưa xác thực".
- Muốn mua bán trong F368 thì phải qua ký gửi. Diễn đàn ghi rõ quy định này để JadeCard thu được hoa hồng và bảo vệ người mua.

---

## 6. Dữ liệu (bảng chính, phác thảo)

```
users          id, email, display_name, password_hash, role (member|mod|admin), email_verified,
               likes_received, post_count, locked_until, created_at
email_codes    id, user_id, purpose (verify|reset), code_hash, expires_at, attempts, created_at
sessions       id, user_id, expires_at
forums         id, code ("F368"), name, description, sort, admin_only_post
prefixes       id, forum_id, name, color
threads        id, forum_id, user_id, prefix_id, title, listing_id (có thể rỗng), pinned, locked,
               hidden, reply_count, last_post_at, created_at
posts          id, thread_id, user_id, content, hidden, created_at, edited_at
post_images    id, post_id, path
likes          post_id, user_id, created_at   (khóa chính: post_id + user_id)
reports        id, post_id, user_id, reason, status, created_at
listings       id, seller_id, card_name, set, number, variant, condition_declared, condition_verified,
               asking_price, list_price, commission, status, authentic, verified_by, verified_at,
               expires_at, sold_at, settled_at, created_at
listing_images id, listing_id, path, source (seller|shop)
collection     id, user_id, card_id, variant, condition, quantity, list (have|want), saved_price, saved_at
user_settings  user_id, collection_visibility (public|private), show_collection_value
thread_views   thread_id, viewer_key (user_id hoặc mã trình duyệt), viewed_at        (F52)
offers         id, listing_id, buyer_id, amount, status (pending|accepted|declined|expired), expires_at, hold_until (F55)
seller_reviews id, order_item_id, listing_id, seller_id, buyer_id, stars (1–5), comment, hidden, created_at (F56)
```

`ranks` không cần bảng riêng: bảng chức vụ ở mục 4.4 để trong code, chức vụ được tính từ `likes_received`.

---

## 7. Bảo mật và an toàn tối thiểu

- Mật khẩu mã hóa bằng bcrypt. OTP chỉ lưu dạng hash. Cookie phiên có `httpOnly` và `SameSite=Lax`.
- Giới hạn số lần thử: đăng nhập, gửi OTP, nhập OTP.
- Lọc HTML trong mọi nội dung người dùng nhập. Kiểm tra loại và dung lượng ảnh tải lên.
- **Mọi quyền đều kiểm tra ở server**, gồm sửa bài của mình, gắn tin của mình, chức năng admin. Không tin vào giao diện.
- `.env` (mật khẩu Gmail, khóa phiên) không đưa lên GitHub. Có file mẫu `.env.example`.
- Trang **Quy định diễn đàn**: cấm lừa đảo, cấm mua bán ngoài ký gửi, cấm nội dung xúc phạm.

---

## 8. Lộ trình (chia nhỏ cho một người)

| Đợt | Nội dung | Kết quả kiểm tra được |
|---|---|---|
| **A. Chuẩn bị** (làm ngay) | Jade chốt mục 1. Sửa REQUIREMENTS v2.0, vai trò, luồng nghiệp vụ. Jade dựng giao diện bằng Stitch. | Tài liệu v2.0, bộ giao diện Stitch |
| B. Nền backend | Express phục vụ web tĩnh và API `/api/...`, SQLite + tạo bảng, dữ liệu mẫu, cách báo lỗi thống nhất | `npm start` chạy được, `/api/health` trả về OK |
| C. Tài khoản | F30–F33, menu tài khoản trên header | Đăng ký → OTP (in ra dòng lệnh) → đăng nhập → quên mật khẩu |
| D. Diễn đàn: đọc | F34–F36 với dữ liệu mẫu (vài chục topic) | Xem được forum → topic → bài, phân trang |
| E. Diễn đàn: viết | F37–F40: tạo topic, trả lời, trích dẫn, like, chức vụ | Like đủ ngưỡng thì chức vụ đổi |
| E2. Hồ sơ + bộ sưu tập | F41, F27: bấm avatar mở hồ sơ, tab Bộ sưu tập, cài đặt riêng tư, gộp bộ sưu tập từ trình duyệt | Bấm avatar người khác thấy bộ sưu tập; bộ sưu tập riêng tư thì bị ẩn |
| F. Kiểm duyệt | F42 + trang Quy định | Mod ghim, khóa, ẩn được; thành viên báo cáo được |
| G. Ký gửi | F43–F49 + trang admin kiểm định | Đi hết vòng: đăng tin → kiểm định → đang bán → mua → tất toán |
| H. Liên kết F368 | Gắn tin vào topic Mua bán, thẻ sản phẩm ở mọi trang, link tự hiện thành thẻ | Đổi trạng thái tin thì thẻ trong topic đổi theo |
| H2. Bổ sung v2.1 | F52 lượt xem, F53 nổi bật tuần, F54 thẻ xem nhanh, F55 trả giá, F56 đánh giá người bán | Trả giá được chấp nhận thì tin bị giữ 24 giờ; đơn hoàn thành mới đánh giá được |
| I. Kiểm thử, báo cáo | Ca kiểm thử theo tiêu chí nghiệm thu, thêm ca **truy cập trái phép** (A sửa bài của B, A gắn tin của B) | Báo cáo kiểm thử, báo cáo Word theo buổi |

**Việc còn treo từ trước:** thêm nhiều loại pack (T3.15). Có thể làm song song vì không cần backend.
