// ======================================================================
// CÁCH BÁO LỖI THỐNG NHẤT CHO MỌI API
// Mọi lỗi trả về dạng JSON: { "error": "Thông báo tiếng Việt", "code": "...", "field": "..." }
//   - error: câu hiển thị cho người dùng
//   - code:  mã lỗi để JavaScript phía trình duyệt xử lý riêng (không bắt buộc)
//   - field: tên ô nhập bị lỗi để tô đỏ đúng ô (không bắt buộc)
// ======================================================================

class ApiError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status; // mã HTTP: 400 dữ liệu sai, 401 chưa đăng nhập, 403 không có quyền, 404 không có...
    this.code = extra.code;
    this.field = extra.field;
    this.data = extra.data; // dữ liệu kèm theo (ví dụ số giây phải chờ)
  }
}

// Middleware cuối cùng của Express: biến mọi lỗi thành JSON
function errorHandler(error, req, res, next) {
  if (error instanceof ApiError) {
    return res.status(error.status).json({
      error: error.message,
      code: error.code,
      field: error.field,
      ...error.data,
    });
  }
  // Lỗi do thư viện tải ảnh (multer) báo: file quá lớn, quá nhiều file...
  if (error && error.name === "MulterError") {
    const messages = {
      LIMIT_FILE_SIZE: "Mỗi ảnh tối đa 5MB.",
      LIMIT_FILE_COUNT: "Quá số ảnh cho phép.",
      LIMIT_UNEXPECTED_FILE: "Quá số ảnh cho phép.",
    };
    return res.status(400).json({ error: messages[error.code] || "Ảnh tải lên không hợp lệ.", field: "images" });
  }
  // Nội dung JSON gửi lên bị hỏng
  if (error && error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Dữ liệu gửi lên không đúng định dạng." });
  }
  // Lỗi không lường trước: ghi ra cửa sổ dòng lệnh, chỉ báo chung chung cho người dùng
  console.error(error);
  res.status(500).json({ error: "Máy chủ gặp lỗi, vui lòng thử lại." });
}

module.exports = { ApiError, errorHandler };
