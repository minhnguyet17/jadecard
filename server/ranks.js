// ======================================================================
// CHỨC VỤ DIỄN ĐÀN (F40)
// Tính từ tổng số like nhận được, dùng chung cho mọi forum.
// Không cần bảng riêng trong CSDL: bảng chức vụ để ngay trong code.
// ======================================================================

// Thứ tự từ thấp đến cao. "min" = số like tối thiểu để đạt chức vụ.
const RANKS = [
  { level: 1, name: "Chiếu mới", min: 0 },
  { level: 2, name: "Học việc", min: 10 },
  { level: 3, name: "Thợ săn sơ cấp", min: 50 },
  { level: 4, name: "Thợ săn chuyên nghiệp", min: 150 },
  { level: 5, name: "Thợ săn lão làng", min: 400 },
  { level: 6, name: "Master", min: 1000 },
  { level: 7, name: "Grand Master", min: 2500 },
];

// Trả về chức vụ hiện tại và chức vụ kế tiếp (để vẽ thanh tiến độ ở hồ sơ, F41).
function getRank(likes) {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (likes >= rank.min) current = rank;
  }
  const next = RANKS[current.level] || null; // level 7 là cao nhất → không có chức vụ kế tiếp
  return {
    level: current.level,
    name: current.name,
    next: next ? { name: next.name, min: next.min } : null,
  };
}

// Tag nhân viên hiện song song với chức vụ (Admin, Mod JadeCard)
function getStaffTag(role) {
  if (role === "admin") return "Admin";
  if (role === "mod") return "Mod JadeCard";
  return null;
}

module.exports = { RANKS, getRank, getStaffTag };
