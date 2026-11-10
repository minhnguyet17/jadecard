// ======================================================================
// THÔNG TIN THÀNH VIÊN ĐƯỢC PHÉP CÔNG KHAI
// Mọi API trả thông tin người dùng đều đi qua publicUser(),
// để không bao giờ lỡ gửi email, mật khẩu băm... ra ngoài.
// ======================================================================
const { getRank, getStaffTag } = require("./ranks");

function publicUser(row) {
  return {
    id: row.id,
    displayName: row.display_name,
    role: row.role,
    staffTag: getStaffTag(row.role),
    rank: getRank(row.likes_received),
    likesReceived: row.likes_received,
    postCount: row.post_count,
    joinedAt: row.created_at,
  };
}

// Tác giả gắn kèm bài viết / topic: lấy từ các cột có tiền tố (ví dụ author_display_name)
// khi truy vấn JOIN với bảng users.
function authorFromRow(row, prefix = "author_") {
  return publicUser({
    id: row[prefix + "id"],
    display_name: row[prefix + "display_name"],
    role: row[prefix + "role"],
    likes_received: row[prefix + "likes_received"],
    post_count: row[prefix + "post_count"],
    created_at: row[prefix + "created_at"],
  });
}

// Đoạn SQL lấy các cột của tác giả, dùng chung cho nhiều truy vấn.
// alias = tên bảng users trong câu JOIN, prefix = tiền tố tên cột trả về.
function authorColumns(alias, prefix = "author_") {
  return ["id", "display_name", "role", "likes_received", "post_count", "created_at"]
    .map((column) => `${alias}.${column} AS ${prefix}${column}`)
    .join(", ");
}

module.exports = { publicUser, authorFromRow, authorColumns };
