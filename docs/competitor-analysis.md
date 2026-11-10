# Phân tích website tương tự

**Ngày khảo sát:** 07/11/2026 · **Người khảo sát:** Jade (có AI hỗ trợ đọc trang, xem [AI_USAGE_LOG.md](../AI_USAGE_LOG.md))

| | Website | Đường dẫn | Lý do chọn |
|---|---|---|---|
| A | **TGB Store** | https://tgbstore.com.vn/ | Shop TCG của streamer nổi tiếng (Thầy Giáo Ba), có thương hiệu và cộng đồng mạnh |
| B | **SaigonTCG** | https://saigontcg.com/ | Shop TCG chuyên biệt lâu năm tại TP.HCM, mạnh về thẻ lẻ (hơn 21.000 sản phẩm thẻ lẻ ở nhiều dòng game) |
| C | **HeroGame** | https://herogame.vn/danh-muc/the-bai-tcg-pokemon | Shop game và đồ chơi tổng hợp có bán TCG. Đại diện cho mô hình "TCG là một ngành hàng phụ". |

> **Ghi chú phương pháp.** Website A và C được AI đọc trực tiếp trang. Website B chặn công cụ đọc tự động (HTTP 403), nên được khảo sát qua trình duyệt với sự hỗ trợ của Claude in Chrome (không đăng nhập, không đặt đơn). Danh sách URL đã xem ở cuối file.

## 1. Bảng so sánh

| Tiêu chí | A. TGB Store | B. SaigonTCG | C. HeroGame | Đề xuất cho JadeCard |
|---|---|---|---|---|
| **Trang chủ** | Slider 5 banner (3 về Pokémon), khối "Sản phẩm nổi bật" chia tab theo dòng game, khối "Khuyến mãi" có giá gạch, 4 khối cam kết (quay video đóng gói, quay video khi khui hàng, đổi trả) | Nền tối, **ô tìm kiếm lớn** ở header, menu 4 mục. Dải 8 dòng game, mã giảm giá freeship. Các khối: "Mới cập nhật", tab theo 9 dòng game, "Giảm giá" (chỉ 1 sản phẩm), "Hot Deal" (trống). Có nút "Xem nhanh". Footer rất sơ sài. | TCG chỉ là 1 trong 9 mục menu, xếp sau Nintendo, PlayStation, Gundam... Banner trộn game và TCG. Khối "MUA NGAY" ghi ngày "01.01 - 01.01", có vẻ là nội dung mẫu chưa sửa. | Đặt **Check thẻ làm lời kêu gọi hành động chính** ngay đầu trang ("Thẻ của bạn đáng giá bao nhiêu?"), bên dưới là hàng mới về và thẻ lẻ nổi bật. Học theo TGB khối **cam kết tạo niềm tin**. Học theo SaigonTCG **ô tìm kiếm nổi bật**. Không để khối trống như "Hot Deal". |
| **Danh mục sản phẩm** | Phân loại theo **dòng game → loại sản phẩm** (Pokémon: Booster pack, Bundle, Box, ETB, Tins, Collection). 56 sản phẩm Pokémon. **Không có thẻ lẻ.** | Phân loại theo **dòng game → Single Card / Starter Deck / Booster / Collection**, kèm Phụ kiện. **Mạnh về thẻ lẻ** (Yu-Gi-Oh! 17.305, Digimon 1.986, One Piece 605...). **Nhưng Pokémon chỉ có 13 sản phẩm, mục "Pokemon Single" trống.** Danh mục chính dùng slug `uncategorized`. | Menu "Thẻ bài TCG" có 10 dòng game. Mục Pokémon **không có danh mục con**, cũng **không có thẻ lẻ**. Pokémon TCG không nằm trong menu "POKEMON" (mục đó là mô hình, gấu bông). | Hai nhánh chính: **Hàng nguyên hộp** (pack, box, ETB, tin) và **Thẻ lẻ**, lọc theo set. Đây là cấu trúc của SaigonTCG nhưng áp dụng cho **Pokémon**, mảng cả 3 đối thủ còn bỏ trống. |
| **Tìm kiếm và lọc** | Có ô tìm kiếm. Tìm "pikachu" **không ra kết quả** nào. Có khung "Bộ lọc sản phẩm". Sắp xếp theo mới nhất, giá, tên. | Tìm theo tên hoặc **mã thẻ**. Gõ đúng mã (vd. `MAMO-EN094`) thì **chuyển thẳng tới sản phẩm**. Tìm "pikachu" hay "charizard" **không ra kết quả**. **Không có bộ lọc** theo giá, set, độ hiếm, ngôn ngữ, dù có hơn 17.000 thẻ. 5 cách sắp xếp, 30 sản phẩm mỗi trang. | Tìm "pikachu" ra 67 kết quả trộn lẫn nhiều ngành hàng. URL tìm kiếm khó dùng (`/tim-kiem/search?option=sanpham&keyword=`). Không thấy bộ lọc set hay độ hiếm. | Tìm theo tên **và theo số thẻ** (vd. `025/165`), học từ SaigonTCG. Lọc theo **loại sản phẩm, set, khoảng giá, tình trạng thẻ**. Sắp xếp theo giá hoặc mới nhất. |
| **Chi tiết sản phẩm** | Giá, 1 ảnh, nhãn còn/hết hàng, "Thêm vào giỏ" và "Mua ngay", sản phẩm cùng danh mục. Mô tả là đoạn quảng cáo, **không có trường có cấu trúc** (số thẻ, độ hiếm, ngôn ngữ). | Tên, giá, **số lượng tồn chính xác** ("Còn X trong kho"), chọn số lượng, ảnh phóng to được, sản phẩm tương tự. Set, độ hiếm, ngôn ngữ **chỉ nằm trong tên** (vd. "MAMO-EN094 – Neos Fusion – Ultra Rare – 1st Edition"). **Không có tình trạng thẻ (NM/LP)**, không có mô tả, không có đánh giá. | Tên sản phẩm Pokémon **không ghi ngôn ngữ** (Anh hay Nhật), trong khi Digimon và Yu-Gi-Oh! lại có ghi. Giá và mô tả trang chi tiết tải bằng JS. | Thẻ lẻ có **6 trường có cấu trúc**: set, số thẻ, độ hiếm, ngôn ngữ, **tình trạng (NM/LP/MP/HP)**, **giá thị trường để so sánh**, cộng với **số lượng tồn** như SaigonTCG. Hàng nguyên hộp ghi rõ ngôn ngữ và số pack. |
| **Giỏ hàng và đặt hàng** | Haravan. Xem giỏ không cần đăng nhập. Thanh toán **COD hoặc chuyển khoản MBBank**. Phí ship "thỏa thuận", không công bố bảng giá. Giao TP.HCM 2–3 ngày, tỉnh 3–5 ngày. | WordPress/WooCommerce. Form chỉ có Tên, SĐT (bắt buộc), Địa chỉ, Ghi chú. **Không hỏi email.** Có ô mã giảm giá. **Nhận tại cửa hàng** (miễn phí, giữ đơn 14 ngày) hoặc **ship phí cố định 14.000đ**. **Không có thanh toán trên web**: trả tại shop, hoặc chuyển khoản sau khi nhân viên gọi xác nhận. Trang theo dõi đơn đòi email nên **không dùng được**. | Giỏ hàng xem được khi chưa đăng nhập. COD hoặc chuyển khoản. **Bảng phí ship chi tiết** (nội thành HCM 30–50k, EMS...). Có tích điểm VIP. | Giỏ hàng lưu trên trình duyệt. Checkout 1 trang: thông tin → chọn COD/chuyển khoản → **mã đơn và hướng dẫn chuyển khoản**. **Phí ship công khai, đơn giản** (phí cố định như SaigonTCG). Có lựa chọn **nhận tại cửa hàng**. **Theo dõi đơn bằng tài khoản**, khác với SaigonTCG nơi tính năng này bị hỏng. |
| **Tính năng đặc biệt** | Video đóng gói và khui hàng, liên kết TikTok/YouTube của streamer. Không có tra giá, quét thẻ, thu mua hay bộ sưu tập. | Fanpage, Group Facebook "Saigon Trading Card Game", TikTok. Không có tra giá, thu mua, ký gửi. Không có lịch giải đấu (blog dừng từ 3/2022). | Tích điểm VIP, 2 cửa hàng offline (HCM, HN), mục "hàng cũ" chỉ dành cho máy console. Không có tra giá, quét thẻ hay thu mua thẻ. | **Check thẻ, Bộ sưu tập, Bán thẻ cho shop**: **cả 3 đối thủ đều chưa có**. |
| **Điểm có thể cải thiện** | Thiếu thẻ lẻ. Tìm kiếm yếu. Thông tin sản phẩm thiếu cấu trúc. Phí ship không minh bạch. Đổi trả rất hẹp (chỉ khi lỗi từ shop, bắt buộc có video). | Pokémon rất mỏng. Không lọc được kho thẻ lớn. Không có tình trạng thẻ. Checkout thủ công. Theo dõi đơn hỏng (đòi email nhưng form không hỏi). Link footer 404. Giờ mở cửa ghi 3 kiểu khác nhau. Nội dung cũ (Noel 2021, nhắc phòng dịch Covid-19). Còn sót trang mẫu của theme. | TCG bị chìm giữa ngành game. **Chính sách đổi trả không có điều khoản cho thẻ bài.** Nhiều số hotline khác nhau. | Xem mục 3 |

## 2. Đáng học hỏi và chưa phù hợp

### Đáng học hỏi
| Tính năng | Từ | Lý do áp dụng cho JadeCard |
|---|---|---|
| Danh mục **dòng game → Single / Booster / Collection** | SaigonTCG, TGB | Khớp với cách người chơi TCG tìm hàng. SaigonTCG chứng minh mô hình thẻ lẻ có thị trường (hơn 21.000 sản phẩm). |
| **Tìm bằng mã thẻ, chuyển thẳng tới sản phẩm** | SaigonTCG | Người chơi thường biết mã thẻ. JadeCard áp dụng với số thẻ Pokémon (vd. `025/165`). Đây cũng chính là thông tin OCR đọc được trong Check thẻ. |
| **Hiển thị số lượng tồn chính xác** | SaigonTCG | Thẻ lẻ thường chỉ còn 1–2 bản, hiển thị số tồn giúp khách quyết định nhanh |
| Khối **cam kết** (video đóng gói và khui hàng) | TGB | Thẻ bài dễ cong, móp, thiếu thẻ. Video là bằng chứng giải quyết tranh chấp. JadeCard áp dụng cho cả **chiều thu mua** (quay video khi kiểm định thẻ khách gửi). |
| **Phí ship công khai** (SaigonTCG cố định 14k, HeroGame có bảng giá) | SaigonTCG, HeroGame | Khách biết tổng tiền trước khi đặt, giảm số đơn bị bỏ dở |
| **Nhận tại cửa hàng, giữ đơn 14 ngày** | SaigonTCG | Phù hợp với hàng giá trị cao. Cũng là điểm giao thẻ khi khách bán cho shop. |
| Tên sản phẩm có **mã set và ngôn ngữ** (vd. "ME05 Eng") | TGB | Người sưu tầm phân biệt bản Anh và bản Nhật rất kỹ |

### Chưa phù hợp với JadeCard
| Tính năng | Từ | Lý do không áp dụng |
|---|---|---|
| Bán nhiều ngành hàng (console, mô hình, Gundam...) | HeroGame | Làm loãng trải nghiệm TCG. JadeCard là shop chuyên biệt. |
| Đặt hàng xong chờ nhân viên gọi xác nhận, không có trạng thái đơn | SaigonTCG | Phụ thuộc nhân sự và giờ làm việc, khách không tự theo dõi được. JadeCard tạo đơn có mã và trạng thái, khách xem trong tài khoản. |
| Gom thông tin thẻ vào tên sản phẩm | SaigonTCG | Không lọc được và không đối chiếu được với dữ liệu giá. JadeCard lưu set, số thẻ, độ hiếm, tình trạng thành **các trường riêng**. |
| Tích điểm VIP | HeroGame | Hợp lý về kinh doanh nhưng không phải trọng tâm của MVP. Để giai đoạn sau. |
| Bán nhiều dòng TCG ngay từ đầu (8–10 dòng) | Cả 3 | Một người không đủ sức quản lý dữ liệu. MVP chỉ làm Pokémon, cấu trúc dữ liệu có trường `game` để mở rộng sau. |

## 3. Cơ hội cải tiến và điểm khác biệt của JadeCard

> Các "khoảng trống" dưới đây là **cơ hội quan sát được trên website** của 3 shop (ngày 07/11/2026). Khảo sát chưa xét kênh Facebook hay cửa hàng trực tiếp, và chưa xác nhận nhu cầu của khách hàng (xem phản biện PB01 trong [ai-analysis/02-phan-bien.md](ai-analysis/02-phan-bien.md) và [customer-survey.md](customer-survey.md)).

1. **Khoảng trống thẻ lẻ Pokémon.** **Không website đối thủ nào bán thẻ lẻ Pokémon**: TGB và HeroGame không bán thẻ lẻ, còn SaigonTCG có thẻ lẻ cho 8 dòng game khác nhưng mục "Pokemon Single" trống. Tìm "pikachu" trên TGB và SaigonTCG đều không ra kết quả. JadeCard lấp khoảng trống này bằng **nguồn hàng từ chính cộng đồng** thông qua thu mua.
2. **Khoảng trống định giá.** Không đối thủ nào giúp khách biết giá thẻ. Trên thế giới, app TCGplayer, Collectr hay Dragon Shield đã có tính năng quét thẻ, nhưng đó là app nước ngoài, giá tính bằng USD và **không gắn với một cửa hàng Việt Nam** để bán ngay. JadeCard: **quét → giá tham khảo VND → gửi yêu cầu bán cho shop** trong cùng một luồng.
3. **Khoảng trống niềm tin khi bán thẻ.** Không shop nào có kênh thu mua công khai. Người chơi hiện bán thẻ trong nhóm Facebook, không có giá chuẩn. JadeCard công khai **công thức giá thu mua** và **trạng thái kiểm định** từng bước.
4. **Thông tin thẻ có cấu trúc, có tình trạng thẻ.** Không đối thủ nào ghi tình trạng NM/LP. Thông tin set, độ hiếm, ngôn ngữ đang nằm trong tên hoặc đoạn mô tả, nên không lọc được.
5. **Quy trình đặt hàng tự phục vụ.** Khách tự theo dõi trạng thái đơn và yêu cầu bán, không phụ thuộc vào việc nhân viên gọi lại.

## 4. URL đã khảo sát

**TGB Store:** `/`, `/collections/pokemon-tcg`, `/products/151-alakazam-ex-collection-sv-scarlet-violet-151-mew`, `/cart`, `/search?q=pikachu`, `/pages/chinh-sach-giao-hang`, `/pages/chinh-sach-doi-tra`, `/pages/chinh-sach-thanh-toan`. Nền tảng: **Haravan** (footer ghi "Cung cấp bởi Haravan").

**SaigonTCG:** `/`, `/product-category/pokemon/` (cùng các mục con `pokemon-single`, `pokemon-starter-deck`, `pokemon-booster`, `pokemon-collection`), `/product-category/uncategorized/`, các trang Single Card của Digimon, One Piece, Lorcana, Shadowverse, CookieRun, Gundam, Riftbound, `/product/pokemon-tcg-me05-mega-evolution-pitch-black-booster-box/`, trang sản phẩm MAMO-EN094, tìm kiếm `?s=pikachu`, `?s=charizard`, `?s=Neos`, `?s=MAMO-EN094`, `/checkout/`, `/cach-thuc-mua-hang/`, `/gioi-thieu/`, `/lien-he/`, `/chuong-trinh-khuyen-mai/`, `/track-order/`, `/blog/`, `/wp-sitemap.xml`. Các trang trả về 404: `/pages/about/`, `/pages/contact/`, `/pages/our-stores/`, `/sport-shop/`. Nền tảng: **WordPress + WooCommerce** (có `wp-sitemap.xml`, `/product-category/`, `/checkout/`).

**HeroGame:** `/`, `/danh-muc/the-bai-tcg-pokemon`, `/tim-kiem/search?option=sanpham&keyword=pikachu`, `/don-hang/gio-hang`, `/the-bai-tcg-pokemon-mega-evolutions-blister-2-pack-zarude`, `/bai-viet/chinh-sach-doi-tra-hang`, `/bai-viet/phuong-thuc-giao-hang`, `/bai-viet/phuong-thuc-thanh-toan`. Nền tảng: có vẻ **tự xây dựng** (cấu trúc URL riêng, không khớp Haravan hay WooCommerce; chưa kết luận).
