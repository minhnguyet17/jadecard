# Project Plan — JadeCard

## 1. Thành viên và vai trò

Dự án do **một thành viên** thực hiện. Mô hình năm vai trò mà đề bài gợi ý vẫn được giữ lại như **năm "chiếc mũ"** mà một người lần lượt đội. Mỗi công việc ở mục 3 được gắn với đúng vai trò của nó, nhờ vậy vẫn thể hiện được tư duy phân công và mỗi phần đều có sản phẩm kiểm tra được.

| Thành viên | Vai trò | Trách nhiệm |
|---|---|---|
| Jade | **BA / Trưởng dự án** | Yêu cầu, tiến độ, GitHub Issues, quyết định phạm vi, nhật ký AI |
| Jade | **UI/UX** | Khảo sát giao diện, wireframe và mockup, chuẩn bị hình ảnh |
| Jade | **Frontend** | HTML/CSS/JavaScript, Check thẻ (OCR + API), localStorage |
| Jade | **Backend / Database** | Thiết kế dữ liệu, nghiệp vụ đơn hàng và thu mua, API |
| Jade | **QA / Tích hợp** | Kịch bản kiểm thử theo tiêu chí nghiệm thu, kiểm tra tích hợp, tài liệu |

**Nguyên tắc làm việc một người**
- Mỗi công việc phải **làm xong trong 1–3 giờ** và có **kết quả kiểm tra được**. Nếu dài hơn thì chia nhỏ tiếp.
- Mỗi công việc ứng với **một GitHub Issue** và **một nhánh Git** (`docs/...`, `feat/...`, `fix/...`), kết thúc bằng Pull Request do chính Jade tự review theo checklist.
- AI chỉ **soạn nháp và gợi ý**. Jade đọc, chạy thử và **giải thích được** mọi đoạn mã trước khi merge (xem [AGENTS.md](AGENTS.md)).
- **Làm hoàn chỉnh từng luồng** trước khi mở rộng. Không làm dở dang nhiều tính năng cùng lúc.

## 2. Các giai đoạn

- **Giai đoạn 1 (Buổi 1):** Khảo sát và xác định yêu cầu.
- **Giai đoạn 2 (Buổi 2):** Thiết kế giao diện HTML/CSS, responsive.
- **Giai đoạn 3 (Buổi 3 trở đi):** Xây dựng chức năng frontend bằng JavaScript (sản phẩm, giỏ hàng, Check thẻ, Bộ sưu tập).
- **Giai đoạn 4:** Phát triển backend và cơ sở dữ liệu (tài khoản, đơn hàng, yêu cầu thu mua, quản trị).
- **Giai đoạn 5:** Tích hợp và kiểm thử.
- **Giai đoạn 6:** Triển khai và hoàn thiện.

> Thời hạn tính theo **buổi học**. Giai đoạn 4–6 sẽ được chia nhỏ chi tiết khi có đề bài của các buổi tương ứng.

## 3. Công việc

Trạng thái: ✅ Hoàn thành · 🔄 Đang làm · ⬜ Chưa làm

### Giai đoạn 1: Khảo sát và yêu cầu (hạn: nộp bài Buổi 1)

| Mã | Công việc | Vai trò | Kết quả cần đạt | Trạng thái |
|---|---|---|---|---|
| T1.1 | Chọn đề tài, trả lời 6 câu hỏi về vấn đề kinh doanh | BA | Phần 1–2 của README.md | ✅ |
| T1.2 | Khảo sát TGB Store và HeroGame | BA | Hai cột A, C trong competitor-analysis.md | ✅ |
| T1.3 | Khảo sát SaigonTCG (trình duyệt + Claude in Chrome) | BA / UI | Cột B trong competitor-analysis.md (ảnh minh họa: tùy chọn, `docs/screenshots/`) | ✅ |
| T1.4 | AI thứ nhất phân tích yêu cầu (Prompt 1) | BA | docs/ai-analysis/01-phan-tich-yeu-cau.md | ✅ |
| T1.5 | AI thứ hai phản biện (Prompt 2, Astra 6) và kiểm chứng nguồn | BA | docs/ai-analysis/02-phan-bien.md | ✅ |
| T1.6 | Lập bảng quyết định, chốt REQUIREMENTS v1.0 | BA | Bảng quyết định (mục 3 file 02) + REQUIREMENTS.md v1.0 | ✅ |
| T1.7 | Vai trò người dùng và quy trình nghiệp vụ | BA | user-roles.md, business-workflow.md | ✅ |
| T1.8 | Wireframe và mockup các trang chính | UI/UX | Bản thiết kế tạo bằng Stitch (thư mục thiết kế riêng, sẽ đưa ảnh vào `docs/wireframes/`) | ✅ |
| T1.9 | Tạo repo public, đẩy tài liệu lên | QA | Link repo mở được ở cửa sổ ẩn danh | ⬜ |
| T1.10 | Tạo GitHub Issues cho Giai đoạn 1–2 | BA | Các Issue có mục tiêu và tiêu chí hoàn thành | ⬜ |
| T1.11 | Viết báo cáo Word Chương 1 | QA | `Bao-cao-Chuong1.docx` (nộp riêng cho giảng viên, không để trong repo) | ✅ |
| T1.12 | Khảo sát nhỏ khoảng 5 người chơi để kiểm tra nhu cầu (PB01) | BA | Bảng kết quả trong docs/customer-survey.md | ⬜ |

### Giai đoạn 2: Giao diện HTML/CSS (hạn: Buổi 2)

| Mã | Công việc | Vai trò | Kết quả cần đạt | Trạng thái |
|---|---|---|---|---|
| T2.1 | Cấu trúc thư mục, màu và font dùng chung, header và footer dùng chung | FE | `scss/abstracts/_variables.scss` → `css/style.css`, header/footer giống nhau ở mọi trang | ✅ |
| T2.2 | Trang chủ: banner Check thẻ, hàng mới về, thẻ lẻ nổi bật, khối cam kết | FE | `index.html` | ✅ |
| T2.3 | Trang danh sách sản phẩm (lưới, khung bộ lọc) | FE | `products.html` | ✅ |
| T2.4 | Trang chi tiết sản phẩm (6 trường của thẻ lẻ) | FE | `product-detail.html` | ✅ |
| T2.5 | Trang giới thiệu cửa hàng và chính sách thu mua | FE | `about.html` | ✅ |
| T2.6 | Giao diện tĩnh trang Check thẻ (khung tải ảnh, khung kết quả) | FE | `check-card.html` | ✅ |
| T2.7 | Responsive cho 3 kích thước, hover và focus | FE / QA | Ảnh chụp 1366 / 768 / 390px trong `docs/screenshots/buoi-2/`, [test-report-buoi2.md](docs/test-report-buoi2.md) | ✅ |

### Giai đoạn 3: Chức năng frontend bằng JavaScript (từ Buổi 3)

| Mã | Công việc | Vai trò | Kết quả cần đạt | Trạng thái |
|---|---|---|---|---|
| T3.1 | Dữ liệu 15 sản phẩm mẫu (`id`, `name`, `price`, `category`, `image`, `description` + `cardId`, `set`, `number`, `rarity`, `variant`, `condition`, `stock`) | BE / FE | `js/data/products.js` | ✅ |
| T3.2 | Hiển thị danh sách và chi tiết sản phẩm từ dữ liệu | FE | F01, F02 đạt tiêu chí nghiệm thu | ✅ |
| T3.3 | Tìm kiếm, lọc, sắp xếp | FE | F03 | ✅ |
| T3.4 | Giỏ hàng + localStorage (`cart.html`) | FE | F04, [test-report-buoi3.md](docs/test-report-buoi3.md) | ✅ |
| T3.11 | Thẻ Charizard 3D ở trang chủ (three.js), có ảnh tĩnh dự phòng | FE | `js/hero-3d.js` | ✅ |
| T3.12 | Gỡ Tailwind, viết lại CSS bằng SCSS, giữ nguyên bố cục (so ảnh từng điểm ảnh) | FE | `scss/`, `css/style.css`; trang Giỏ hàng / Giới thiệu / Check thẻ khác 0,00% so với bản cũ | ✅ |
| T3.13 | Trang chủ tập trung bán hàng: hero "Mua pack", nút thêm vào giỏ trên mọi thẻ, thanh mua nhanh, khối "Một pack, một cơ hội", vòng Mua – Check – Bán – Trade | FE | TC16–TC18 | ✅ |
| T3.14 | Tối ưu điện thoại: sửa thẻ 3D trên màn hình độ nét cao, bộ lọc thu gọn, thanh mua ở trang chi tiết | FE / QA | TC20–TC22, ảnh `mobile-*-393.jpg` | ✅ |
| T3.15 | Thêm nhiều loại pack / hàng nguyên hộp (shop bán pack là chính) | BA / FE | Chờ Jade chọn loại pack và set | ⬜ |
| T3.5 | **Thử nghiệm kỹ thuật TCGdex:** đã kiểm tra sơ bộ CORS và trường giá (07/11). Còn lại: gọi thử từ một trang HTML thật, đo tỉ lệ thẻ thiếu giá trên khoảng 20 thẻ, chốt cách đọc giá theo biến thể | BE | `docs/tech-spike.md` | 🔄 |
| T3.6 | OCR bằng Tesseract.js: đọc tên và số thẻ từ ảnh, khởi tạo worker sẵn | FE | F08, đo trên bộ 15 ảnh cố định; ghi thời gian lần đầu và lần sau | ⬜ |
| T3.7 | Chọn thẻ và biến thể, tìm thủ công, giá tham khảo VND và giá thu mua dự kiến, xử lý thiếu giá | FE | F09–F12 | ⬜ |
| T3.8 | Bộ sưu tập: Đang có, Đang săn (localStorage, bản gọn) | FE | F13, F14 | ✅ 09/11 (thêm thẻ bằng tra cứu TCGdex) |
| T3.9 | ~~% hoàn thành set~~ | FE | Bỏ khỏi MVP: F15 chuyển sang Nâng cao (PB21) | ❌ |
| T3.10 | Form yêu cầu bán 1 thẻ (giao diện), mở từ Check thẻ và từ nút "Bán thẻ này" | FE | F16, F17 ở mức giao diện | ⬜ |

### Giai đoạn 4A: Cộng đồng (REQUIREMENTS v2.0, kế hoạch: [docs/ke-hoach-cong-dong.md](docs/ke-hoach-cong-dong.md))

| Mã | Công việc | Vai trò | Kết quả cần đạt | Trạng thái |
|---|---|---|---|---|
| T4.1 | Chốt quyết định, REQUIREMENTS v2.0, vai trò, luồng nghiệp vụ, prompt Stitch | BA | Tài liệu v2.0; [stitch-prompts-cong-dong.md](docs/stitch-prompts-cong-dong.md) | ✅ |
| T4.2 | Dựng giao diện Tài khoản, Diễn đàn, Hồ sơ + Bộ sưu tập, Ký gửi bằng Stitch; duyệt và chốt phần giữ / bỏ | UI/UX | 11 màn hình (máy tính), [stitch-review-cong-dong.md](docs/stitch-review-cong-dong.md), REQUIREMENTS v2.1 | ✅ |
| T4.3 | Nền backend: Express phục vụ web tĩnh + API, SQLite, tạo bảng, dữ liệu mẫu | BE | `npm start` chạy, `/api/health` trả về OK | ✅ 09/11 |
| T4.4 | Tài khoản: đăng ký, OTP, đăng nhập, quên mật khẩu, menu tài khoản | BE / FE | F30–F33 | ✅ 09/11 |
| T4.5 | Diễn đàn (đọc): trang chủ diễn đàn, danh sách topic, xem topic | FE / BE | F34–F36 (+ F52 lượt xem, F53 nổi bật tuần) | ✅ 09/11 |
| T4.6 | Diễn đàn (viết): tạo topic, trả lời, trích dẫn, like, chức vụ | FE / BE | F37–F40 | ✅ 09/11 |
| T4.7 | Hồ sơ + bộ sưu tập theo tài khoản, cài đặt riêng tư, gộp từ trình duyệt | FE / BE | F41, F27 | ✅ 09/11 |
| T4.8 | Kiểm duyệt + trang Quy định diễn đàn | FE / BE | F42 | ✅ 09/11 |
| T4.9 | Ký gửi: đăng tin, kiểm định, trang Ký gửi, chi tiết, mua, tất toán | FE / BE | F43–F49 (kèm đặt hàng tối giản F05, F07, F20 vì F47 cần đơn hàng) | ✅ 09/11 |
| T4.10 | Gắn tin ký gửi vào topic Mua bán F368; link tự hiện thành thẻ | FE / BE | F50, F51 | ✅ 09/11 |
| T4.10b | Bổ sung v2.1: lượt xem, thành viên nổi bật tuần, thẻ xem nhanh avatar, trả giá, đánh giá người bán | FE / BE | F52–F56 | ✅ 09/11 |
| T4.11 | Kiểm thử 4 loại ca + truy cập trái phép cho các luồng mới | QA | Báo cáo kiểm thử | ✅ 30 ca API tự động + 2 luồng trình duyệt ([test-report-cong-dong.md](docs/test-report-cong-dong.md)) |

### Giai đoạn 4–6 (chia nhỏ khi có đề bài buổi tương ứng)

| Mã | Công việc | Vai trò | Kết quả cần đạt |
|---|---|---|---|
| T4.x | Tài khoản, đơn hàng (tồn kho, trạng thái thanh toán), yêu cầu thu mua (kiểm tra online, ghi kết quả giao dịch tại quầy, nhập kho), quản trị (F05–F07, F17–F22) lưu trên server; kiểm tra quyền phía server | BE | API và CSDL hoạt động |
| T5.x | Kịch bản kiểm thử theo tiêu chí nghiệm thu và **4 loại ca** ở REQUIREMENTS mục 7 | QA | Bảng test case có kết quả |
| T6.x | Triển khai website, hoàn thiện README, báo cáo cuối kỳ | QA / BA | Link website chạy được |

## 4. Rủi ro

| Rủi ro | Mức độ | Phương án xử lý |
|---|---|---|
| **Một người làm, dễ trễ tiến độ** | Cao | Phạm vi đã thu gọn ở v1.0 (F15 ra khỏi MVP, 1 thẻ mỗi yêu cầu bán, giao dịch thu mua tại quầy). Công việc nhỏ 1–3 giờ. Nếu trễ, cắt theo thứ tự F22 → F14 → bớt bộ lọc. Không cắt luồng mua hàng và luồng thu mua. |
| **OCR đọc sai** (ảnh mờ, thẻ holo phản sáng, thẻ tiếng Nhật) | Cao | Bắt buộc có bước xác nhận (F09) và tìm thủ công (F10). Hướng dẫn chụp ảnh. Chỉ cam kết hỗ trợ thẻ tiếng Anh. |
| **API giá ngừng hoạt động, đổi điều khoản hoặc thiếu giá** | Trung bình | Đã có ví dụ thực tế: pokemontcg.io đã ngừng phát triển, nên chọn TCGdex (đã kiểm tra CORS ngày 07/11). Gom việc gọi API vào `price-service.js` để dễ đổi nguồn. Thiếu giá thì hiện "Chưa có giá tham khảo". Dự phòng bằng JSON mẫu có nhãn "Dữ liệu mô phỏng". |
| **Giá quốc tế không khớp thị trường Việt Nam** | Trung bình | Ghi rõ "giá tham khảo". Hệ số thu mua có thể cấu hình. Khảo sát giá thu mua trong cộng đồng. |
| **Mở rộng phạm vi** (thêm game, chatbot...) | Trung bình | Chỉ làm những gì có trong REQUIREMENTS.md. Ý tưởng mới đưa vào mục "Nâng cao". |
| **Thẻ giả, tranh chấp tình trạng khi thu mua** | Trung bình (nghiệp vụ) | Chủ shop kiểm tra sơ bộ qua ảnh trước. Kiểm định **trực tiếp trước mặt khách** tại cửa hàng, có thể quay video. Giá chốt tại quầy; khách không đồng ý thì mang thẻ về ngay. |
| **Dữ liệu cá nhân** | Thấp | Không dùng dữ liệu thật. **Không thu thập số tài khoản** (thu mua trả tiền tại quầy). Ảnh và SĐT trong yêu cầu bán chỉ chủ yêu cầu và admin xem. Không đưa key hay token lên repo. |
| **Bản quyền hình ảnh và thương hiệu Pokémon** | Thấp (đồ án học tập) | Ghi rõ dự án học tập, không liên kết với The Pokémon Company. Ảnh thẻ lấy từ API có ghi nguồn. |
