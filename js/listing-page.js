// ======================================================================
// CHI TIẾT TIN KÝ GỬI (F46) — listing.html?id=12
//   - Ảnh JadeCard chụp khi kiểm định / ảnh người bán cung cấp
//   - Kết quả kiểm định, giá, nút "Thêm vào giỏ" (F47)
//   - Trả giá (F55): người mua đề nghị giá; người bán chấp nhận / từ chối ngay trên trang này
//   - Người bán: chức vụ, số giao dịch thành công, điểm đánh giá và nhận xét (F56)
// ======================================================================
const listingId = Number(getQueryParam("id"));
let listingData = null;

function galleryHtml(listing) {
  const groups = [
    { key: "shop", label: "JadeCard chụp khi kiểm định", images: listing.images.shop },
    { key: "seller", label: "Người bán cung cấp", images: listing.images.seller },
  ].filter(function (group) {
    return group.images.length;
  });
  const first = groups.length ? groups[0].images[0] : listingImage(listing.image, "high");
  return (
    '<div class="gallery__main"><img id="gallery-main" src="' + escapeHtml(first) + '" alt="Ảnh thẻ ' + escapeHtml(listing.cardName) + '"></div>' +
    groups
      .map(function (group) {
        return (
          '<p class="gallery__label">' + escapeHtml(group.label) + " (" + group.images.length + " ảnh)</p>" +
          '<div class="gallery__thumbs">' +
          group.images
            .map(function (src, i) {
              return '<button type="button" class="gallery__thumb" data-src="' + escapeHtml(src) + '" aria-label="' + escapeHtml(group.label + " " + (i + 1)) + '"><img src="' + escapeHtml(src) + '" alt=""></button>';
            })
            .join("") +
          "</div>"
        );
      })
      .join("")
  );
}

function verificationHtml(listing) {
  const v = listing.verification;
  if (listing.status === "pending") {
    return (
      '<div class="verify-box verify-box--pending"><span class="icon" aria-hidden="true">hourglass_top</span><div>' +
      "<strong>Chờ kiểm định</strong><p>Người bán cần mang thẻ đến cửa hàng trước " + formatDate(listing.verifyDeadline) +
      ". Tin chỉ hiện công khai sau khi JadeCard kiểm định đạt.</p></div></div>"
    );
  }
  if (!v) return "";
  if (listing.status === "rejected") {
    return '<div class="verify-box verify-box--rejected"><span class="icon" aria-hidden="true">block</span><div><strong>Không đạt kiểm định</strong><p>' + escapeHtml(v.rejectReason || "") + "</p></div></div>";
  }
  return (
    '<div class="verify-box"><span class="icon" aria-hidden="true">verified_user</span><div>' +
    "<strong>JadeCard đã kiểm định tận tay</strong>" +
    '<dl class="verify-box__facts">' +
    "<div><dt>Tình trạng thực tế</dt><dd>" + escapeHtml(v.conditionVerified) + "</dd></div>" +
    "<div><dt>Ngày kiểm định</dt><dd>" + formatDate(v.verifiedAt) + "</dd></div>" +
    "<div><dt>Thẻ</dt><dd>" + (v.authentic ? "Thật" : "—") + "</dd></div>" +
    "</dl><p>Thẻ đang được giữ tại cửa hàng JadeCard cho tới khi bán.</p></div></div>"
  );
}

function buyBoxHtml(data) {
  const listing = data.listing;
  let html =
    '<div class="buy-box">' +
    '<p class="buy-box__label">' + (data.buyPrice !== listing.price ? "Giá đã chốt cho bạn" : "Giá niêm yết ký gửi") + "</p>" +
    '<p class="buy-box__price">' + formatVND(data.buyPrice) + "</p>" +
    (data.buyPrice !== listing.price ? '<p class="buy-box__ref">Giá niêm yết: <s>' + formatVND(listing.price) + "</s></p>" : "") +
    (listing.refPrice ? '<p class="buy-box__ref">Giá tham khảo quốc tế lúc đăng: ' + formatVND(listing.refPrice) + "</p>" : "");

  if (data.canBuy) {
    html += '<button id="add-to-cart" type="button" class="btn btn--primary btn--md btn--block btn--glow"><span class="icon" aria-hidden="true">add_shopping_cart</span> Thêm vào giỏ hàng</button>';
  }
  if (data.buyNote) html += '<p class="buy-box__note">' + escapeHtml(data.buyNote) + (listing.holdUntil ? " (đến " + formatDateTime(listing.holdUntil) + ")" : "") + "</p>";

  // Trả giá (F55)
  if (data.myOffer) {
    const labels = { pending: "đang chờ người bán trả lời", accepted: "đã được chấp nhận", declined: "đã bị từ chối", expired: "đã hết hạn", cancelled: "đã hủy" };
    html +=
      '<p class="buy-box__offer">Bạn đã trả ' + formatVND(data.myOffer.amount) + " · " + labels[data.myOffer.status] +
      (data.myOffer.status === "pending" ? ' <button type="button" class="link-button" data-cancel-offer="' + data.myOffer.id + '">Hủy đề nghị</button>' : "") + "</p>";
  }
  if (data.canOffer) {
    html +=
      '<form id="offer-form" class="offer-form" novalidate>' +
      '<label class="field__label" for="amount">Trả giá (từ ' + formatVND(data.offerMin) + " đến dưới " + formatVND(listing.price) + ")</label>" +
      '<div class="offer-form__row"><input id="amount" class="field__input" type="number" inputmode="numeric" min="' + data.offerMin + '" max="' + (listing.price - 1) + '" step="1000" aria-describedby="amount-error">' +
      '<button type="submit" class="btn btn--soft btn--sm">Gửi đề nghị</button></div>' +
      '<p id="amount-error" class="field__error" aria-live="polite"></p>' +
      '<p class="field__hint">Đề nghị hết hạn sau 48 giờ. Người bán chấp nhận thì thẻ được giữ cho bạn 24 giờ với giá đã chốt.</p></form>';
  } else if (!data.isOwner && listing.status === "active" && !data.myOffer) {
    html += '<p class="buy-box__note"><a href="login.html?next=' + encodeURIComponent(currentPageForNext()) + '">Đăng nhập</a> để trả giá.</p>';
  }
  return html + "</div>";
}

function ownerOffersHtml(data) {
  if (!data.isOwner) return "";
  const rows = data.offers.length
    ? data.offers
        .map(function (offer) {
          return (
            '<li class="offer-row">' + avatarHtml(offer.buyer, "sm") +
            '<div class="offer-row__who">' + userLinkHtml(offer.buyer) + '<span class="offer-row__meta">hết hạn ' + formatDateTime(offer.expiresAt) + "</span></div>" +
            '<strong class="offer-row__amount">' + formatVND(offer.amount) + "</strong>" +
            '<button type="button" class="btn btn--primary btn--sm" data-accept-offer="' + offer.id + '">Chấp nhận</button>' +
            '<button type="button" class="btn btn--soft btn--sm" data-decline-offer="' + offer.id + '">Từ chối</button></li>'
          );
        })
        .join("")
    : '<li class="offer-row offer-row--empty">Chưa có đề nghị nào đang chờ.</li>';
  return '<section class="panel owner-box"><h2 class="owner-box__title">Đề nghị trả giá cho tin của bạn</h2><ul class="offer-list">' + rows + '</ul><p class="field__hint">Chấp nhận một đề nghị thì các đề nghị khác tự bị từ chối. Quản lý tin ở <a class="text-cyan" href="my-listings.html">Tin ký gửi của tôi</a>.</p></section>';
}

function sellerBoxHtml(data) {
  const seller = data.listing.seller;
  const stats = data.sellerStats;
  const thread = data.listing.thread;
  return (
    '<section class="seller-box">' +
    '<p class="seller-box__label">Người bán</p>' +
    '<div class="seller-box__head"><a href="' + profileUrl(seller) + '">' + avatarHtml(seller, "lg") + "</a>" +
    "<div>" + userLinkHtml(seller) + '<div class="user-tags">' + rankTagsHtml(seller) + "</div>" +
    '<p class="seller-box__joined">Tham gia ' + formatDate(seller.joinedAt) + " · " + formatNumber(seller.postCount) + " bài viết</p></div></div>" +
    '<dl class="seller-box__stats"><div><dt>Giao dịch thành công</dt><dd>' + stats.successCount + "</dd></div>" +
    "<div><dt>Đánh giá người bán</dt><dd>" + starsHtml(stats.ratingAvg, stats.ratingCount) + "</dd></div></dl>" +
    (thread ? '<a class="seller-box__topic" href="thread.html?id=' + thread.id + '"><span class="icon" aria-hidden="true">forum</span> Topic F368: ' + escapeHtml(thread.title) + "</a>" : "") +
    "</section>"
  );
}

function reviewsHtml(reviews) {
  if (!reviews.length) return '<p class="empty-note">Người bán chưa có đánh giá nào.</p>';
  return (
    '<ul class="review-list">' +
    reviews
      .map(function (review) {
        return (
          '<li class="review' + (review.hidden ? " review--hidden" : "") + '">' +
          '<div class="review__head">' + avatarHtml(review.buyer, "sm") + userLinkHtml(review.buyer) +
          '<span class="stars__icons">' + "★".repeat(review.stars) + "☆".repeat(5 - review.stars) + "</span>" +
          '<span class="review__meta">' + escapeHtml(review.cardName) + " · " + timeHtml(review.createdAt) + "</span>" +
          (review.hidden ? '<span class="tag tag--yellow">Đã ẩn</span>' : "") + "</div>" +
          (review.comment ? '<p class="review__text">' + escapeHtml(review.comment) + "</p>" : "") +
          "</li>"
        );
      })
      .join("") +
    "</ul>"
  );
}

function renderListing(data) {
  listingData = data;
  const listing = data.listing;
  document.title = listing.cardName + " " + listing.cardNumber + " — Ký gửi JadeCard";
  document.getElementById("crumb-name").textContent = listing.cardName + " · " + listing.cardNumber;
  document.getElementById("gallery").innerHTML = galleryHtml(listing);
  document.getElementById("listing-info").innerHTML =
    '<p class="eyebrow">' + escapeHtml(listing.setName + " · " + listing.cardNumber + " · " + listing.variantLabel) + "</p>" +
    '<h1 class="listing-title">' + escapeHtml(listing.cardName) + "</h1>" +
    '<p class="listing-meta"><span class="mono">' + escapeHtml(listing.code) + "</span> · Đăng " + formatDate(listing.createdAt) + " · " + listingBadgeHtml(listing) +
    ' <span class="tag">' + escapeHtml(listing.statusLabel) + "</span></p>" +
    verificationHtml(listing) +
    buyBoxHtml(data) +
    sellerBoxHtml(data) +
    '<section class="policy-box"><p class="policy-box__title"><span class="icon" aria-hidden="true">policy</span> Chính sách ký gửi JadeCard</p><ul>' +
    "<li>Thẻ được kiểm định tận tay tại cửa hàng trước khi bán và JadeCard giữ thẻ tới khi giao.</li>" +
    "<li>Quay video khi đóng gói. Giao hàng 30.000 ₫ hoặc nhận tại cửa hàng miễn phí.</li>" +
    "<li>Mua bán chỉ qua JadeCard: không chuyển tiền trực tiếp cho người bán.</li></ul></section>";

  document.getElementById("listing-description").innerHTML = listing.description
    ? '<h2 class="section-label">Mô tả của người bán</h2><p class="listing-description">' + escapeHtml(listing.description).replace(/\n/g, "<br>") + "</p>"
    : "";
  document.getElementById("owner-box").innerHTML = ownerOffersHtml(data);
  document.getElementById("reviews").innerHTML = '<h2 class="section-label">Đánh giá người bán</h2>' + reviewsHtml(data.reviews);
}

async function loadListing() {
  if (!listingId) {
    document.getElementById("listing-info").innerHTML = loadErrorHtml(new Error("Đường dẫn thiếu mã tin ký gửi."));
    return;
  }
  try {
    renderListing(await apiGet("/api/listings/" + listingId));
  } catch (error) {
    document.getElementById("listing-layout").innerHTML = loadErrorHtml(error);
  }
}

// ---------- Các nút trên trang (một trình nghe chung) ----------
document.getElementById("listing-page").addEventListener("click", async function (event) {
  const thumb = event.target.closest("[data-src]");
  if (thumb) {
    document.getElementById("gallery-main").src = thumb.dataset.src;
    return;
  }

  if (event.target.closest("#add-to-cart")) {
    const listing = listingData.listing;
    if (addListingToCart(listing, listingData.buyPrice)) {
      bumpCartBadge();
      showToast('Đã thêm "' + listing.cardName + '" vào giỏ', true);
    } else {
      showToast("Thẻ này đã có trong giỏ", true);
    }
    return;
  }

  const actions = [
    ["data-accept-offer", "/api/offers/{id}/accept", "Đã chấp nhận. Thẻ được giữ 24 giờ cho người trả giá."],
    ["data-decline-offer", "/api/offers/{id}/decline", "Đã từ chối đề nghị."],
    ["data-cancel-offer", "/api/offers/{id}/cancel", "Đã hủy đề nghị."],
  ];
  for (const [attribute, url, message] of actions) {
    const button = event.target.closest("[" + attribute + "]");
    if (!button) continue;
    button.disabled = true;
    try {
      await apiPost(url.replace("{id}", button.getAttribute(attribute)));
      showToast(message);
      loadListing();
    } catch (error) {
      button.disabled = false;
      showToast(error.message);
    }
  }
});

// ---------- Gửi đề nghị trả giá (F55) ----------
document.getElementById("listing-page").addEventListener("submit", async function (event) {
  if (event.target.id !== "offer-form") return;
  event.preventDefault();
  const amount = Number(document.getElementById("amount").value);
  const errorBox = document.getElementById("amount-error");
  errorBox.textContent = "";
  if (!amount || amount < listingData.offerMin || amount >= listingData.listing.price) {
    errorBox.textContent = "Giá đề nghị từ " + formatVND(listingData.offerMin) + " đến dưới " + formatVND(listingData.listing.price) + ".";
    return;
  }
  try {
    await apiPost("/api/listings/" + listingId + "/offers", { amount: amount });
    showToast("Đã gửi đề nghị. Người bán có 48 giờ để trả lời.");
    loadListing();
  } catch (error) {
    errorBox.textContent = error.message;
  }
});

loadListing();
