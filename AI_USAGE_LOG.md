# AI Usage Log

> Nguyên tắc: không đưa thông tin đăng nhập, API key, token hay dữ liệu cá nhân vào công cụ AI. Mọi kết quả AI đều được Jade đọc lại và quyết định giữ, sửa hoặc bỏ.

## Lần sử dụng 1: Khảo sát website đối thủ

### Công cụ
Claude Code (mô hình Claude Opus 5.5, Anthropic), dùng công cụ đọc trang web.

### Mục đích
Đọc và ghi nhận thực tế trang chủ, danh mục, tìm kiếm, chi tiết sản phẩm, giỏ hàng và chính sách của tgbstore.com.vn, herogame.vn, saigontcg.com.

### Prompt
"Khảo sát website [URL]... ghi nhận THỰC TẾ (không đoán; chỗ nào không xem được thì ghi rõ), theo các mục: 1. Trang chủ, 2. Danh mục, 3. Tìm kiếm và lọc, 4. Chi tiết sản phẩm, 5. Giỏ hàng và đặt hàng, 6. Tính năng đặc biệt (tra giá, quét thẻ, thu mua...), 7. Điểm yếu, 8. Nền tảng web. Liệt kê các URL đã truy cập."

### Kết quả đề xuất
- TGB Store và HeroGame: ghi nhận đầy đủ 8 mục (xem docs/competitor-analysis.md). Phát hiện quan trọng: **cả hai không có thẻ lẻ, không có tra giá, quét thẻ hay thu mua**.
- SaigonTCG: **không truy cập được** (máy chủ trả về HTTP 403 với công cụ tự động).

### Phản biện
Một số phần của HeroGame tải bằng JavaScript nên AI không đọc được (giá ở trang chi tiết, bộ lọc). AI đã tự ghi rõ những phần "không đọc được" thay vì đoán.

### Quyết định của nhóm
- Giữ các ghi nhận có URL nguồn. Phần không đọc được thì ghi là "chưa xác nhận".
- SaigonTCG: khảo sát thủ công trên trình duyệt (Jade đã ghi nhận: không có thanh toán trên web, đặt hàng qua form để nhân viên liên hệ, hoặc nhận tại cửa hàng) và dùng AI ở lần 4.

### Người kiểm tra
Jade (đối chiếu lại trên trình duyệt).

---

## Lần sử dụng 2: Phân tích yêu cầu (AI thứ nhất)

### Công cụ
Claude Code (Claude Opus 5.5).

### Mục đích
Phân tích nghiệp vụ, đề xuất yêu cầu theo **Prompt 1** của đề bài.

### Prompt
Prompt 1 của đề bài đã điền thông tin dự án. Nguyên văn xem trong [docs/ai-analysis/01-phan-tich-yeu-cau.md](docs/ai-analysis/01-phan-tich-yeu-cau.md).

### Kết quả đề xuất
22 chức năng F01–F22 chia theo Bắt buộc / Nên có / Nâng cao. Hai quy trình nghiệp vụ (mua hàng; check thẻ và thu mua). Công thức giá thu mua. 8 rủi ro. Danh sách điểm "cần xác minh" (API giá, độ chính xác OCR, hệ số thu mua).

### Phản biện
AI thứ hai (Astra 6, lần 3) đưa ra 24 ý kiến. Quan trọng nhất là ba điểm: quá nhiều chức năng bắt buộc, nguồn giá pokemontcg.io đã ngừng phát triển, và thiếu quy tắc cho biến thể thẻ, tồn kho, nhập kho.

### Quyết định của nhóm
Ban đầu đưa vào REQUIREMENTS.md **v0.1 (bản nháp)**. Sau phản biện, nâng lên **v1.0** (xem lần 3). Một số quyết định Jade đã đưa ra trước khi AI phân tích:
- Check thẻ chỉ hỗ trợ Pokémon trong MVP. AI có đề xuất thêm Yu-Gi-Oh! hoặc One Piece, nhưng bị loại vì vượt sức một người.
- Sau khi check giá, hướng người dùng sang **Bộ sưu tập** và **Bán thẻ cho shop**, không chỉ "mua tại shop".
- Bộ sưu tập làm bản đầy đủ: Have + Want + % hoàn thành set. *(Sau phản biện ở lần 3, % hoàn thành set chuyển sang Nâng cao.)*

### Người kiểm tra
Jade.

---

## Lần sử dụng 3: Phản biện yêu cầu (AI thứ hai)

### Công cụ
**Astra 6** (công cụ AI khác với AI thứ nhất). Để kiểm chứng các thông tin Astra 6 đưa ra, Jade dùng thêm Claude Code mở lại các nguồn được trích dẫn và gọi thử API TCGdex.

### Mục đích
Đánh giá độc lập bản yêu cầu của AI thứ nhất theo **Prompt 2**.

### Prompt
Prompt 2 của đề bài đã điền thông tin dự án. Nguyên văn xem trong [docs/ai-analysis/02-prompt-phan-bien.md](docs/ai-analysis/02-prompt-phan-bien.md).

### Kết quả đề xuất
24 ý kiến phản biện (PB01–PB24), toàn văn trong [docs/ai-analysis/02-phan-bien.md](docs/ai-analysis/02-phan-bien.md). Nhận định chính: ý tưởng phù hợp, nhưng 20/22 chức năng bắt buộc là quá sức một người. Các điểm khác:
- Nguồn giá pokemontcg.io **đã ngừng phát triển** (khóa API chỉ chạy đến 01/03/2027).
- Thiếu xử lý biến thể thẻ (normal / holo / reverse holo).
- Thiếu quy tắc tồn kho, xác nhận báo giá, nhập kho.
- Tiêu chí OCR và tiêu chí kiểm thử chưa đủ rõ.

Astra 6 đề xuất giữ cửa hàng, Check thẻ, thu mua và quản trị; đưa toàn bộ bộ sưu tập xuống "làm sau".

### Phản biện
Jade không mặc định Astra 6 đúng:
- **Kiểm chứng nguồn:** thông báo ngừng của pokemontcg.io là **đúng**. Cấu trúc giá theo biến thể là **đúng**. Nhận định về Tesseract.js **đúng một phần**: tài liệu chỉ nói "trong một số ứng dụng".
- **Bổ sung điều Astra 6 không nêu:** đã gọi thử TCGdex. API mở CORS cho trình duyệt, có giá theo biến thể, không cần key. Vì vậy có sẵn nguồn thay thế.
- **Không đồng ý PB04** (làm thu mua trước bộ sưu tập): Astra 6 không tính đến lộ trình môn học. Thu mua cần backend, mà backend chỉ có ở Giai đoạn 4.

### Quyết định của nhóm
Đồng ý 18, đồng ý một phần 5, không đồng ý 1. Bảng quyết định đầy đủ ở mục 3 của [02-phan-bien.md](docs/ai-analysis/02-phan-bien.md). REQUIREMENTS.md được nâng lên **v1.0**. Các thay đổi chính:
- Chỉ bán Pokémon; Check thẻ cho thẻ tiếng Anh.
- Nguồn giá đổi sang **TCGdex**.
- Bộ sưu tập giữ *Đang có* và *Đang săn* (bản gọn); % hoàn thành set sang Nâng cao; "Bán từ bộ sưu tập" gộp vào form yêu cầu bán.
- **Mỗi yêu cầu bán một thẻ.**
- **Thu mua chỉ giao dịch tại cửa hàng.** Khách gửi yêu cầu online, chủ shop kiểm tra sơ bộ, rồi khách mang thẻ đến để kiểm định và nhận tiền tại quầy. Không gửi bưu điện, không lưu số tài khoản. Đây là quyết định riêng của Jade, cả hai AI đều không đề xuất.
- Bổ sung quy tắc biến thể, tồn kho, nhập kho, thiếu giá và nguyên tắc kiểm thử.
- Thêm khảo sát nhỏ người chơi để kiểm tra nhu cầu (PB01).

### Người kiểm tra
Jade (đối chiếu nguồn, chốt từng điểm có bất đồng).

---

## Lần sử dụng 4: Hỗ trợ khảo sát SaigonTCG

### Công cụ
Claude in Chrome (tiện ích trình duyệt của Anthropic, điều khiển trình duyệt thật của Jade).

### Mục đích
saigontcg.com chặn công cụ đọc tự động (lần 1), nên Jade dùng AI chạy trên trình duyệt thật để ghi nhận 7 tiêu chí.

### Prompt
"Khảo sát https://saigontcg.com/ (bắt đầu từ /product-category/pokemon/) để phân tích đối thủ cho đồ án. Ghi nhận THỰC TẾ, chỗ nào không xem được ghi 'không truy cập được', không đoán. Trả lời theo 7 mục: Trang chủ; Danh mục (có thẻ lẻ không); Tìm kiếm và lọc; Chi tiết sản phẩm (set, độ hiếm, tình trạng NM/LP, ngôn ngữ, tồn kho); Đặt hàng; Tính năng đặc biệt (tra giá, thu mua/ký gửi, giải đấu); Điểm yếu có căn cứ. Liệt kê URL đã xem."

### Kết quả đề xuất
Đầy đủ 7 mục kèm danh sách URL (xem cột B trong docs/competitor-analysis.md). Phát hiện chính:
- SaigonTCG rất mạnh về thẻ lẻ ở nhiều dòng game (Yu-Gi-Oh! có 17.305 sản phẩm), **nhưng mục Pokémon Single trống**, toàn bộ Pokémon chỉ có 13 sản phẩm.
- Không có bộ lọc, không ghi tình trạng thẻ, không có thanh toán online. Trang theo dõi đơn đòi email nhưng form đặt hàng không hỏi email.

AI chỉ đọc trang thanh toán, **không thêm sản phẩm và không đặt đơn**. Món hàng có sẵn trong giỏ là của trình duyệt từ trước.

### Phản biện
Đối chiếu với khảo sát tay của Jade trước đó (không có thanh toán online, đặt qua form để nhân viên liên hệ, hoặc nhận tại cửa hàng): **khớp**.

### Quyết định của nhóm
- Giữ toàn bộ ghi nhận có URL.
- **Điều chỉnh luận điểm khác biệt:** từ "đối thủ không có thẻ lẻ" thành "**không đối thủ nào có thẻ lẻ Pokémon**", vì SaigonTCG có thẻ lẻ cho các dòng game khác.
- Bổ sung vào đề xuất: tìm theo số thẻ, hiển thị số lượng tồn, phí ship cố định, giữ đơn khi nhận tại cửa hàng.

### Người kiểm tra
Jade.

---

## Lần sử dụng 5: Thiết kế giao diện (mockup)

### Công cụ
Stitch (công cụ AI thiết kế giao diện).

### Mục đích
Tạo bản thiết kế giao diện các trang chính (trang chủ, danh sách sản phẩm, chi tiết sản phẩm, thanh toán) làm cơ sở cho Buổi 2.

### Prompt
⏳ *[Jade ghi lại prompt chính đã dùng trong Stitch]*

### Kết quả đề xuất
Bộ màn hình phong cách "dark holographic luxury": nền tối, điểm nhấn cyan / tím / vàng, khung thẻ dạng slab, font Syne, Space Grotesk và JetBrains Mono. Kèm mã HTML dùng Tailwind CSS.

### Phản biện
- Nội dung mẫu là một sàn thẻ đã chấm điểm ("PokéVault"), có đấu giá, ký quỹ, kho lưu trữ, giá USD và các tuyên bố như bảo hiểm. Những nội dung này không đúng với JadeCard.
- Font tiêu đề Syne **không có bộ ký tự tiếng Việt** (đã kiểm tra bộ ký tự trên Google Fonts).

### Quyết định của nhóm
- Giữ phong cách màu sắc và bố cục.
- Thay toàn bộ nội dung theo REQUIREMENTS v1.0: hàng nguyên hộp và thẻ lẻ, giá VND, Check thẻ, thu mua tại cửa hàng. Bỏ các tuyên bố không có thật.
- Thay Syne bằng một font có tiếng Việt (Unbounded).
- Cho phép dùng Tailwind CSS để giữ đơn giản.

### Người kiểm tra
Jade.

---

## Lần sử dụng 6: Xây dựng giao diện (Buổi 2) và chức năng JavaScript (Buổi 3)

### Công cụ
Claude Code (Claude Opus 5.5). Bản thiết kế Stitch (lần 5) được dùng làm tham khảo phong cách.

### Mục đích
Dựng các trang HTML theo phong cách của bản thiết kế, sau đó tích hợp JavaScript theo đề Buổi 3: dữ liệu sản phẩm, tìm kiếm / lọc / sắp xếp, trang chi tiết, giỏ hàng, localStorage. Thêm thẻ Charizard 3D ở trang chủ theo ý tưởng của Jade.

### Prompt chính
- "Giữ giao diện như Stitch nhưng nội dung theo JadeCard; cấu trúc web đi theo phương án của chúng ta; thẻ bài trên trang chủ là 3D dùng three.js, kèm giá kỷ lục của Charizard đổi sang tiền Việt."
- "Được dùng Tailwind, đừng làm mọi thứ quá phức tạp."

### Kết quả đề xuất
- 6 trang: index, products, product-detail, cart, about, check-card.
- `js/data/products.js` (15 sản phẩm), `cart.js`, `products-page.js`, `product-detail.js`, `cart-page.js`, `hero-3d.js`.
- Ảnh chụp minh chứng 3 kích thước; 17 ca kiểm thử tự động.

### Phản biện (các đề xuất của AI đã được kiểm tra)
1. **Mã nguồn Stitch dùng Tailwind và có nội dung đấu giá / lưu ký.** AI đề nghị không chép code mà viết lại nội dung theo REQUIREMENTS v1.0. Jade đồng ý giữ phong cách, nhưng **cho phép dùng Tailwind** để code ngắn gọn hơn. Đây là điều chỉnh so với đề xuất ban đầu của AI (CSS thuần).
2. **Giá kỷ lục Charizard.** Jade nhớ con số 1.700.000 USD. AI tra cứu lại và xác nhận: đó là lá Charizard Base Set bản tiếng Nhật 1996 (No Rarity Symbol), PSA 10, tháng 3/2026 (nguồn Sports Illustrated). Quy đổi: 1.700.000 × 26.000 = 44.200.000.000 ₫. Trang web ghi rõ nguồn và ghi chú rằng ảnh minh họa là bản tiếng Anh.
3. **Ảnh chụp ở 390px bị cắt.** Ban đầu trông như lỗi tràn ngang. Kiểm tra bằng cách đo `scrollWidth` cho thấy trang không tràn; nguyên nhân là Chrome trên Windows không cho cửa sổ nhỏ hơn khoảng 500px. Kết luận: **không sửa CSS**, chỉ đổi công cụ chụp.
4. **Thẻ 3D khi mở bằng file://.** AI phát hiện Chrome chặn WebGL dùng ảnh trong máy, nên chuyển sang dùng ảnh từ máy chủ TCGdex (đã kiểm tra header CORS). Ảnh tĩnh vẫn được giữ làm dự phòng.
5. **Ảnh hộp thiếc không hiện.** Phát hiện qua ảnh chụp: ký tự `&` chưa escape trong SVG. Đã sửa và kiểm tra lại cả 4 file.

### Quyết định của nhóm
Giữ toàn bộ chức năng Buổi 2 và Buổi 3 như trong [docs/test-report-buoi3.md](docs/test-report-buoi3.md). Check thẻ thật (OCR, TCGdex) và Bộ sưu tập làm ở đợt tiếp theo. Jade cần tự đọc, chạy thử và giải thích được từng file JavaScript trước khi nộp.

### Người kiểm tra
Jade.


---

## Lần sử dụng 7: Chuyển CSS sang SCSS, trang chủ bán hàng, tối ưu điện thoại

### Công cụ
Claude Code (Claude Opus 5.5).

### Mục đích
- Bỏ Tailwind vì đề Buổi 2 ghi "không sử dụng framework CSS" (quy định nằm trong các prompt mẫu ở trang 5, 9, 11, 13, 15 của `BaiTap_Nhom_Buoi2.pdf`).
- Viết lại CSS bằng SCSS và **giữ nguyên bố cục**.
- Sửa thẻ Charizard 3D không chạy đúng trên điện thoại.
- Làm trang chủ tập trung bán hàng.

### Prompt chính
- "Refactor lại CSS, dùng SCSS/SASS để viết cho đẹp và dễ nhìn. Không xài Tailwind nữa."
- "Phải giữ nguyên layout như hiện tại."
- "Ảnh 3D của Charizard không work trên mobile; cần review và code mobile thật tốt."
- "Sản phẩm ở trang chủ không có nút add to cart."
- "Charizard đang giống WOW factor hơn là CTA tốt; cần CTA thật mạnh, dụ dỗ liên tục."
- "Trang chủ tập trung bán hàng; Check thẻ chỉ là một tính năng; vòng mua → check → bán → trade → mua, vừa đam mê vừa đầu tư."

### Kết quả đề xuất
- **CSS:**
  - Thư mục `scss/` chia 5 nhóm: abstracts, base, layout, components, pages. Biên dịch bằng `npm run build:css`.
  - HTML dùng tên class theo ý nghĩa (BEM).
- **Thẻ 3D:** canvas được đặt bằng đúng kích thước khung. Trên điện thoại, thẻ nằm gọn bên trái, giá ở bên phải.
- **Trang chủ:**
  - Hero mới "Xé một pack 120K, biết đâu ra lá tiền triệu.", có nút "Mua pack · 120.000 ₫" thêm thẳng vào giỏ.
  - Nút "Thêm vào giỏ" trên mọi thẻ sản phẩm.
  - Thanh mua nhanh dính ở đáy màn hình.
  - Khối "Một pack, một cơ hội" và khối vòng lặp Mua – Check – Bán – Trade.
- **Điện thoại:**
  - Bộ lọc thu gọn.
  - Thanh "Thêm vào giỏ" ở trang chi tiết.
  - Menu có dấu hiệu cuộn ngang.
- **Kiểm thử:** 9 ca mới (TC16–TC24), tổng 26/26 đạt.

### Phản biện (các đề xuất của AI đã được kiểm tra)
1. **"Giữ nguyên layout" được kiểm tra bằng số liệu, không chỉ bằng mắt.**
   - Cách làm: chụp toàn bộ 7 trang ở 3 độ rộng *trước* khi sửa, rồi so từng điểm ảnh với bản mới.
   - Lần so đầu phát hiện 2 lỗi do chuyển đổi (L6, L7 trong test-report-buoi3.md). Sửa xong thì Giỏ hàng, Giới thiệu, Check thẻ khác 0,00%.
2. **Lỗi 3D trên điện thoại.**
   - Giả lập iPhone (DPR 3) cho thấy canvas rộng 732px trong khung chỉ 366px.
   - Nguyên nhân: canvas được vẽ theo số điểm ảnh thật nhưng thiếu kích thước CSS. Máy tính có DPR 1 nên không thấy lỗi.
   - Sau khi sửa, canvas bằng đúng khung (TC21).
3. **Câu kêu gọi "Mua pack 120k cơ hội trúng 44,2 tỷ".**
   - AI không dùng nguyên câu này, vì lá 44,2 tỷ là Charizard 1996 bản tiếng Nhật, không thể có trong pack Surging Sparks đang bán. Viết vậy dễ thành quảng cáo gây hiểu nhầm.
   - Thay bằng so sánh có thật trong dữ liệu: pack 120.000 ₫ và lá Pikachu ex SIR cùng set đang bán 6.270.000 ₫ (gấp hơn 50 lần). Giá 44,2 tỷ vẫn ở khung Charizard để tạo ấn tượng, kèm ghi chú "lá này không nằm trong pack đang bán".
   - Thêm hai dòng nhắc: "thẻ hiếm ra ngẫu nhiên với tỉ lệ thấp" và "giá thẻ có thể tăng hoặc giảm".
4. **SCSS có vi phạm "không dùng framework CSS" không?**
   - SCSS là ngôn ngữ tiền xử lý: nó không có sẵn class giao diện nào. Mọi thuộc tính (Flexbox, Grid, media query) vẫn phải tự viết, và trình duyệt chỉ đọc file CSS đã biên dịch.
   - Báo cáo Buổi 2 (mục 11) giải thích rõ điều này.

### Quyết định của nhóm
- Áp dụng toàn bộ.
- Thêm nhiều loại pack (shop bán pack là chính): Jade sẽ chọn loại và set ở phiên sau (T3.15).
- Jade cần tự đọc lại `scss/` và giải thích được các mixin `up()`, `font()` trước khi trình bày.

### Người kiểm tra
Jade.

---

## Lần sử dụng 8: Lập kế hoạch cộng đồng (Tài khoản, Diễn đàn, Ký gửi) và duyệt giao diện Stitch

### Công cụ
- Claude Code (Claude Opus 5.5) để lập kế hoạch, viết prompt Stitch và đối chiếu giao diện với yêu cầu.
- Stitch để dựng 11 màn hình.

### Mục đích
Mở rộng JadeCard từ cửa hàng thành cộng đồng: tài khoản xác thực email, diễn đàn kiểu VOZ (F368 Thợ săn tiền thưởng, F666 Thần bài) có chức vụ theo số like, ký gửi gắn vào topic Mua bán, và xem bộ sưu tập của thành viên khác.

### Prompt chính
- "Login: gửi link xác thực, nếu quá khó hoặc cần service ngoài thì đổi sang OTP."
- "Diễn đàn như F319 / VOZ; chức vụ Học việc, Chiếu mới, ..., Grand Master."
- "Ký quỹ link với rao vặt F368; JadeCard ăn hoa hồng và xác thực thẻ."
- "Click avatar xem collection của user khác."
- "Plan first, sau đó dùng Stitch, cuối cùng thực hiện với giao diện tham khảo từ Stitch."

### Kết quả đề xuất
- Kế hoạch: [docs/ke-hoach-cong-dong.md](docs/ke-hoach-cong-dong.md).
- Prompt Stitch: [docs/stitch-prompts-cong-dong.md](docs/stitch-prompts-cong-dong.md).
- REQUIREMENTS v2.0, sau đó v2.1.
- Bảng duyệt giao diện: [docs/stitch-review-cong-dong.md](docs/stitch-review-cong-dong.md).

### Phản biện (các đề xuất đã được kiểm tra)
1. **"Đổi sang OTP để khỏi cần dịch vụ ngoài" là hiểu nhầm.** Gửi OTP cũng cần dịch vụ gửi mail. OTP vẫn được chọn, nhưng vì lý do khác: link sẽ trỏ về `localhost` nên không mở được từ điện thoại. Khi lập trình, OTP được in ra cửa sổ dòng lệnh; khi demo thì gửi qua Gmail App Password.
2. **"Ký quỹ" được đổi thành "ký gửi tại cửa hàng".** Ký quỹ nghĩa là giữ tiền. Giữ tiền online hộ người khác cần cổng thanh toán và có thể cần giấy phép. REQUIREMENTS v1.0 cũng đã xếp ký gửi và P2P vào mục ngoài phạm vi, nên phải nâng phiên bản và ghi rõ lý do.
3. **Bộ sưu tập công khai đụng quyết định PB22** (bộ sưu tập chỉ lưu trên trình duyệt). Đã đưa F27 vào phạm vi. Tổng giá trị mặc định ẩn, để tránh người dùng bị nhắm tới khi giao dịch trực tiếp.
4. **Giao diện Stitch tự thêm nội dung sai sự thật** (escrow, chuyển khoản tự động, bảo hiểm 100%, kho lạnh Thụy Sĩ, số liệu bịa, chấm điểm PSA, địa chỉ trông như thật ở Hà Nội). Đã lập bảng giữ / sửa / bỏ cho từng màn hình. Jade chọn giữ thêm F52–F54 và thêm F55 Trả giá, F56 Đánh giá người bán.

### Quyết định của nhóm
- Backend: Node.js + Express + SQLite.
- Xác thực email: OTP 6 số.
- Ký gửi: tại cửa hàng, hoa hồng 8% (tối thiểu 20.000 ₫).
- Chức vụ: "Chiếu mới" là cấp thấp nhất.
- Lập trình theo giao diện Stitch, **phần nào của Stitch không theo kế hoạch thì hủy bỏ**.

### Người kiểm tra
Jade.

---

## Lần sử dụng 9: Lập trình cộng đồng đợt 1 (backend, Tài khoản, Diễn đàn)

### Công cụ
- Claude Code (Claude Opus 5.5) để viết backend, giao diện và kiểm thử.
- Giao diện Stitch (11 màn hình) chỉ dùng làm tham khảo phong cách, lọc qua [docs/stitch-review-cong-dong.md](docs/stitch-review-cong-dong.md).

### Mục đích
Làm các việc T4.3–T4.6 của kế hoạch cộng đồng: nền backend, tài khoản có OTP, diễn đàn đọc và viết, chức vụ theo like.

### Prompt chính
- "Đọc tài liệu wrap up để lấy context, sau đó build phần của session vừa rồi, backend theo plan của bạn luôn, triển khai nhé."

### Kết quả đề xuất
- **Backend** (`server/`): Node.js + Express 5 + SQLite qua module có sẵn `node:sqlite` (không cần cài thư viện CSDL). `npm start` vừa phục vụ web vừa chạy API ở cổng 5500; lần đầu chạy tự tạo CSDL và dữ liệu mẫu.
- **Tài khoản (F30–F33):** 4 trang register / verify / login / forgot-password; menu tài khoản trên header (avatar + tag chức vụ).
- **Diễn đàn (F34–F40, F52, F53):** forum.html, forum-view.html, thread.html, new-thread.html, profile.html (F41 một phần), forum-rules.html.
- **Kiểm thử:** 19 ca API tự động (`npm test`) + 14 bước luồng trình duyệt; xem [docs/test-report-cong-dong.md](docs/test-report-cong-dong.md).
- **Công cụ nhỏ:** `npm run sync:layout` chép header / footer của index.html sang mọi trang (thay cho việc sửa tay 12 trang).

### Phản biện (các đề xuất của AI đã được kiểm tra)
1. **Chọn `node:sqlite` thay vì thư viện better-sqlite3.** Thư viện ngoài cần biên dịch mã C++ khi cài, dễ lỗi trên Windows. Đổi lại, dự án yêu cầu Node.js 22.13 trở lên (đã ghi trong package.json và README).
2. **Thư viện có lỗ hổng.** Bản multer 2.0.2 và nodemailer 6.10.1 AI chọn lúc đầu bị `npm audit` báo nhiều lỗ hổng mức cao. Đã đổi sang multer 2.5.0 và nodemailer 10.2.1 (bản vá, phát hành hơn 2 tuần trước), `npm audit` còn 0 lỗi.
3. **Không phục vụ cả thư mục dự án.** Nếu dùng `express.static` cho thư mục gốc thì ai cũng tải được `data/jadecard.db` (chứa mật khẩu băm) và `.env`. Server chỉ mở `css/`, `js/`, `images/`, `uploads/` và các file `.html`; ca API-19 kiểm tra điều này.
4. **Ảnh tải lên được kiểm tra bằng nội dung file**, không tin đuôi file: file chứa mã `<script>` đổi tên thành `.png` bị từ chối (API-14).
5. **Chống XSS ở khâu hiển thị.** Server lưu chữ thuần, giao diện luôn lọc HTML trước khi chèn. Đã thử đăng `<img src=x onerror=alert(1)>`: hiện thành chữ, không chạy (UI-07).
6. **Đăng ký email đã có nhưng chưa xác thực:** AI cân nhắc cho đăng ký đè, nhưng như vậy kẻ xấu có thể đặt mật khẩu cho email của người khác rồi chờ chủ email nhập OTP. Chọn cách báo "đã đăng ký" và đưa link sang bước nhập OTP.
7. **Header bị chật** khi thêm "Diễn đàn" và nút tài khoản (lỗi L8). Từ 768–1023px menu chuyển thành hàng cuộn ngang; ô tìm kiếm trên header hiện từ 1280px. Đây là thay đổi bố cục duy nhất ở các trang cũ.
8. **Nội dung giữ đúng sự thật:** bỏ số liệu trang trí, escrow, PSA/BGS, "MAINNET" của Stitch; số liệu trên diễn đàn là số đếm thật từ CSDL. Lợi ích "Ký gửi" và "Bộ sưu tập" ở trang đăng ký có nhãn **Sắp mở**; tag "Mua bán" bị khóa cho tới khi có Ký gửi (F50).

### Quyết định của nhóm
- Dùng backend theo kế hoạch: Node.js + Express + SQLite, OTP in ra dòng lệnh khi lập trình.
- Tài khoản mẫu dùng chung mật khẩu `jadecard123`, email đuôi example.com / jadecard.test.
- Việc tiếp theo: T4.8 kiểm duyệt (ghim / khóa / ẩn / báo cáo), T3.8 bộ sưu tập trên trình duyệt rồi T4.7, sau đó T4.9 Ký gửi.

### Người kiểm tra
Jade (cần tự chạy `npm start`, đăng ký một tài khoản bằng OTP in ở dòng lệnh, và đọc lại `server/routes/auth.js` trước khi trình bày).

---

## Lần sử dụng 10: Lập trình cộng đồng đợt 2 (Bộ sưu tập, Ký gửi, Đơn hàng, Kiểm duyệt, v2.1)

### Công cụ
- Claude Code (Claude Opus 5.5).

### Mục đích
Làm hết các việc còn lại của kế hoạch cộng đồng: T3.8 + T4.7 (bộ sưu tập), T4.8 (kiểm duyệt), T4.9 (ký gửi), T4.10 (F50, F51), T4.10b (F54–F56), T4.11 (kiểm thử).

### Prompt chính
- "Build luôn lần còn lại nhé, ký gửi và các tính năng khác, build hết tính năng trong phiên cũ nhé."

### Kết quả đề xuất
- 9 trang mới: consign, listing, new-listing, my-listings, collection, orders, admin-consignments, admin-orders, moderation.
- Backend: 5 nhóm API mới (collection, listings, orders, admin, moderation), 8 bảng mới, dữ liệu mẫu ký gửi / đơn hàng / bộ sưu tập.
- Header theo bảng duyệt Stitch: Trang chủ · Sản phẩm · Ký gửi · Diễn đàn · Check thẻ; menu avatar có Bộ sưu tập, Tin ký gửi, Đơn hàng và mục Quản trị theo vai trò.
- Kiểm thử: 30 ca API + 23 bước luồng trình duyệt mới; xem [docs/test-report-cong-dong.md](docs/test-report-cong-dong.md).

### Phản biện (các đề xuất đã được kiểm tra)
1. **F47 "mua tin ký gửi qua giỏ hàng và đơn hàng" cần tính năng đặt hàng (F05, F07, F20) mà dự án chưa có.** AI làm bản tối giản đúng REQUIREMENTS: giao hàng / nhận tại cửa hàng, COD / chuyển khoản, chống bấm "Đặt hàng" 2 lần, xác nhận mới trừ kho, hủy hoàn kho một lần. Không làm thanh toán online.
2. **Giá khi đặt hàng không lấy từ trình duyệt.** Server đọc lại `js/data/products.js` (vẫn chỉ một nguồn dữ liệu sản phẩm) và giá tin ký gửi trong CSDL; ai sửa giá trong localStorage cũng không có tác dụng.
3. **Giữ ranh giới vai trò:** Mod chỉ kiểm duyệt diễn đàn, không vào được kiểm định / tất toán / đơn hàng (REQUIREMENTS mục 3). Ca API-21 kiểm tra Mod gọi API kiểm định nhận 403.
4. **Bỏ phần Stitch không theo kế hoạch:** không escrow, không "Trả giá riêng" ngoài F55, không bảo hiểm / kho lạnh / PSA; trang Ký gửi chỉ ghi chính sách thật (kiểm định tận tay, quay video đóng gói, giao 30.000 ₫ hoặc nhận tại cửa hàng).
5. **Lỗi tìm thẻ (L11) và lỗi TCGdex tạm thời (L12)** chỉ lộ ra khi chạy thử thật trên trình duyệt; đã sửa và ghi vào báo cáo kiểm thử.
6. **Hết hạn (7 ngày kiểm định, 60 ngày niêm yết, 48 giờ trả giá, 24 giờ giữ)** được xử lý ở đầu mỗi yêu cầu API thay vì chương trình chạy ngầm, cho đơn giản; ghi rõ là giới hạn.

### Quyết định của nhóm
- Áp dụng toàn bộ; dữ liệu mẫu mới cần `npm run db:reset` nếu đã có CSDL từ đợt 1.
- Việc tiếp theo: T3.15 thêm các loại pack; Check thẻ bằng ảnh (F08–F12) và thu mua (F17–F21) theo REQUIREMENTS v1.

### Người kiểm tra
Jade (chạy `npm run db:reset`, `npm start`, đi hết vòng: đăng tin bằng tài khoản Tuan → kiểm định bằng Admin → trả giá → đặt hàng → tất toán).

## Lần sử dụng 11: Email OTP thật qua Gmail, hashtag thẻ / bộ có link mua, ảnh cho diễn đàn

### Mục tiêu
1. Gửi OTP thật bằng Gmail cá nhân của nhóm (bản demo) vì chưa đăng ký được tài khoản: OTP chỉ in ra cửa sổ dòng lệnh.
2. Bài viết diễn đàn gắn hashtag thẻ hoặc bộ pack; hệ thống tự nhận diện, có bán thì hiện thẻ mời mua (CTA).
3. Thêm ảnh chụp thật cho các bài mẫu để diễn đàn trông như thật.

### Prompt chính
- "Tôi muốn add email hệ thống… dùng email cá nhân của tôi để gửi OTP… Bài đăng forum: hiện tại đang hơi fake… search để gắn tag thẻ, hoặc bộ pack vào bài dưới dạng hashtag… hoạt động như 1 card CTA… fake 1 vài ảnh bạn search trên mạng."

### Kết quả đề xuất
- Email: thư OTP HTML có thương hiệu; server kiểm tra đăng nhập Gmail khi khởi động và báo lỗi dễ hiểu (sai App Password, không có mạng); `npm run mail:test` gửi thư thử. File `.env` đã điền SMTP_USER, chỉ còn thiếu Mật khẩu ứng dụng.
- Chế độ lập trình (chưa cấu hình Gmail): mã OTP hiện ngay trên trang nhập mã → máy chấm bài không có `.env` vẫn đăng ký được. Production không bao giờ lộ mã.
- Hashtag: nút "Gắn thẻ / bộ" trong ô soạn bài tìm cùng lúc hàng shop đang bán, hashtag đã có và TCGdex; server tự tra TCGdex để lấy tên / số / ảnh chuẩn. Trong bài, hashtag thành link (biểu tượng cửa hàng nếu shop có bán) và dưới bài có tối đa 2 thẻ mời mua: đúng lá đó, tin ký gửi đã kiểm định, hoặc pack / box của bộ chứa lá đó ("Tự săn lá này"). Trang `tag.html` gom các topic nhắc tới hashtag + khu "Có tại JadeCard"; chưa bán thì mời ký gửi.
- Ảnh: 7 ảnh chụp từ Pexels (giấy phép miễn phí, nguồn ghi ở `images/forum/NGUON-ANH.md`) + ảnh scan thẻ TCGdex; thêm 1 topic mẫu nhiều ảnh. Nâng cấp dữ liệu chạy 1 lần, áp dụng được cho CSDL cũ, không cần `db:reset`.

### Phản biện (các đề xuất đã được kiểm tra)
1. **Không đưa mật khẩu Gmail vào chat hay code.** Dùng Mật khẩu ứng dụng 16 ký tự, chỉ nằm trong `.env` (đã có trong .gitignore); sửa .gitignore để `.env.example` vẫn được đưa lên repo.
2. **Không tin chữ trình duyệt gửi lên cho hashtag:** trình duyệt chỉ gửi loại + mã TCGdex, server tự tra tên, số thẻ, ảnh.
3. **CTA không spam:** mỗi bài tối đa 2 thẻ mời mua, mỗi sản phẩm chỉ mời một lần trên một trang topic.
4. **Unsplash chặn tải tự động** nên dùng Pexels; không dùng ảnh không rõ giấy phép.

### Người kiểm tra
Jade (tạo Mật khẩu ứng dụng, chạy `npm run mail:test`, đăng ký tài khoản mới nhận OTP qua Gmail; mở topic có hashtag và bấm "Thêm vào giỏ" từ thẻ mời mua).
