// ======================================================================
// TẢI ẢNH LÊN (mỗi ảnh ≤ 5MB, JPG / PNG / WebP; số ảnh tối đa tùy chức năng)
// Thư viện multer đọc file từ form gửi lên (multipart/form-data) vào bộ nhớ.
// Sau đó server tự kiểm tra vài byte đầu file để chắc chắn đó thật sự là ảnh
// (không tin vào đuôi file hay loại file do trình duyệt khai báo), rồi mới lưu.
// ======================================================================
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const multer = require("multer");
const { ApiError } = require("./errors");
const { ROOT } = require("./db");

const MAX_IMAGES = 4;
const MAX_SIZE = 5 * 1024 * 1024;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(ROOT, "data", "uploads");

// Middleware nhận tối đa maxFiles ảnh ở ô "images" của form.
// Diễn đàn: 4 ảnh/bài (F37). Ký gửi: 6 ảnh người bán (F43), 4 ảnh shop chụp khi kiểm định (F44).
function uploadImages(maxFiles = MAX_IMAGES) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SIZE, files: maxFiles, fields: 30 },
  }).array("images", maxFiles);
}

// Nhận diện loại ảnh bằng "chữ ký" ở đầu file
function detectImageType(buffer) {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buffer.length > 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

// Kiểm tra tất cả ảnh trước, đủ điều kiện mới lưu (không để lại file lẻ khi có ảnh hỏng)
function checkImages(files = []) {
  return files.map((file) => {
    const type = detectImageType(file.buffer);
    if (!type) {
      throw new ApiError(400, `"${file.originalname}" không phải ảnh JPG, PNG hoặc WebP.`, { field: "images" });
    }
    return { file, type };
  });
}

// Lưu ảnh vào data/uploads/<thư mục con>/ với tên ngẫu nhiên. Trả về đường dẫn để hiển thị.
function saveImages(checked, subfolder) {
  const folder = path.join(UPLOAD_DIR, subfolder);
  fs.mkdirSync(folder, { recursive: true });
  return checked.map(({ file, type }) => {
    const name = crypto.randomBytes(12).toString("hex") + "." + type;
    fs.writeFileSync(path.join(folder, name), file.buffer);
    return `/uploads/${subfolder}/${name}`;
  });
}

module.exports = { uploadImages, checkImages, saveImages, UPLOAD_DIR, MAX_IMAGES };
