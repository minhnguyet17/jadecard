// ======================================================================
// HASHTAG THẺ / BỘ THẺ: THẺ MỜI MUA (CTA) + Ô TÌM ĐỂ GẮN HASHTAG
//   - shopOffersForTag(): từ một hashtag, tìm thứ JadeCard đang bán liên quan:
//       thẻ  → đúng lá đó (thẻ lẻ của shop) · tin ký gửi đã kiểm định · pack / box của bộ chứa lá đó
//       bộ   → pack / box của bộ · thẻ lẻ của bộ
//   - shopCtaHtml(): khung mời mua dưới bài viết và trên trang hashtag.
//   - setupTagPicker(): nút "#" trong ô soạn bài → tìm thẻ / bộ → chèn #Hashtag vào nội dung.
// Cần: js/data/products.js, js/api.js, js/community-ui.js, js/card-service.js (tìm trên TCGdex)
// ======================================================================

function sealedOfSet(setId) {
  return products
    .filter(function (product) {
      return !product.cardId && product.setId === setId;
    })
    .sort(function (a, b) {
      return a.price - b.price; // rẻ nhất trước: pack lẻ dễ "xuống tiền" nhất
    });
}

function productOffer(product, eyebrow, note) {
  return {
    key: "product:" + product.id,
    eyebrow: eyebrow,
    title: product.name,
    note: note,
    image: product.image,
    price: product.price,
    href: "product-detail.html?id=" + product.id,
    addId: product.id,
  };
}

// stats: { "sv08-238": { count, minPrice, listingId } } — tin ký gửi đang bán (server trả kèm)
function shopOffersForTag(tag, stats) {
  const offers = [];
  if (typeof products === "undefined") return offers;

  if (tag.kind === "card") {
    const single = products.find(function (product) {
      return product.cardId === tag.ref;
    });
    if (single) offers.push(productOffer(single, "JadeCard đang bán lá này", single.set + " · " + single.number + " · Tình trạng " + single.condition));

    const listing = stats && stats[tag.ref];
    if (listing && listing.count) {
      offers.push({
        key: "listing:" + tag.ref,
        eyebrow: "Ký gửi · JadeCard đã kiểm định",
        title: tag.name + " · " + listing.count + " tin đang bán",
        note: "Thẻ của thành viên, shop đã kiểm tra thật / giả và tình trạng tận tay.",
        image: tagImageUrl(tag),
        price: listing.minPrice,
        pricePrefix: listing.count > 1 ? "từ " : "",
        href: "listing.html?id=" + listing.listingId,
      });
    }

    if (!single) {
      const pack = sealedOfSet(tag.setId)[0];
      if (pack) offers.push(productOffer(pack, "Tự săn lá này", "Lá này nằm trong bộ " + tag.setName + ". Thử vận may với " + pack.name + "."));
    }
  } else {
    sealedOfSet(tag.ref)
      .slice(0, 2)
      .forEach(function (product) {
        offers.push(productOffer(product, "Hàng nguyên hộp " + tag.name, product.description));
      });
    if (!offers.length) {
      const singles = products.filter(function (product) {
        return product.cardId && product.setId === tag.ref;
      });
      if (singles.length) {
        const cheapest = singles.slice().sort(function (a, b) {
          return a.price - b.price;
        })[0];
        offers.push({
          key: "singles:" + tag.ref,
          eyebrow: "Thẻ lẻ bộ " + tag.name,
          title: singles.length + " thẻ lẻ đang bán",
          note: singles
            .map(function (product) {
              return product.name;
            })
            .join(", "),
          image: cheapest.image,
          price: cheapest.price,
          pricePrefix: "từ ",
          href: "products.html?q=" + encodeURIComponent(tag.name),
        });
      }
    }
  }
  return offers;
}

function shopCtaHtml(offer) {
  return (
    '<div class="shop-cta">' +
    '<a class="shop-cta__img" href="' + offer.href + '"><img src="' + escapeHtml(offer.image) + '" alt="" loading="lazy"></a>' +
    '<div class="shop-cta__info">' +
    '<p class="shop-cta__eyebrow"><span class="icon" aria-hidden="true">storefront</span> ' + escapeHtml(offer.eyebrow) + "</p>" +
    '<a class="shop-cta__title" href="' + offer.href + '">' + escapeHtml(offer.title) + "</a>" +
    (offer.note ? '<p class="shop-cta__note">' + escapeHtml(offer.note) + "</p>" : "") +
    "</div>" +
    '<div class="shop-cta__buy">' +
    '<p class="shop-cta__price">' + escapeHtml(offer.pricePrefix || "") + formatVND(offer.price) + "</p>" +
    '<div class="shop-cta__actions">' +
    (offer.addId
      ? '<button type="button" class="btn btn--primary btn--sm" data-add-id="' + offer.addId + '"><span class="icon" aria-hidden="true">add_shopping_cart</span> Thêm vào giỏ</button>'
      : "") +
    '<a class="btn btn--soft btn--sm" href="' + offer.href + '">Xem</a>' +
    "</div></div></div>"
  );
}

// Khung mời mua dưới một bài viết. shown: Set các offer đã hiện trên trang (không lặp lại ở mọi bài).
function postShopHtml(tags, stats, shown) {
  const offers = [];
  (tags || []).forEach(function (tag) {
    shopOffersForTag(tag, stats).forEach(function (offer) {
      if (shown && shown.has(offer.key)) return;
      if (offers.some(function (item) { return item.key === offer.key; })) return;
      offers.push(offer);
    });
  });
  const picked = offers.slice(0, 2); // tối đa 2 thẻ mời mua mỗi bài cho đỡ rối
  picked.forEach(function (offer) {
    if (shown) shown.add(offer.key);
  });
  if (!picked.length) return "";
  return '<div class="post__shop" aria-label="Sản phẩm được nhắc trong bài">' + picked.map(shopCtaHtml).join("") + "</div>";
}

// ======================================================================
// Ô TÌM ĐỂ GẮN HASHTAG (nút "#" trên thanh công cụ của ô soạn bài)
// options: { button, textarea, editor (khung .editor để chèn bảng tìm vào) }
// ======================================================================
function setupTagPicker(options) {
  const panel = document.createElement("div");
  panel.className = "tag-picker";
  panel.hidden = true;
  panel.innerHTML =
    '<div class="tag-picker__bar">' +
    '<span class="icon" aria-hidden="true">tag</span>' +
    '<input type="text" class="tag-picker__input" autocomplete="off" placeholder="Tìm thẻ hoặc bộ: pikachu, umbreon 161, surging sparks…" aria-label="Tìm thẻ hoặc bộ thẻ để gắn hashtag">' +
    '<button type="button" class="tag-picker__close" aria-label="Đóng"><span class="icon" aria-hidden="true">close</span></button>' +
    "</div>" +
    '<div class="tag-picker__results" aria-live="polite"><p class="tag-picker__hint">Gắn thẻ hoặc bộ pack bạn nhắc tới. Nếu JadeCard có bán, bài viết sẽ tự hiện link mua.</p></div>';
  options.editor.querySelector(".editor__toolbar").after(panel);

  const input = panel.querySelector(".tag-picker__input");
  const results = panel.querySelector(".tag-picker__results");
  let timer = null;
  let lastQuery = "";
  let items = {}; // "card:sv08-238" → thông tin để hiện

  function open() {
    panel.hidden = false;
    options.button.setAttribute("aria-expanded", "true");
    input.focus();
  }

  function close() {
    panel.hidden = true;
    options.button.setAttribute("aria-expanded", "false");
  }

  options.button.setAttribute("aria-expanded", "false");
  options.button.addEventListener("click", function () {
    if (panel.hidden) open();
    else close();
  });
  panel.querySelector(".tag-picker__close").addEventListener("click", function () {
    close();
    options.textarea.focus();
  });
  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") event.preventDefault(); // không gửi form bài viết
    if (event.key === "Escape") close();
  });
  input.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(runSearch, 350); // chờ người dùng gõ xong mới tìm
  });

  function itemHtml(item) {
    const key = item.kind + ":" + item.ref;
    items[key] = item;
    const image = item.image ? tagImageUrl({ kind: item.kind, image: item.image }) : "";
    const sub = item.kind === "card" ? (item.setName || "") + (item.number ? " · " + item.number : "") : "Bộ thẻ (set) · pack, box";
    return (
      '<button type="button" class="tag-picker__item" data-key="' + escapeHtml(key) + '">' +
      (image ? '<img src="' + escapeHtml(image) + '" alt="" loading="lazy">' : '<span class="tag-picker__noimg icon" aria-hidden="true">style</span>') +
      '<span class="tag-picker__text"><span class="tag-picker__name">' + escapeHtml(item.name) + "</span>" +
      '<span class="tag-picker__sub">' + escapeHtml(sub) + "</span></span>" +
      (item.sold ? '<span class="tag-picker__badge">Shop có bán</span>' : "") +
      "</button>"
    );
  }

  function groupHtml(title, list) {
    if (!list.length) return "";
    return '<p class="tag-picker__group">' + title + "</p>" + list.map(itemHtml).join("");
  }

  async function runSearch() {
    const query = input.value.trim();
    if (query === lastQuery) return;
    lastQuery = query;
    if (query.length < 2) {
      results.innerHTML = '<p class="tag-picker__hint">Nhập ít nhất 2 ký tự.</p>';
      return;
    }
    results.innerHTML = '<p class="tag-picker__hint">Đang tìm…</p>';

    // 3 nguồn chạy song song; nguồn nào lỗi thì bỏ qua nguồn đó
    const settled = await Promise.allSettled([
      apiGet("/api/tags/search?q=" + encodeURIComponent(query)),
      fetchTcgdex(TCGDEX_API + "/sets?name=" + encodeURIComponent(query)),
      searchCards(query),
    ]);
    if (query !== lastQuery) return; // đã gõ từ khóa khác trong lúc chờ

    const seen = {};
    const fresh = function (item) {
      const key = item.kind + ":" + item.ref;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    };
    const local = settled[0].status === "fulfilled" ? settled[0].value : { shop: [], saved: [] };
    const shop = local.shop.filter(fresh);
    const saved = local.saved.filter(fresh);
    const sets = (settled[1].status === "fulfilled" ? settled[1].value : [])
      .slice(0, 6)
      .map(function (set) {
        return { kind: "set", ref: set.id, name: set.name, image: set.logo || "" };
      })
      .filter(fresh);
    const cards = (settled[2].status === "fulfilled" ? settled[2].value : [])
      .slice(0, 12)
      .map(function (card) {
        return { kind: "card", ref: card.id, name: card.name, setName: card.id, image: card.image };
      })
      .filter(fresh);

    items = {};
    const html =
      groupHtml("JadeCard đang bán", shop) +
      groupHtml("Hashtag đã có trên diễn đàn", saved) +
      groupHtml("Bộ thẻ (set)", sets) +
      groupHtml("Thẻ trên TCGdex", cards);
    results.innerHTML = html || '<p class="tag-picker__hint">Không tìm thấy. Thử tên tiếng Anh, ví dụ "charizard", "151", "prismatic".</p>';
  }

  results.addEventListener("click", async function (event) {
    const button = event.target.closest("[data-key]");
    if (!button) return;
    const item = items[button.dataset.key];
    button.disabled = true;
    try {
      // Server tra TCGdex để lấy tên / số / ảnh chuẩn rồi trả về chữ hashtag
      const result = await apiPost("/api/tags", { kind: item.kind, ref: item.ref });
      insertHashtag(result.tag);
      close();
      showToast("Đã gắn #" + hashtagText(result.tag));
    } catch (error) {
      button.disabled = false;
      showToast(error.message);
    }
  });

  // Chèn "#Hashtag " vào chỗ con trỏ đang đứng trong ô soạn bài
  function insertHashtag(tag) {
    const area = options.textarea;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const before = area.value.slice(0, start);
    const text = (before && !/\s$/.test(before) ? " " : "") + "#" + tag.slug + " ";
    area.setRangeText(text, start, end, "end");
    area.focus();
    area.dispatchEvent(new Event("input"));
  }

  return { open: open, close: close };
}
