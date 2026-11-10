// ======================================================================
// THAM SỐ GIÁ DÙNG CHUNG PHÍA TRÌNH DUYỆT (REQUIREMENTS mục 4.5)
// Đây là giá trị giả định để mô phỏng. Server có bản giống hệt trong server/consign.js
// và server/orders.js; khi đặt hàng / đăng tin, server luôn tính lại, không tin số ở đây.
// ======================================================================
const PRICE_CONFIG = {
  usdToVnd: 26000, // tỉ giá USD → VND cho giá tham khảo TCGplayer
  commissionRate: 0.08, // hoa hồng ký gửi 8%
  minCommission: 20000, // tối thiểu 20.000 ₫
  minListingPrice: 50000, // giá ký gửi thấp nhất
  shippingFee: 30000, // phí giao hàng cố định
};

// Hoa hồng và số tiền người bán nhận (hiện trước khi đăng tin, F43)
function consignMoney(price) {
  const commission = Math.max(Math.round(price * PRICE_CONFIG.commissionRate), PRICE_CONFIG.minCommission);
  return { commission: commission, payout: price - commission };
}

// Làm tròn giá tham khảo tới 1.000 ₫
function usdToVnd(usd) {
  return Math.round((usd * PRICE_CONFIG.usdToVnd) / 1000) * 1000;
}
