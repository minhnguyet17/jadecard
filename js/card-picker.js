// ======================================================================
// Ô CHỌN THẺ DÙNG CHUNG (Bộ sưu tập, Đăng tin ký gửi)
//   1. Gõ tên hoặc số thẻ → danh sách thẻ khớp (ảnh, tên, mã)
//   2. Bấm một thẻ → tải chi tiết, chọn biến thể có thật của thẻ đó (F09)
//   3. Gọi onChange(card, variant) với giá tham khảo của đúng biến thể (hoặc null)
// Cần: js/card-service.js, js/community-ui.js (escapeHtml)
//
// HTML cần có (đặt id tùy ý, truyền vào setupCardPicker):
//   form tìm (input + nút), khung kết quả, khung thẻ đã chọn
// ======================================================================
function setupCardPicker(options) {
  const input = options.input;
  const results = options.results;
  const selected = options.selected;
  let currentCard = null;

  async function runSearch() {
    const query = input.value.trim();
    if (query.length < 2) {
      results.innerHTML = '<p class="picker__hint">Nhập ít nhất 2 ký tự, ví dụ "charizard 199" hoặc "199/165".</p>';
      return;
    }
    results.innerHTML = '<p class="picker__hint">Đang tìm trên TCGdex…</p>';
    try {
      const cards = await searchCards(query);
      if (!cards.length) {
        results.innerHTML = '<p class="picker__hint">Không tìm thấy thẻ phù hợp. Thử tên tiếng Anh hoặc chỉ số thẻ.</p>';
        return;
      }
      results.innerHTML = cards
        .map(function (card) {
          return (
            '<button type="button" class="picker__card" data-card-id="' + escapeHtml(card.id) + '">' +
            '<img src="' + escapeHtml(cardImageUrl(card.image, "low")) + '" alt="" loading="lazy">' +
            '<span class="picker__name">' + escapeHtml(card.name) + "</span>" +
            '<span class="picker__id">' + escapeHtml(card.id) + "</span></button>"
          );
        })
        .join("");
    } catch (error) {
      results.innerHTML = '<p class="picker__hint picker__hint--error">' + escapeHtml(error.message) + " Kiểm tra kết nối Internet.</p>";
    }
  }

  options.searchButton.addEventListener("click", runSearch);
  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault(); // không gửi form bên ngoài
      runSearch();
    }
  });

  results.addEventListener("click", async function (event) {
    const button = event.target.closest("[data-card-id]");
    if (!button) return;
    selected.innerHTML = '<p class="picker__hint">Đang tải thông tin thẻ…</p>';
    try {
      currentCard = await getCardDetail(button.dataset.cardId);
      renderSelected();
    } catch (error) {
      selected.innerHTML = '<p class="picker__hint picker__hint--error">' + escapeHtml(error.message) + "</p>";
    }
  });

  function renderSelected() {
    const card = currentCard;
    if (!card.variants.length) {
      selected.innerHTML = '<p class="picker__hint picker__hint--error">TCGdex chưa có thông tin biến thể của thẻ này, hãy chọn thẻ khác.</p>';
      options.onChange(null, null);
      return;
    }
    const variantOptions = card.variants
      .map(function (variant, index) {
        return (
          '<label class="picker__variant"><input type="radio" name="picker-variant" value="' + variant.key + '"' + (index === 0 ? " checked" : "") + ">" +
          "<span>" + escapeHtml(variant.label) + "</span>" +
          '<span class="picker__price">' + (variant.vnd ? formatVND(variant.vnd) : "Chưa có giá tham khảo") + "</span></label>"
        );
      })
      .join("");

    selected.innerHTML =
      '<div class="picker__chosen">' +
      '<img src="' + escapeHtml(cardImageUrl(card.image, "low")) + '" alt="' + escapeHtml(card.name) + '">' +
      "<div>" +
      '<p class="picker__chosen-name">' + escapeHtml(card.name) + "</p>" +
      '<p class="picker__chosen-meta">' + escapeHtml(card.setName + " · " + card.number + (card.rarity ? " · " + card.rarity : "")) + "</p>" +
      '<fieldset class="picker__variants"><legend class="field__label">Biến thể</legend>' + variantOptions + "</fieldset>" +
      '<p class="picker__note">Giá tham khảo quốc tế (TCGplayer, quy đổi ' + formatVND(PRICE_CONFIG.usdToVnd) + "/USD)" +
      (card.priceUpdated ? ", cập nhật " + formatDate(card.priceUpdated) : "") + ". Chỉ để tham khảo.</p>" +
      "</div></div>";

    selected.querySelectorAll("input[name=picker-variant]").forEach(function (radio) {
      radio.addEventListener("change", notify);
    });
    results.innerHTML = "";
    notify();
  }

  function notify() {
    const key = selected.querySelector("input[name=picker-variant]:checked").value;
    const variant = currentCard.variants.find(function (item) {
      return item.key === key;
    });
    options.onChange(currentCard, variant);
  }

  return {
    // Điền sẵn thẻ (ví dụ bấm "Ký gửi thẻ này" từ Bộ sưu tập)
    preselect: async function (cardId) {
      input.value = cardId;
      selected.innerHTML = '<p class="picker__hint">Đang tải thông tin thẻ…</p>';
      try {
        currentCard = await getCardDetail(cardId);
        renderSelected();
      } catch (error) {
        selected.innerHTML = '<p class="picker__hint picker__hint--error">' + escapeHtml(error.message) + "</p>";
      }
    },
    selectVariant: function (key) {
      const radio = selected.querySelector('input[name=picker-variant][value="' + key + '"]');
      if (radio) {
        radio.checked = true;
        notify();
      }
    },
  };
}
