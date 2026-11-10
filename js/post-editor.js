// ======================================================================
// Ô SOẠN BÀI DÙNG CHUNG (tạo topic F37, trả lời F38)
//   - Nút in đậm: bọc chữ đang chọn bằng **...**
//   - Chọn tối đa 4 ảnh JPG/PNG/WebP, mỗi ảnh ≤ 5MB, xem trước và bỏ bớt được
// Kiểm tra ảnh ở đây chỉ để báo lỗi sớm; server kiểm tra lại (cả nội dung file).
// ======================================================================
const EDITOR_MAX_IMAGES = 4;
const EDITOR_MAX_SIZE = 5 * 1024 * 1024;
const EDITOR_TYPES = ["image/jpeg", "image/png", "image/webp"];

// options: { textarea, boldButton, fileInput, preview, imagesError, maxImages }
// boldButton / textarea có thể bỏ trống (ví dụ form ký gửi chỉ cần chọn ảnh, tối đa 6 ảnh)
function setupPostEditor(options) {
  let files = []; // ảnh đã chọn (giữ trong mảng để bỏ bớt được từng ảnh)
  const maxImages = options.maxImages || EDITOR_MAX_IMAGES;

  // ----- In đậm -----
  if (options.boldButton) options.boldButton.addEventListener("click", function () {
    const area = options.textarea;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const selected = area.value.slice(start, end) || "chữ in đậm";
    area.setRangeText("**" + selected + "**", start, end, "select");
    area.focus();
  });

  // ----- Chọn ảnh -----
  options.fileInput.addEventListener("change", function () {
    options.imagesError.textContent = "";
    Array.from(options.fileInput.files).forEach(function (file) {
      if (files.length >= maxImages) {
        options.imagesError.textContent = "Tối đa " + maxImages + " ảnh.";
      } else if (EDITOR_TYPES.indexOf(file.type) === -1) {
        options.imagesError.textContent = '"' + file.name + '" không phải ảnh JPG, PNG hoặc WebP.';
      } else if (file.size > EDITOR_MAX_SIZE) {
        options.imagesError.textContent = '"' + file.name + '" lớn hơn 5MB.';
      } else {
        files.push(file);
      }
    });
    options.fileInput.value = ""; // cho phép chọn lại đúng file vừa bỏ
    renderPreview();
  });

  function renderPreview() {
    options.preview.innerHTML = "";
    files.forEach(function (file, index) {
      const item = document.createElement("div");
      item.className = "image-preview__item";
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file); // xem trước ảnh ngay trên trình duyệt
      img.alt = "Ảnh " + (index + 1) + ": " + file.name;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "image-preview__remove";
      remove.setAttribute("aria-label", "Bỏ ảnh " + file.name);
      remove.innerHTML = '<span class="icon" aria-hidden="true">close</span>';
      remove.addEventListener("click", function () {
        files.splice(index, 1);
        renderPreview();
      });
      item.append(img, remove);
      options.preview.appendChild(item);
    });
  }

  return {
    getFiles: function () {
      return files.slice();
    },
    reset: function () {
      files = [];
      if (options.textarea) options.textarea.value = "";
      renderPreview();
    },
  };
}
