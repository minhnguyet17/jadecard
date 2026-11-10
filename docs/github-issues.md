# GitHub Issues dự kiến (Giai đoạn 1–2)

Sau khi tạo repo, mỗi dòng dưới đây tạo thành một Issue (**Issues → New issue**). Người phụ trách của tất cả các Issue là **Jade**. Cột "Vai trò" cho biết Issue thuộc "chiếc mũ" nào trong [PROJECT_PLAN.md](../PROJECT_PLAN.md).

| Issue | Tiêu đề | Vai trò | Kết quả cần nộp |
|---|---|---|---|
| #1 | Khảo sát 3 website đối thủ | BA | docs/competitor-analysis.md |
| #2 | Xác định yêu cầu chức năng (AI phân tích + AI phản biện + bảng quyết định) | BA | REQUIREMENTS.md v1.0, docs/ai-analysis/ |
| #3 | Vai trò người dùng và quy trình nghiệp vụ | BA | docs/user-roles.md, docs/business-workflow.md |
| #4 | Wireframe và mockup các trang chính | UI/UX | docs/wireframes/ |
| #5 | Xác định công nghệ và kiểm tra API giá thẻ | Backend | Mục 5 README + docs/tech-spike.md |
| #6 | Hoàn thiện tài liệu khởi tạo và kiểm tra repo public | QA | Link repo mở được ở cửa sổ ẩn danh |

## Mẫu mô tả Issue #1

```markdown
## Mục tiêu
Phân tích ba website có chức năng tương tự dự án JadeCard.

## Công việc
- [ ] Khảo sát trang chủ của tgbstore.com.vn, saigontcg.com, herogame.vn
- [ ] Khảo sát danh mục và chi tiết sản phẩm Pokémon TCG
- [ ] Khảo sát tìm kiếm, giỏ hàng, cách đặt hàng và thanh toán
- [ ] Ghi nhận tính năng đặc biệt (tra giá, thu mua, bộ sưu tập)
- [ ] Lập bảng so sánh và đề xuất cho JadeCard

## Kết quả cần nộp
docs/competitor-analysis.md (+ ảnh trong docs/screenshots/)

## Tiêu chí hoàn thành
- Có tối thiểu ba website, có đường dẫn tham khảo
- Có bảng so sánh đủ 7 tiêu chí
- Có phần "đáng học hỏi" / "chưa phù hợp" kèm lý do lựa chọn
```

## Mẫu mô tả Issue #2

```markdown
## Mục tiêu
Chốt danh sách yêu cầu chức năng cho MVP của JadeCard.

## Công việc
- [ ] Chạy Prompt 1 với AI thứ nhất, lưu kết quả
- [ ] Chạy Prompt 2 với một AI khác để phản biện, lưu kết quả
- [ ] Lập bảng quyết định (giữ / sửa / bỏ) kèm lý do
- [ ] Cập nhật REQUIREMENTS.md lên v1.0 và AI_USAGE_LOG.md

## Kết quả cần nộp
REQUIREMENTS.md v1.0, docs/ai-analysis/01-*.md, 02-*.md

## Tiêu chí hoàn thành
- Mỗi chức năng có mã, mô tả, người dùng, mức ưu tiên và tiêu chí nghiệm thu
- Có tách rõ phần trong phạm vi và ngoài phạm vi
- Mỗi yêu cầu quan trọng có quyết định và lý do
```
