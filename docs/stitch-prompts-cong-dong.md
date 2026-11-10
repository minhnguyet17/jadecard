# Prompt Stitch: Tài khoản, Diễn đàn, Ký gửi

Dùng kèm [ke-hoach-cong-dong.md](ke-hoach-cong-dong.md).

**Cách dùng:**
- Dán **đoạn phong cách chung** vào đầu mỗi prompt, rồi dán prompt của từng màn hình.
- Mỗi màn hình nên dựng hai bản: máy tính (1366px) và điện thoại (390px).
- Stitch chỉ dùng để **tham khảo phong cách**. Cấu trúc trang và nội dung đi theo kế hoạch, và mình sẽ viết lại bằng HTML + SCSS (không dùng Tailwind).

> Nên chụp màn hình trang chủ và trang Sản phẩm hiện tại rồi đính kèm vào Stitch làm ảnh tham chiếu, để giao diện mới khớp với web đang có.

---

## Đoạn phong cách chung (dán đầu mỗi prompt)

```
Design for "JadeCard", a Vietnamese Pokémon TCG shop and community. Match this existing style exactly:
dark background #07070B, glassmorphism panels (rgba(16,16,24,0.65) + blur, 1px white 8% border, 16px radius),
accent cyan #22D3EE / #67E8F9, secondary purple #A855F7 and gold #FACC15, holographic gradient
(cyan → purple → pink → gold) for highlights and borders, font "Be Vietnam Pro" for text and
"JetBrains Mono" for prices, card numbers and small uppercase labels. Sticky header with logo "J" + JADECARD,
menu: Trang chủ, Sản phẩm, Ký gửi, Diễn đàn, Check thẻ; search box; cart icon; user avatar menu.
All UI text in Vietnamese. Prices in VND like "6.270.000 ₫". Mobile-first, must work at 390px width.
```

---

## Tài khoản

**1. Đăng ký**
```
Registration page. Centered glass card: title "Tạo tài khoản JadeCard", fields Email, Tên hiển thị
(hint "3–20 ký tự, hiện trên diễn đàn"), Mật khẩu with show/hide toggle and strength bar, Nhập lại mật khẩu,
checkbox "Tôi đồng ý với Quy định diễn đàn", big cyan button "Đăng ký", link "Đã có tài khoản? Đăng nhập".
Left side on desktop: 3 benefits with icons: "Lên chức vụ trên diễn đàn", "Ký gửi thẻ, JadeCard bán hộ",
"Theo dõi đơn hàng". Show one inline error state example: "Email này đã được đăng ký".
```

**2. Nhập OTP**
```
Email verification page. Glass card: mail icon, title "Kiểm tra email của bạn", text "Mã 6 số đã gửi tới
j***e@gmail.com, hết hạn sau 10 phút". Six separate large digit boxes (JetBrains Mono), cyan focus.
Button "Xác thực". Below: "Chưa nhận được mã? Gửi lại sau 0:45" (countdown, disabled state) and
"Đổi email". Show also the error state "Mã không đúng, còn 3 lần thử" and a success state with check icon
"Tài khoản đã được kích hoạt".
```

**3. Đăng nhập + 4. Quên mật khẩu**
```
Login page: Email, Mật khẩu, "Quên mật khẩu?" link, cyan button "Đăng nhập", link to register.
Forgot-password flow as 2 steps on one page with a step indicator: step 1 enter email → button "Gửi mã";
step 2 enter 6-digit OTP + Mật khẩu mới + Nhập lại → button "Đổi mật khẩu". Neutral message:
"Nếu email có trong hệ thống, bạn sẽ nhận được mã trong vài phút."
```

---

## Diễn đàn

**5. Trang chủ diễn đàn**
```
Forum home like a modern XenForo/VOZ board. Category header "Cộng đồng JadeCard". Forum rows, each with:
big code badge "F368" (holographic), forum name "Thợ săn tiền thưởng", description "Bóc thẻ, khoe thẻ,
định giá và rao vặt", stats (Topic 1.204 · Bài 18.530), latest topic with author avatar, rank tag and time.
Forums: F100 Thông báo JadeCard, F368 Thợ săn tiền thưởng, F666 Thần bài. Right sidebar on desktop:
"Thành viên nổi bật tuần" with rank tags, "Quy định diễn đàn" link, online count.
```

**6. Danh sách topic F368**
```
Thread list of forum "F368 · Thợ săn tiền thưởng". Top: button "Tạo topic mới", prefix filter chips
(Tất cả, Bóc thẻ, Định giá, Mua bán). Pinned threads first with pin icon. Each row: colored prefix tag
(Bóc thẻ = purple, Định giá = cyan, Mua bán = gold), title, author name + rank tag (e.g. "Thợ săn lão làng"),
replies / views, last reply time and avatar. "Mua bán" rows show a small card thumbnail and price and a
"JadeCard đã xác thực" mini badge. Pagination. On mobile, rows collapse to 2 lines.
```

**7. Trang topic (bài viết, chức vụ, like)**
```
Thread page "[Bóc thẻ] Xé 1 hộp Surging Sparks ra Pikachu ex SIR!". Posts in glass panels. Desktop: author
box on the left (avatar, name, rank tag pill like "Thợ săn chuyên nghiệp" with holo border, staff tag
"Mod JadeCard" for some, join date, post count, likes received); content on the right with images grid,
a quoted block from another member, footer actions: Like (with count, liked state cyan), Trích dẫn, Trả lời,
Báo cáo. Mobile: author box becomes a compact top row. Bottom: reply editor (simple textarea, image attach,
"Gửi trả lời"). Pagination between posts.
```

**7b. Topic Mua bán có thẻ sản phẩm gắn kèm**
```
Same thread page but prefix "Mua bán". Directly under the title, a sticky product card that stays visible on
every page of the thread: card image, "Charizard ex (SIR) · 151 · 199/165", condition "NM (đã kiểm định)",
price "7.500.000 ₫" in large mono, badge "JadeCard đã xác thực", seller name + rank tag, buttons
"Thêm vào giỏ" (cyan) and "Xem chi tiết". Show a second variant of the card in "ĐÃ BÁN" state (greyed,
diagonal sold stamp). Inside a reply, show a pasted listing link rendered as a small inline product card.
```

**8. Tạo topic**
```
New thread form in F368: Tag tiền tố select (Bóc thẻ / Định giá / Mua bán), Tiêu đề, Nội dung textarea with
small toolbar (Đậm, Trích dẫn, Link, Ảnh), image upload up to 4. When "Mua bán" is selected, show a required
panel "Gắn tin ký gửi của bạn" listing the user's consignment items as selectable mini cards (with status
"Đang bán" or "Chờ kiểm định"), plus a note "Mua bán trên diễn đàn phải qua Ký gửi JadeCard".
Buttons "Đăng topic" and "Xem trước".
```

**9. Hồ sơ thành viên + Bộ sưu tập (điểm nhấn của cộng đồng)**
```
Member profile, opened when clicking any member's avatar or name. Header: avatar, name, big rank tag
"Thợ săn lão làng", progress bar to next rank "412 / 1.000 like tới Master", join date, posts, likes received,
successful sales. Tabs, first one selected: "Bộ sưu tập", "Tin ký gửi đang bán", "Topic gần đây".
Collection tab is the showcase: two sections "Đang có (128 thẻ)" and "Đang săn (17 thẻ)". "Đang có" is a
binder-style grid of card images with holographic glow on rare ones, small labels (set · number · condition,
×quantity), filter chips by set and rarity, sort by rarity / newest. Cards the owner is consigning show a gold
"Đang bán" ribbon linking to the listing. Total value is hidden by default; show a small owner-only toggle
"Hiện tổng giá trị" and a lock state example "Bộ sưu tập đang ẩn" for private profiles.
Include a rank ladder visual: Chiếu mới → Học việc → Thợ săn sơ cấp → Thợ săn chuyên nghiệp →
Thợ săn lão làng → Master → Grand Master.
Also show a small hover card that appears when hovering an avatar in a thread: avatar, name, rank tag,
"128 thẻ trong bộ sưu tập", button "Xem bộ sưu tập".
```

---

## Ký gửi

**10. Trang Ký gửi (giống trang Sản phẩm)**
```
Marketplace listing page "Ký gửi · Thẻ của cộng đồng", layout identical to a shop product grid with a left
filter sidebar (Tìm kiếm, Set, Tình trạng NM/LP/MP/HP, Khoảng giá, Chỉ thẻ đã xác thực). Product card =
shop product card + a seller strip at the bottom: small avatar, seller name, rank tag, "12 giao dịch".
Badge on image "JadeCard đã xác thực". Price in cyan mono, button "Thêm vào giỏ". Top banner:
"Ký gửi thẻ của bạn, JadeCard kiểm định và bán hộ · Phí 8%" with button "Đăng ký gửi".
```

**11. Chi tiết tin ký gửi**
```
Consignment item detail, same two-column layout as a shop product page. Left: photo gallery with two groups
"Ảnh người bán" and "Ảnh JadeCard chụp khi kiểm định". Right: name, set, number, price, a verification panel
(check icon, "Kiểm định ngày 09/11/2026", "Tình trạng thực tế: NM", "Thẻ thật"), seller panel (avatar, name,
rank tag, join date, successful sales, link "Xem topic rao trên F368"), button "Thêm vào giỏ",
note "Thẻ đang được giữ tại cửa hàng JadeCard".
```

**12. Đăng tin ký gửi (form)**
```
Multi-step consignment form: 1) Chọn thẻ (search by name or number, results as small cards, or "Dùng Check
thẻ"), 2) Biến thể + Tình trạng tự đánh giá + 2–6 photos (front/back), 3) Giá mong muốn with live calculation
box: "Giá bán 7.500.000 ₫ − Phí 8% (600.000 ₫) = Bạn nhận 6.900.000 ₫", 4) Xác nhận + store address and
"Mang thẻ đến cửa hàng trong 7 ngày để kiểm định". Final success screen with listing code "KG-0042".
```

**13. Tin ký gửi của tôi + 14. Admin kiểm định**
```
(a) "Tin ký gửi của tôi": table/cards with status pills (Chờ kiểm định, Đang bán, Đã bán, Đã tất toán,
Từ chối, Hết hạn), price, amount to receive, actions (Rút tin, Gắn vào F368).
(b) Admin "Kiểm định ký gửi": search by code "KG-0042", left the seller's submission, right a form:
Thật/Giả, Tình trạng thực tế, Giá niêm yết, upload shop photos, buttons "Đạt – đưa lên bán" / "Từ chối"
with reason. Another tab "Tất toán": sold items, amount after commission, button "Đã trả tiền tại quầy".
```
