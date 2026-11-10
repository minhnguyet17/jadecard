# AI thứ hai: Phản biện yêu cầu

**Công cụ:** Astra 6 · **Ngày:** 07/11/2026 · **Kết quả và bảng quyết định:** [02-phan-bien.md](02-phan-bien.md)

## Cách thực hiện
1. Mở một công cụ AI **khác Claude**.
2. Dán toàn bộ khối prompt bên dưới.
3. Ở cuối prompt, dán thêm **nội dung 3 file**: `docs/competitor-analysis.md` (mục 1), `docs/ai-analysis/01-phan-tich-yeu-cau.md` (phần "Kết quả của AI") và `REQUIREMENTS.md` (mục 2 và 4).
4. Lưu câu trả lời vào `docs/ai-analysis/02-phan-bien.md`, rồi lập bảng quyết định.

## Prompt (Prompt 2 của đề bài, đã điền thông tin)

```text
Bạn là người phản biện độc lập cho một dự án website thương mại điện tử
do nhóm sinh viên thực hiện trong một học phần.

Tôi sẽ cung cấp:
1. Mô tả đề tài: JadeCard – website bán thẻ bài Pokémon TCG (hàng nguyên hộp và thẻ lẻ),
   có tính năng "Check thẻ": chụp ảnh thẻ → OCR (Tesseract.js) đọc tên + số thẻ →
   gọi API giá → hiển thị giá thị trường VND và giá thu mua tạm tính. Người dùng có thể
   lưu thẻ vào Bộ sưu tập (Đang có / Đang săn / % hoàn thành set) hoặc gửi yêu cầu bán
   thẻ cho shop. Shop kiểm định, chốt giá, rồi đăng bán lại dưới dạng thẻ lẻ.
   Nhóm có 1 thành viên mới học web, dùng HTML/CSS/JavaScript thuần, làm trong một học phần.
2. Vấn đề kinh doanh và khách hàng mục tiêu: người sưu tầm/chơi Pokémon TCG 16–35 tuổi
   ở Việt Nam không biết giá trị thẻ (giá quốc tế bằng USD), khó bán lại thẻ hiếm một cách
   minh bạch, và khó mua thẻ lẻ vì các shop lớn chủ yếu bán hàng nguyên hộp.
3. Kết quả khảo sát ba website: (dán bên dưới)
4. Danh sách yêu cầu do một công cụ AI khác đề xuất: (dán bên dưới)

Hãy phản biện các yêu cầu theo những khía cạnh:
- Có thực sự giải quyết vấn đề kinh doanh không?
- Có yêu cầu nào trùng lặp hoặc không cần thiết không?
- Có chức năng nào vượt quá phạm vi của nhóm không?
- Có thiếu chức năng cơ bản hoặc quy trình nghiệp vụ nào không?
- Có rủi ro về dữ liệu, bảo mật hoặc quyền riêng tư không?
- Có yêu cầu nào chưa đủ rõ để lập trình và kiểm thử không?

Với mỗi vấn đề, hãy nêu lý do và đề xuất điều chỉnh.
Trình bày kết quả dạng bảng: Mã/Nội dung | AI thứ nhất đề xuất | Ý kiến phản biện | Đề xuất điều chỉnh.

Không mặc định rằng phương án của công cụ AI trước là đúng.
Không tự ý thay đổi toàn bộ đề tài.

--- 3. KẾT QUẢ KHẢO SÁT ---
[dán nội dung]

--- 4. DANH SÁCH YÊU CẦU ---
[dán nội dung]
```

## Bảng tổng hợp quyết định

Đã hoàn thành. Xem mục 3 của [02-phan-bien.md](02-phan-bien.md).
