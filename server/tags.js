// ======================================================================
// HASHTAG THẺ / BỘ THẺ TRONG BÀI VIẾT
//   - Người viết bấm nút "#" trong ô soạn bài, tìm thẻ hoặc bộ (set) rồi chọn:
//     trình duyệt gọi POST /api/tags, server tra TCGdex để lấy tên, số, ảnh chuẩn
//     rồi trả về chữ hashtag, ví dụ  #PikachuEx_SV08_238  hoặc  #SurgingSparks.
//   - Khi đăng / sửa bài, server đọc các #... trong nội dung, cái nào khớp bảng tags
//     thì ghi vào post_tags. Gõ tay đúng hashtag đã có cũng được nhận diện.
//   - Giao diện biến hashtag thành link + thẻ mời mua (CTA) nếu shop có bán thẻ đó
//     hoặc pack / box của bộ đó (đối chiếu với js/data/products.js).
// ======================================================================
const { db, nowIso } = require("./db");
const { ApiError } = require("./errors");
const { products } = require("./products");

const TCGDEX_API = "https://api.tcgdex.net/v2/en";
const MAX_TAGS_PER_POST = 10;

// Mẫu tìm hashtag trong chữ thuần: dấu # không đứng sau chữ / số (để bỏ qua link "trang#muc")
const HASHTAG_PATTERN = /(^|[^\p{L}\p{N}_&/?=#])#([A-Za-z0-9_]{2,60})/gu;

// "Pikachu ex" → "PikachuEx", "Pokémon Tin" → "PokemonTin"
function camelWords(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

// Chữ sau dấu #: thẻ = Tên_MãBộ_Số (không trùng giữa các bộ), bộ = Tên bộ
function makeSlug(info) {
  let slug;
  if (info.kind === "card") {
    const setCode = info.setId.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const localId = String(info.number || "").split("/")[0].replace(/[^A-Za-z0-9]/g, "");
    slug = `${camelWords(info.name)}_${setCode}_${localId}`;
  } else {
    slug = camelWords(info.name);
    if (/^\d/.test(slug)) slug = "Set" + slug; // bộ "151" → #Set151
  }
  slug = slug.slice(0, 55) || "Tag";
  // Trùng chữ với một hashtag khác (hiếm): thêm mã TCGdex cho khác đi
  const taken = db.prepare("SELECT kind, ref FROM tags WHERE slug = ?").get(slug);
  if (taken && !(taken.kind === info.kind && taken.ref === info.ref)) {
    slug = (slug + "_" + info.ref.replace(/[^A-Za-z0-9]/g, "")).slice(0, 60);
  }
  return slug;
}

function tagView(row) {
  return {
    slug: row.slug,
    kind: row.kind,
    ref: row.ref,
    name: row.name,
    setId: row.set_id,
    setName: row.set_name,
    number: row.number,
    image: row.image,
  };
}

function findTag(kind, ref) {
  return db.prepare("SELECT * FROM tags WHERE kind = ? AND ref = ?").get(kind, ref);
}

function findTagBySlug(slug) {
  return db.prepare("SELECT * FROM tags WHERE slug = ?").get(String(slug));
}

// Thêm hashtag (nếu chưa có). info: { kind, ref, name, setId, setName, number, image }
function saveTag(info) {
  const existing = findTag(info.kind, info.ref);
  if (existing) return existing;
  db.prepare(
    `INSERT INTO tags (slug, kind, ref, name, set_id, set_name, number, image, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(makeSlug(info), info.kind, info.ref, info.name, info.setId, info.setName, info.number || null, info.image || null, nowIso());
  return findTag(info.kind, info.ref);
}

// Tra TCGdex để lấy thông tin chuẩn của thẻ / bộ (không dùng chữ do trình duyệt gửi)
async function fetchFromTcgdex(kind, ref) {
  const url = `${TCGDEX_API}/${kind === "card" ? "cards" : "sets"}/${encodeURIComponent(ref)}`;
  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  } catch (error) {
    throw new ApiError(502, "Không kết nối được TCGdex để tra thẻ. Thử lại sau ít phút.");
  }
  if (response.status === 404) throw new ApiError(404, "Không tìm thấy thẻ / bộ này trên TCGdex.");
  if (!response.ok) throw new ApiError(502, "TCGdex đang lỗi, thử lại sau ít phút.");
  const data = await response.json();

  if (kind === "card") {
    const official = data.set && data.set.cardCount && data.set.cardCount.official;
    return {
      kind,
      ref: data.id,
      name: data.name,
      setId: data.set.id,
      setName: data.set.name,
      number: data.localId + (official ? "/" + official : ""),
      image: data.image || null,
    };
  }
  return { kind, ref: data.id, name: data.name, setId: data.id, setName: data.name, number: null, image: data.logo || null };
}

async function findOrCreateTag(kind, ref) {
  if (!["card", "set"].includes(kind)) throw new ApiError(400, "Loại hashtag không hợp lệ.");
  if (!/^[A-Za-z0-9.-]{2,40}$/.test(String(ref || ""))) throw new ApiError(400, "Mã thẻ / bộ không hợp lệ.");
  return findTag(kind, ref) || saveTag(await fetchFromTcgdex(kind, ref));
}

// Các chữ #... trong nội dung bài (không trùng, tối đa 10)
function extractSlugs(content) {
  const slugs = new Set();
  for (const match of String(content).matchAll(HASHTAG_PATTERN)) {
    slugs.add(match[2].toLowerCase());
    if (slugs.size >= MAX_TAGS_PER_POST) break;
  }
  return [...slugs];
}

// Ghi lại hashtag của một bài (gọi khi đăng bài và khi sửa bài)
function syncPostTags(postId, content) {
  db.prepare("DELETE FROM post_tags WHERE post_id = ?").run(postId);
  const insert = db.prepare("INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)");
  for (const slug of extractSlugs(content)) {
    const tag = findTagBySlug(slug);
    if (tag) insert.run(postId, tag.id);
  }
}

// { postId: [tag, ...] } cho một trang bài viết
function tagsForPosts(postIds) {
  const result = {};
  if (!postIds.length) return result;
  const marks = postIds.map(() => "?").join(",");
  const rows = db
    .prepare(`SELECT pt.post_id, t.* FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id IN (${marks}) ORDER BY t.kind, t.id`)
    .all(...postIds);
  for (const row of rows) (result[row.post_id] = result[row.post_id] || []).push(tagView(row));
  return result;
}

// Tin ký gửi đang bán của các thẻ được nhắc: { "sv08-238": { count, minPrice, listingId } }
function listingStats(cardRefs) {
  const stats = {};
  const refs = [...new Set(cardRefs)];
  if (!refs.length) return stats;
  const marks = refs.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT card_id, COUNT(*) AS n, MIN(list_price) AS min_price,
              (SELECT l2.id FROM listings l2 WHERE l2.card_id = l.card_id AND l2.status = 'active' ORDER BY l2.list_price LIMIT 1) AS cheapest_id
       FROM listings l WHERE status = 'active' AND card_id IN (${marks}) GROUP BY card_id`
    )
    .all(...refs);
  for (const row of rows) stats[row.card_id] = { count: row.n, minPrice: row.min_price, listingId: row.cheapest_id };
  return stats;
}

// ---------- Gợi ý khi tìm: những gì shop đang bán (để người viết dễ gắn đúng) ----------
function shopSuggestions(query) {
  const words = camelWords(query).toLowerCase();
  const plain = String(query).toLowerCase().trim();
  const matches = (text) => String(text).toLowerCase().includes(plain) || camelWords(text).toLowerCase().includes(words);
  const result = [];
  const seen = new Set();

  for (const product of products) {
    if (product.cardId && (matches(product.name) || matches(product.set))) {
      const key = "card:" + product.cardId;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ kind: "card", ref: product.cardId, name: product.name, setName: product.set, number: product.number, image: product.image, sold: true });
      }
    }
    if (product.setId && (matches(product.set) || matches(product.name))) {
      const key = "set:" + product.setId;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ kind: "set", ref: product.setId, name: product.set, setName: product.set, number: null, image: product.image, sold: true });
      }
    }
  }
  return result.slice(0, 8);
}

// Hashtag đã có trong CSDL khớp từ khóa
function searchSavedTags(query) {
  const like = "%" + String(query).replace(/[%_]/g, "") + "%";
  return db
    .prepare("SELECT * FROM tags WHERE name LIKE ? OR set_name LIKE ? OR slug LIKE ? ORDER BY kind DESC, id LIMIT 8")
    .all(like, like, "%" + camelWords(query) + "%")
    .map(tagView);
}

module.exports = {
  HASHTAG_PATTERN,
  makeSlug,
  tagView,
  saveTag,
  findTagBySlug,
  findOrCreateTag,
  extractSlugs,
  syncPostTags,
  tagsForPosts,
  listingStats,
  shopSuggestions,
  searchSavedTags,
};
