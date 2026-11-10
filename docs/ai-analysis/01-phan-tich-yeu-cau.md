# AI thứ nhất: Phân tích yêu cầu

- **Công cụ:** Claude Code (Claude Opus 5.5, Anthropic)
- **Ngày:** 07/11/2026
- **Đầu vào:** mô tả đề tài và kết quả khảo sát 3 website ([competitor-analysis.md](../competitor-analysis.md))

## Prompt đã dùng (Prompt 1 của đề bài, đã điền thông tin)

```text
Bạn là chuyên gia phân tích nghiệp vụ cho dự án thương mại điện tử.

Thông tin dự án:
- Tên dự án: JadeCard (jadecard.vn)
- Sản phẩm hoặc dịch vụ: Bán thẻ bài Pokémon TCG (hàng nguyên hộp: booster pack/box,
  ETB, tin; và thẻ lẻ). Tính năng khác biệt "Check thẻ": người dùng chụp thẻ, hệ thống
  dùng OCR đọc tên + số thẻ, gọi API để lấy giá thị trường quy đổi VND. Sau đó người
  dùng có thể lưu vào Bộ sưu tập hoặc bán thẻ cho shop; shop thu mua thẻ hiếm và đăng
  bán lại dưới dạng thẻ lẻ.
- Khách hàng mục tiêu: Người sưu tầm và người chơi Pokémon TCG 16–35 tuổi tại Việt Nam
  (học sinh, sinh viên, người đi làm trẻ ở thành phố lớn); phụ huynh mua quà.
- Vấn đề kinh doanh: (1) Người chơi không biết giá trị thẻ, giá quốc tế tính bằng USD
  và phải tra thủ công; (2) khó bán lại thẻ hiếm minh bạch, phải rao trên nhóm Facebook;
  (3) các shop lớn trong nước chủ yếu bán hàng nguyên hộp, thiếu thẻ lẻ.
- Website tham khảo: https://tgbstore.com.vn/ , https://saigontcg.com/ ,
  https://herogame.vn/danh-muc/the-bai-tcg-pokemon
- Thời gian thực hiện: một học phần (khoảng 10–15 tuần), làm theo từng buổi:
  HTML/CSS → JavaScript + localStorage → backend + CSDL → kiểm thử → triển khai.
- Quy mô nhóm: 1 thành viên (sinh viên mới học lập trình web, dùng HTML/CSS/JS thuần).

Hãy đề xuất:
1. Mục tiêu và phạm vi dự án.
2. Các nhóm người dùng và quyền hạn.
3. Danh sách chức năng cần có.
4. Quy trình nghiệp vụ chính.
5. Yêu cầu phi chức năng.
6. Các chức năng nên hoàn thành ở phiên bản đầu tiên.
7. Các chức năng nâng cao có thể bổ sung.
8. Rủi ro khi triển khai và cách giảm thiểu.

Phân biệt rõ:
- Yêu cầu bắt buộc.
- Yêu cầu có thể phát triển sau.
- Đề xuất cần nhóm xác minh thêm.

Không giả định nhóm có đủ thời gian hoặc năng lực để triển khai tất cả chức năng.
Hãy giải thích cơ sở của từng đề xuất.
```

## Kết quả của AI

Ký hiệu: **[BB]** bắt buộc · **[SAU]** có thể phát triển sau · **[XM]** cần nhóm xác minh thêm

### 1. Mục tiêu và phạm vi
- **Mục tiêu:** (a) bán hàng Pokémon TCG trực tuyến; (b) xây nguồn hàng thẻ lẻ từ cộng đồng qua thu mua; (c) giữ chân người dùng bằng Check thẻ và Bộ sưu tập.
  *Cơ sở:* cả hai đối thủ đã khảo sát được đều thiếu thẻ lẻ và công cụ định giá, nên đây là khoảng trống rõ ràng.
- **Phạm vi:** chỉ Pokémon, chỉ thẻ tiếng Anh cho Check thẻ, thanh toán COD hoặc chuyển khoản xác nhận thủ công.
  *Cơ sở:* nhóm chỉ có 1 người mới học. Mỗi dòng game khác nhau cần OCR và nguồn giá riêng.

### 2. Người dùng và quyền hạn
- [BB] **Khách** (xem, tìm, dùng thử Check thẻ), **Khách hàng** (mua, bộ sưu tập, bán thẻ), **Quản trị viên** (sản phẩm, đơn, thu mua, cấu hình giá).
  *Cơ sở:* đây là ba vai trò tối thiểu để hai quy trình mua và thu mua chạy được.
- [SAU] Tách *Nhân viên kiểm định* thành vai trò riêng. *Cơ sở:* chỉ cần khi shop có nhiều nhân sự.
- [XM] Có cho khách chưa đăng nhập dùng Check thẻ không? AI đề xuất **có**, vì đây là "cửa vào" thu hút người dùng mới. Cần cân nhắc giới hạn số lần quét để tránh lạm dụng API.

### 3. Danh sách chức năng
- [BB] Cửa hàng: danh sách sản phẩm, chi tiết, tìm kiếm/lọc/sắp xếp, giỏ hàng, đặt hàng, đăng ký/đăng nhập, theo dõi đơn (F01–F07). *Cơ sở:* chức năng TMĐT tối thiểu theo đề bài.
- [BB] Check thẻ: quét ảnh bằng OCR, **người dùng xác nhận thẻ khớp**, tìm thủ công, giá VND, giá thu mua tạm tính (F08–F12). *Cơ sở:* đây là USP. Bước xác nhận và tìm thủ công là bắt buộc vì OCR không bao giờ đúng 100%.
- [BB] Bộ sưu tập Đang có và Đang săn, bán từ bộ sưu tập (F13, F14, F16). *Cơ sở:* nối Check thẻ với hai vế mua và bán.
- [SAU / Nên có] % hoàn thành set (F15). *Cơ sở:* tăng độ gắn bó nhưng không ảnh hưởng doanh thu trực tiếp. Cần gọi thêm API danh sách set.
- [BB] Yêu cầu bán và theo dõi (F17, F18). Admin xử lý thu mua và tạo sản phẩm thẻ lẻ từ thẻ đã thu (F21).
- [BB] Admin quản lý sản phẩm và đơn hàng (F19, F20). [Nên có] Cấu hình giá (F22). Có thể hard-code tham số trong giai đoạn đầu.

### 4. Quy trình nghiệp vụ chính
- [BB] Quy trình mua hàng (10 bước) và **quy trình Check thẻ → Thu mua → Đăng bán lại** (12 bước, có nhánh kiểm định thấp hơn khai báo và nhánh thẻ giả). Chi tiết xem [business-workflow.md](../business-workflow.md).
- [BB] Quy tắc **"giá chốt sau kiểm định"**. *Cơ sở:* từ ảnh chụp không đánh giá được thẻ thật hay giả và tình trạng thật. Nếu báo giá cố định qua ảnh, shop sẽ chịu rủi ro tài chính.

### 5. Yêu cầu phi chức năng
- [BB] Responsive, ưu tiên điện thoại cho Check thẻ. Kiểm tra dữ liệu đầu vào. Phân quyền admin. Ghi nguồn giá và nhãn "tham khảo". Ảnh được xử lý trên trình duyệt. Không công khai key.
- [XM] OCR trả kết quả trong ≤ 10 giây trên điện thoại tầm trung. Cần đo thực tế với Tesseract.js.

### 6. Phiên bản đầu tiên (MVP)
Hoàn thành theo thứ tự: **(1) luồng mua hàng cơ bản → (2) Check thẻ có tìm thủ công → (3) Bộ sưu tập Đang có → (4) yêu cầu bán + xử lý của admin → (5) Đang săn**.
*Cơ sở:* luồng (1) là yêu cầu chấm điểm cơ bản, phải có trước. Các luồng sau xếp theo mức độ thể hiện USP.

### 7. Chức năng nâng cao
[SAU] Thanh toán online · Check thẻ cho One Piece / Yu-Gi-Oh! · Ký gửi · Lịch sử giá và thông báo · Chia sẻ bộ sưu tập · Tích điểm thành viên · Sàn mua bán giữa người dùng.
*Cơ sở:* mỗi tính năng cần tích hợp bên ngoài, cần backend phức tạp, hoặc phát sinh nghiệp vụ tài chính (đối soát, hoa hồng).

### 8. Rủi ro và giảm thiểu
| Rủi ro | Giảm thiểu |
|---|---|
| Trễ tiến độ vì 1 người | Công việc nhỏ 1–3 giờ. Cắt "Nên có" khi cần. |
| OCR sai | Bước xác nhận, tìm thủ công, hướng dẫn chụp |
| API giá thay đổi hoặc bị chặn | [XM] Kiểm tra sớm. Tách lớp dịch vụ giá. Dự phòng bằng file JSON. |
| Giá quốc tế lệch giá VN | [XM] Đối chiếu giá thu mua thực tế. Hệ số có thể cấu hình. |
| Gian lận thẻ giả | Kiểm định thủ công, quay video |
| Dữ liệu cá nhân | Không dùng dữ liệu thật. Không lưu số tài khoản trên trình duyệt. |

### Các điểm cần nhóm xác minh (tổng hợp)
1. API giá: pokemontcg.io hay TCGdex còn miễn phí không, có cho gọi trực tiếp từ trình duyệt (CORS) không, điều khoản sử dụng ra sao.
2. Độ chính xác của Tesseract.js với thẻ Pokémon (thẻ holo, ảnh chụp nghiêng).
3. Hệ số thu mua 60% và hệ số tình trạng có sát với thị trường thu mua Việt Nam không.
4. Có giới hạn số lần Check thẻ cho khách chưa đăng nhập không.
