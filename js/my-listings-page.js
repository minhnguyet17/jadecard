// ======================================================================
// TIN KÝ GỬI CỦA TÔI (F48) — my-listings.html
//   - Trạng thái từng tin, hạn mang thẻ đến / hạn niêm yết, số tiền sẽ nhận
//   - Rút tin (khi Chờ kiểm định / Đang bán / Đang giữ)
//   - Đề nghị trả giá đang chờ: chấp nhận / từ chối (F55)
//   - Gắn vào topic Mua bán F368 (F50)
// ======================================================================
const myListingsBox = document.getElementById("my-listings");

function deadlineText(card) {
  if (card.status === "pending") return "Mang thẻ đến cửa hàng trước " + formatDate(card.verifyDeadline);
  if (card.status === "active" || card.status === "held") return "Niêm yết tới " + formatDate(card.listExpiresAt);
  if (card.status === "rejected") return "Lý do: " + (card.rejectReason || "");
  if (card.status === "sold") return "Đã bán " + formatDate(card.soldAt) + " · chờ tất toán tại quầy";
  if (card.status === "settled") return "Đã nhận tiền tại quầy " + formatDate(card.settledAt);
  if (card.status === "withdrawn" || card.status === "expired_listing") return "Đến cửa hàng nhận lại thẻ (nếu shop đang giữ).";
  return "";
}

function myListingHtml(card) {
  const priceLabel = card.finalPrice ? "Giá bán" : card.listPrice ? "Giá niêm yết" : "Giá mong muốn";
  const offers = card.offers.length
    ? '<ul class="offer-list">' +
      card.offers
        .map(function (offer) {
          return (
            '<li class="offer-row">' + avatarHtml(offer.buyer, "sm") +
            '<div class="offer-row__who">' + userLinkHtml(offer.buyer) + '<span class="offer-row__meta">hết hạn ' + formatDateTime(offer.expiresAt) + "</span></div>" +
            '<strong class="offer-row__amount">' + formatVND(offer.amount) + "</strong>" +
            '<button type="button" class="btn btn--primary btn--sm" data-accept-offer="' + offer.id + '">Chấp nhận</button>' +
            '<button type="button" class="btn btn--soft btn--sm" data-decline-offer="' + offer.id + '">Từ chối</button></li>'
          );
        })
        .join("") +
      "</ul>"
    : "";

  return (
    '<article class="my-listing">' +
    '<img class="my-listing__img" src="' + escapeHtml(listingImage(card.image)) + '" alt="" loading="lazy">' +
    '<div class="my-listing__main">' +
    '<p class="my-listing__code mono">' + escapeHtml(card.code) + " · " + formatDate(card.createdAt) + "</p>" +
    '<h2 class="my-listing__name"><a href="' + listingUrl(card) + '">' + escapeHtml(card.cardName) + "</a></h2>" +
    '<p class="my-listing__meta">' + escapeHtml(card.setName + " · " + card.cardNumber + " · " + card.variantLabel + " · " + card.condition) + "</p>" +
    '<p class="my-listing__status"><span class="status status--' + card.status + '">' + escapeHtml(card.statusLabel) + "</span> " + escapeHtml(deadlineText(card)) + "</p>" +
    (card.thread ? '<p class="my-listing__topic"><span class="icon" aria-hidden="true">forum</span> <a href="thread.html?id=' + card.thread.id + '">' + escapeHtml(card.thread.title) + "</a></p>" : "") +
    offers +
    "</div>" +
    '<dl class="my-listing__money">' +
    "<div><dt>" + priceLabel + "</dt><dd>" + formatVND(card.finalPrice || card.price) + "</dd></div>" +
    "<div><dt>Hoa hồng</dt><dd>− " + formatVND(card.commission) + "</dd></div>" +
    '<div class="my-listing__payout"><dt>Bạn nhận tại quầy</dt><dd>' + formatVND(card.payout) + "</dd></div>" +
    "</dl>" +
    '<div class="my-listing__actions">' +
    (card.canAttach ? '<a class="btn btn--soft btn--sm" href="new-thread.html?f=F368&listing=' + card.id + '"><span class="icon" aria-hidden="true">forum</span> Gắn vào F368</a>' : "") +
    (card.canWithdraw ? '<button type="button" class="btn btn--soft btn--sm" data-withdraw="' + card.id + '">' + (card.status === "pending" ? "Hủy tin" : "Rút tin") + "</button>" : "") +
    "</div>" +
    "</article>"
  );
}

async function loadMyListings() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.replace("login.html?next=my-listings.html");
    return;
  }
  try {
    const data = await apiGet("/api/my/listings");
    myListingsBox.innerHTML = data.listings.length
      ? data.listings.map(myListingHtml).join("")
      : '<div class="empty-state empty-state--stack"><span class="icon icon--5xl text-dim" aria-hidden="true">storefront</span><p class="empty-state__title">Bạn chưa có tin ký gửi nào</p><a class="btn btn--primary btn--sm" href="new-listing.html">Đăng tin ký gửi</a></div>';
  } catch (error) {
    myListingsBox.innerHTML = loadErrorHtml(error);
  }
}

myListingsBox.addEventListener("click", async function (event) {
  const withdraw = event.target.closest("[data-withdraw]");
  const accept = event.target.closest("[data-accept-offer]");
  const decline = event.target.closest("[data-decline-offer]");
  let url = null;
  if (withdraw) {
    if (!window.confirm("Rút tin này? Nếu shop đang giữ thẻ, bạn đến cửa hàng nhận lại thẻ.")) return;
    url = "/api/listings/" + withdraw.dataset.withdraw + "/withdraw";
  } else if (accept) {
    url = "/api/offers/" + accept.dataset.acceptOffer + "/accept";
  } else if (decline) {
    url = "/api/offers/" + decline.dataset.declineOffer + "/decline";
  }
  if (!url) return;
  try {
    const result = await apiPost(url);
    showToast(result.message || (accept ? "Đã chấp nhận. Thẻ được giữ 24 giờ cho người trả giá." : "Đã cập nhật."));
    loadMyListings();
  } catch (error) {
    showToast(error.message);
  }
});

loadMyListings();
