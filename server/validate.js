// ======================================================================
// KIỂM TRA DỮ LIỆU NGƯỜI DÙNG GỬI LÊN
// Giao diện cũng kiểm tra, nhưng server luôn kiểm tra lại: ai cũng có thể
// gửi yêu cầu thẳng tới API mà không qua giao diện.
// ======================================================================
const { ApiError } = require("./errors");

// Email: bỏ khoảng trắng, đổi về chữ thường để "A@x.com" và "a@x.com" là một
function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function checkEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new ApiError(400, "Email không hợp lệ.", { field: "email" });
  }
}

// Tên hiển thị: 3–20 ký tự, chỉ gồm chữ (có dấu tiếng Việt), số, dấu gạch dưới, dấu chấm.
// Không cho khoảng trắng để tên dùng được trong đường dẫn hồ sơ (profile.html?u=Ten_Hien_Thi).
function normalizeDisplayName(value) {
  return String(value || "").trim().normalize("NFC");
}

function checkDisplayName(name) {
  if (name.length < 3 || name.length > 20) {
    throw new ApiError(400, "Tên hiển thị phải dài 3–20 ký tự.", { field: "displayName" });
  }
  if (!/^[\p{L}\p{N}_.]+$/u.test(name)) {
    throw new ApiError(400, "Tên hiển thị chỉ gồm chữ, số, dấu gạch dưới (_) và dấu chấm, không có khoảng trắng.", {
      field: "displayName",
    });
  }
}

// Mật khẩu: ít nhất 8 ký tự. Tối đa 72 vì bcrypt chỉ dùng 72 byte đầu.
function checkPassword(password, field = "password") {
  if (typeof password !== "string" || password.length < 8) {
    throw new ApiError(400, "Mật khẩu phải có ít nhất 8 ký tự.", { field });
  }
  if (Buffer.byteLength(password) > 72) {
    throw new ApiError(400, "Mật khẩu quá dài (tối đa 72 ký tự).", { field });
  }
}

// Chữ thuần: bỏ khoảng trắng hai đầu, kiểm tra độ dài
function cleanText(value, { field, label, min = 1, max }) {
  const text = String(value || "").trim().normalize("NFC");
  if (text.length < min) {
    throw new ApiError(400, min <= 1 ? `Vui lòng nhập ${label}.` : `${label} cần ít nhất ${min} ký tự.`, { field });
  }
  if (text.length > max) {
    throw new ApiError(400, `${label} tối đa ${max} ký tự.`, { field });
  }
  return text;
}

// Số nguyên dương lấy từ đường dẫn (/api/threads/12) hoặc ?page=2
function toPositiveInt(value, fallback = null) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

module.exports = {
  normalizeEmail,
  checkEmail,
  normalizeDisplayName,
  checkDisplayName,
  checkPassword,
  cleanText,
  toPositiveInt,
};
