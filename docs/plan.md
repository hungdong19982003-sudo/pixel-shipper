# KẾ HOẠCH TRIỂN KHAI DỰ ÁN (PROJECT ROADMAP & TASKS)
## Dự án: Pixel Shipper: City Tales (Phố Cuối Ngày)

> **Hướng dẫn quản lý:**
> - Mỗi phase được chia nhỏ thành các task kỹ thuật cụ thể.
> - Sau khi thực hiện và kiểm thử thành công task nào, cập nhật dấu `[ ]` thành `[x]` ngay lập tức.
> - Không nhảy cóc các task có tính chất phụ thuộc (dependencies).

---

## TỔNG QUAN TIẾN ĐỘ DỰ ÁN

| Giai đoạn | Nội dung trọng tâm | Trạng thái | Tiến độ Task |
| :--- | :--- | :---: | :---: |
| **Phase 0** | Core MVP: Lái xe, Né vật cản, 1 Đơn hàng, Đánh giá sao | 🚀 Hoàn thành | 8/8 |
| **Phase 1** | Vòng lặp Mở rộng: Sinh tồn nhẹ, Phòng trọ, Cây xăng, Minimap | 🚀 Hoàn thành | 6/6 |
| **Phase 2** | Nội dung RPG: Chu kỳ ngày/đêm, Thời tiết mưa, Nuôi mèo, Nâng cấp xe | 🚀 Hoàn thành | 6/6 |
| **Phase 3** | Mở rộng thành phố và hoàn thiện giao diện | 🚀 Hoàn thành | 2/2 |
| **Phase 4** | Phố đông đúc, NPC, nội thất quán ăn và thiện cảm | 🚀 Hoàn thành | 4/4 |
| **Phase 5** | Túi đồ, cài đặt và HUD gọn gàng | 🔨 Đang làm | 0/3 |
| **Phase 6** | Cốt truyện mở đầu, menu và bà chủ trọ | 🔨 Đang làm | 0/2 |
| **Phase 7** | Luật giao thông, cửa hàng mở cửa và giao hàng chung cư | 🚀 Hoàn thành | 2/2 |
| **Phase 8** | Bến câu cuối ngõ và khu câu cá thư giãn | 🚀 Hoàn thành | 1/1 |
| **Phase 9** | Vòng chơi 7 ngày, đơn có lựa chọn và kinh tế câu cá | 🚀 Hoàn thành | 3/3 |
| **Phase 10** | Chọn đơn theo tuyến đường, chi phí và độ khó | 🚀 Hoàn thành | 2/2 |
| **Phase 11** | Đơn cá tươi hằng ngày nối bến câu với quán ăn | 🚀 Hoàn thành | 1/1 |
| **Phase 12** | Đơn ghép và cân bằng giá cửa hàng | 🚀 Hoàn thành | 2/2 |
| **Phase 13** | Phát hành game để người khác chơi | 🚀 Hoàn thành | 1/1 |

---

## CHI TIẾT CÁC PHASE & TASKS

### 📍 PHASE 0: CORE MVP SLICE (Cốt lõi Gameplay)
*Mục tiêu: Xây dựng bản chơi được hoàn chỉnh vòng lặp giao hàng đầu tiên: Lên xe máy -> Nhận đơn trên smartphone -> Đi theo la bàn đến quán -> Né ổ gà bảo vệ đồ ăn -> Giao cho khách -> Chấm điểm nhận thưởng.*

- [x] **Task 0.1: Cấu hình Dự án & Thư viện Phaser 3**
  - Cài đặt và cấu hình thư viện `phaser` tương thích TypeScript & Vite.
  - Thiết lập Canvas full màn hình với CSS căn giữa responsive, cấu hình physics Arcade.
  - *Kiểm thử:* Chạy dev server không có lỗi biên dịch, hiển thị màn hình game trống sẵn sàng nạp Scene.

- [x] **Task 0.2: Trình sinh Texture Procedural Pixel Art (`AssetGenerator.ts`)**
  - Xây dựng hệ thống vẽ pixel art bằng Canvas code (nhân vật shipper áo xanh, xe máy wave 4 hướng, gạch vỉa hè, mặt đường nhựa, quán phở, nhà dân Á Đông, ổ gà, vũng nước trơn).
  - Đăng ký toàn bộ textures vào Phaser Texture Manager trong `BootScene`.
  - *Kiểm thử:* Render thử nghiệm các sprite lên màn hình sắc nét chuẩn phong cách 16-bit, không nhòe pixel.

- [x] **Task 0.3: Bản đồ Phố phường Á Đông (`CityScene.ts`)**
  - Dựng bản đồ khu phố (đường nhựa chính, ngã tư, ngõ hẹp, vỉa hè lát gạch, hàng cây, quán xá).
  - Phân chia layer lòng đường (cho phép xe chạy) và vỉa hè/chướng ngại vật (va chạm chắn đường).
  - *Kiểm thử:* Camera cuộn mượt mà theo nhân vật, ranh giới va chạm hoạt động chính xác.

- [x] **Task 0.4: Hệ thống Điều khiển & Máy trạng thái Nhân vật (`Player.ts`)**
  - Trạng thái Đi bộ (`ON_FOOT`): Di chuyển 4/8 hướng bằng WASD/Mũi tên, tốc độ chuẩn.
  - Đỗ xe máy tại một điểm ban đầu trên bản đồ.
  - Phím `F`: Lên/Xuống xe máy mượt mà khi đứng gần xe; `E` dành cho tương tác.
  - Trạng thái Lái xe (`MOUNTED`): Tăng tốc, quán tính khi nhả ga, lết bánh nhẹ (skid mark) khi phanh gấp.
  - *Kiểm thử:* Thao tác lên/xuống xe mượt, cảm giác lái xe có gia tốc tự nhiên và trượt nhẹ đúng chất RPG.

- [x] **Task 0.5: Hệ thống Chướng ngại vật & Độ nguyên vẹn Món ăn (`HazardSystem.ts`)**
  - Đặt các ổ gà và vũng nước trơn ngẫu nhiên trên tuyến đường.
  - Cơ chế Ổ gà: Đi nhanh qua xe nảy lên, rung camera, trừ $-10\%$ đến $-15\%$ độ nguyên vẹn; đi chậm qua không bị trừ.
  - Cơ chế Vũng trơn: Xe mất lái trượt xoay góc trong $1.5\text{s}$, nếu đâm vào lề trừ $-20\%$.
  - Thanh hiển thị Food Integrity Bar (100% -> 0%) đổi màu xanh/vàng/đỏ.
  - *Kiểm thử:* Lái xe qua ổ gà ở tốc độ cao thấy rung màn hình và thanh chất lượng đồ ăn sụt giảm chính xác.

- [x] **Task 0.6: Ứng dụng Giao hàng Smartphone & Vòng đời Đơn hàng (`PhoneUI.ts`)**
  - Thiết kế Smartphone UI mô phỏng app tài xế ở góc phải màn hình, bật/tắt bằng phím `Tab` hoặc icon.
  - Nút gạt Online / Offline nhận đơn.
  - Card hiển thị đơn hàng: Quán Phở Bò Gia Truyền -> Khách hàng tại Chung Cư Xanh, cước phí 25.000 VNĐ.
  - Vòng đời: Nhận đơn -> Đi tới quán bấm `E` lấy món -> Chở tới điểm khách bấm `E` bàn giao.
  - Thu nhỏ thành Mini Order Widget trên HUD khi đang lái xe để không cản trở tầm nhìn.
  - *Kiểm thử:* Nhận đơn thành công, các trạng thái cập nhật chính xác theo bước chân người chơi.

- [x] **Task 0.7: Hệ thống Mũi tên La bàn Định vị (`CompassHUD.ts`)**
  - Mũi tên neon chỉ hướng trực quan xoay theo góc thực tế hướng về Quán ăn (khi chưa lấy hàng) hoặc Nhà khách (khi đang giao).
  - Đồng hồ đo khoảng cách số mét thời gian thực.
  - *Kiểm thử:* Mũi tên luôn xoay mượt mà chỉ đúng mục tiêu, số mét giảm dần khi tiến lại gần.


- [x] **Task 0.8: Bảng Quyết toán Đánh giá Sao & Âm thanh Web Audio Synth**
  - Bảng Modal Đánh giá 5 Sao xuất hiện khi giao đồ xong:
    - Hiệu ứng sao rơi, tính tiền cước + tiền boa dựa trên % độ nguyên vẹn còn lại.
    - Hiển thị bình luận của khách hàng tương ứng với số sao.
    - Cộng tiền vào ví tài xế.
  - Tích hợp âm thanh Web Audio Synth: Tiếng nổ máy xe, còi bim bim, tiếng nổ đơn ting-ting, tiếng đồ ăn xóc lộc cộc, keng keng tiền rơi và giai điệu Lofi êm đềm.
  - *Kiểm thử:* Chơi trọn vẹn 1 vòng: Nhận đơn -> Lái xe lấy phở -> Tránh ổ gà -> Giao hàng -> Nghe âm thanh đầy đủ -> Nhận thưởng 5 sao.

---

### 📍 PHASE 1: VÒNG LẶP MỞ RỘNG & SINH TỒN NHẸ (Life-Sim & Housing)
*Mục tiêu: Đưa người chơi vào nhịp sống thường nhật của một tài xế công nghệ với phòng trọ, thanh thể lực và quản lý xăng xe.*

- [x] **Task 1.1: Hệ sinh tồn nhẹ (Vitals: Đói, Khát, Năng lượng)**
  - Tích hợp 3 thanh chỉ số tụt chậm rãi theo thời gian làm việc.
  - Quán trà đá vỉa hè hồi Khát, gánh bánh mì/quán cơm bình dân hồi Đói.

- [x] **Task 1.2: Căn phòng trọ Ấm cúng (Home Base)**
  - Bản đồ nội thất phòng trọ: Giường ngủ, bàn nhỏ, ban công nhìn ra phố.
  - Ngủ qua đêm: Phục hồi $100\%$ thể lực, chuyển sang ngày làm việc mới.

- [x] **Task 1.3: Hệ thống Lưu tiến trình (Save Game / LocalStorage)**
  - Lưu tiền, điểm sao, ngày chơi và trạng thái khi người chơi đứng cạnh bàn làm việc trong phòng trọ; Chơi tiếp luôn bắt đầu từ phòng trọ.

- [x] **Task 1.4: Quản lý Nhiên liệu & Cây xăng**
  - Bình xăng xe máy tiêu hao dần khi tăng ga chạy xe.
  - Ghé cây xăng bên đường bấm `E` bơm đầy bình với chi phí hợp lý.

- [x] **Task 1.5: Bản đồ thu nhỏ Radar (Minimap)**
  - Radar thu nhỏ góc trên màn hình hiển thị toàn cảnh các con phố, vị trí xe, quán ăn và khách hàng.

- [x] **Task 1.6: Hệ thống Đơn hàng Đa dạng (Order Generator)**
  - Tự động sinh ngẫu nhiên các đơn hàng mới với quán ăn khác nhau (Trà sữa, Cơm tấm, Pizza, Bún chả) và độ nhạy cảm chấn động khác nhau.

---

### 📍 PHASE 2: THẾ GIỚI ĐỘNG & NỘI DUNG RPG (Dynamic World & Polish)
*Mục tiêu: Làm cho thế giới sống động, giàu cảm xúc và gắn bó lâu dài.*

- [x] **Task 2.1: Chu kỳ Ngày & Đêm (Day/Night Lighting)**
  - Ánh sáng môi trường chuyển đổi từ Ban ngày -> Hoàng hôn -> Đêm tối phố lên đèn.
  - Giờ cao điểm trưa & tối đơn hàng nổ dồn dập.

- [x] **Task 2.2: Hệ thống Thời tiết Mưa rơi (Rain & Slick Roads)**
  - Hiệu ứng mưa rơi hạt lấp lánh, mặt đường trơn trượt hơn, phụ phí đơn hàng tăng $1.5\times$.

- [x] **Task 2.3: Hệ thống Nuôi mèo tại Phòng trọ (Pet System)**
  - Cho mèo ăn, vuốt ve mèo mỗi sáng nhận buff may mắn (tăng tỉ lệ khách tip tiền).

- [x] **Task 2.4: Mua sắm & Nâng cấp Phương tiện**
  - Mua xe mới: Xe số Wave cũ -> Xe tay ga Scooter êm ái -> Xe máy điện hiện đại.
  - Nâng cấp Balo giữ nhiệt chống nguội món, giá treo điện thoại cảm ứng nhạy hơn.

- [x] **Task 2.5: Trang trí Căn phòng trọ (Furniture Customization)**
  - Mua sắm nệm mới, cây cảnh, máy pha cà phê, dàn loa nhạc lofi chill.

- [x] **Task 2.6: Tối ưu Hóa Đóng gói & Phát hành (Web / PWA / Desktop)**
  - Tối ưu kích thước bundle, hỗ trợ phím điều khiển trên điện thoại cảm ứng (Touch D-pad) và đóng gói sẵn sàng.

---

### 📍 PHASE 3: MỞ RỘNG & LÀM ĐẸP THÀNH PHỐ

- [x] **Task 3.1: Thành phố lớn với các dãy nhà và hàng quán đa dạng**
  - Mở rộng thế giới từ 2400 × 1800 lên 6400 × 5120, chia thành các ô phố có đường nối liền.
  - Thêm nhà ống nhiều màu, chung cư, mặt tiền cửa hàng, công viên và đồ trang trí vỉa hè.
  - Tăng số quán nhận đơn và địa chỉ giao hàng; cập nhật minimap, tên khu phố và cửa ra phòng trọ.
  - Dùng tilemap để giới hạn số lượng nền được vẽ trong mỗi khung hình.
  - Sửa việc phím E bị đọc hai lần giữa Player/CityScene và tạo nhân vật phòng trọ trước khi đăng ký collider.
  - *Kiểm thử:* Build TypeScript/Vite; kiểm tra đường đi đến mọi điểm tương tác, vật lý, hiển thị các khu vực và minimap.
  - *Kết quả:* 408 công trình, 92 cửa hàng, 4 công viên, 329 đồ trang trí; 27/27 điểm tương tác có đường đi. Kiểm thử trên Chrome: đi bộ, lên/xuống xe, lái xe, điện thoại, nhận/giao hàng, nhận thưởng, ra/vào phòng trọ và giới hạn camera đều đạt, không có lỗi JavaScript.

- [x] **Task 3.2: HUD rõ ràng và điện thoại cuộn được**
  - Sắp xếp các thanh chỉ số và nút chức năng theo hàng, không đè lên nhau; đưa tên khu phố vào UIScene để không bị camera phóng to.
  - Điện thoại có header/tab cố định, danh sách cuộn bằng chuột và cảm ứng, chữ gọn và nội dung dài tự xuống dòng.
  - Thẻ đơn hàng, xe, trang bị và nội thất tách nội dung mô tả khỏi nút bấm; giữ vị trí cuộn từng tab.
  - *Kiểm thử:* Build và kiểm tra trực tiếp HUD, cuộn hai chiều, kéo bằng chuột/cảm ứng, đổi tab và thao tác với các thẻ ở cuối danh sách.
  - *Kết quả:* Các vùng HUD và chữ không chồng/tràn, kể cả cảnh báo thể lực/xăng, buff mèo và đơn hàng dài. Cuộn chuột, kéo chuột, vuốt cảm ứng, giữ vị trí cuộn khi đổi tab/đóng mở, mua nội thất/nâng cấp và nhận đơn cuối danh sách đều đạt. Điện thoại nằm trong canvas sau khi đổi sang màn hình 844 × 390; đóng menu khôi phục gameplay, không giữ kẹt nút cảm ứng, không có lỗi JavaScript.
  - Phím lưu nhanh đổi sang L, không trùng phím S của WASD.

---

### 📍 PHASE 4: ĐỜI SỐNG PHỐ PHƯỜNG & GIAO TIẾP

- [x] **Task 4.1: Dãy nhà sát nhau và hai cây xăng xa nhau**
  - Tăng mật độ công trình, giữ thông đường và cửa tương tác.
  - Hai cây xăng ở khu tây bắc và đông nam; cùng hỗ trợ đổ xăng và hiển thị minimap.
  - *Kết quả:* 624 công trình, 136 cửa hàng; 28/28 điểm tương tác có đường đi. Hai cây xăng cách nhau hơn 4.000 px, kiểm thử trực tiếp đều đổ đầy bình từ 40% với phí 21.000đ, ưu tiên dịch vụ khi NPC đứng cạnh.
- [x] **Task 4.2: Người đi bộ, xe cộ và chó trên phố**
  - NPC đi bộ, chó và xe chạy có tuyến đường; phanh/né người chơi, tránh chen vào công trình.
  - Tương tác nói chuyện với người dân, vuốt chó; đồ họa/âm thanh và giới hạn số thực thể.
  - *Kết quả:* 77 NPC (người đi đường, khách nhận đơn và chó) cùng 78 xe máy/ô tô; xe di chuyển, giữ khoảng cách và nhường đường. NPC được kích hoạt gần camera; trò chuyện với người dân và vuốt chó đã kiểm thử trực tiếp.
- [x] **Task 4.3: Thiện cảm và lưu tiến trình xã hội**
  - Thiện cảm với người bán, khách hàng và người dân; nói chuyện mỗi ngày, mua món và giao hàng tăng thiện cảm.
  - Khách quen tip thêm, quán quen giảm giá; lưu/load thiện cảm và các vật phẩm đã mua, tương thích save cũ.
  - *Kết quả:* Nói chuyện giới hạn một lần/ngày, mua món/giao đơn tăng thiện cảm; các mốc khách quen cộng boa hoặc giảm 5–10% giá món. Đã kiểm thử giao dịch, lưu/tải tiến trình và đọc bản lưu cũ.
- [x] **Task 4.4: Vào quán, nói chuyện, mua món và lấy đơn**
  - Nội thất cho mọi quán nhận đơn; xuống xe vào quán, tới người bán mở hội thoại/menu.
  - Chỉ lấy món đúng đơn tại quầy bên trong; mua món hồi thể lực; khách xuống trước cửa nhận hàng qua hội thoại.
  - *Kiểm thử chung:* Build, kiểm tra đường đi, NPC/giao thông, toàn bộ quán/cây xăng, mua món/thiện cảm/save cũ, chuột/cảm ứng và vòng giao hàng trọn vẹn.
  - *Kết quả:* Cả 11 quán có nội thất và người bán; đã kiểm thử vào quán, mua món, chặn lấy đơn từ ngoài/sai quán, lấy tại quầy, giao cho đúng khách khi khách bước ra, quyết toán một lần, lưu tiến trình, điều khiển cảm ứng và hội thoại trên màn hình 844 × 390. `npm run build`, `npm run check:city`, `npm run check:social` đều đạt; trình duyệt không báo lỗi JavaScript.

---

### 📍 PHASE 5: TÚI ĐỒ, CÀI ĐẶT & HUD

- [ ] **Task 5.1: Túi đồ đa dụng và lưu theo tiến trình**
  - Túi đồ chứa vật phẩm theo danh mục như đồ ăn, nội thất, dụng cụ câu cá và cá; món cùng loại được xếp chồng.
  - Mua nội thất sẽ cất vào túi; chọn Đặt rồi bấm vị trí trống trong phòng để lưu vị trí món.
  - Món ăn mang đi dùng để hồi chỉ số; mua và dùng tại quán hồi chỉ số ngay. Bản lưu cũ khởi tạo túi trống và giữ nội thất đã có.
- [ ] **Task 5.2: Cài đặt và phím tắt**
  - Gom bật/tắt âm thanh, bản đồ, thời tiết và phím cảm ứng vào cửa sổ Cài đặt.
  - Hiển thị bảng phím tắt tại đây; lưu game chỉ thực hiện bằng `E` ở bàn làm việc trong trọ. `F` lên/xuống xe; `E` tương tác.
- [ ] **Task 5.3: Sắp xếp lại HUD**
  - Giữ đúng hai thanh nền HUD phía trên: hàng đầu có Điện thoại, ngày/giờ/thời tiết, khu phố, Túi đồ và Cài đặt; hàng hai gom đơn hàng, chất lượng món, la bàn và buff vào cùng một thanh.
  - Đưa đói/khát/năng lượng cùng tốc độ/xăng xuống cạnh dưới, không che bản đồ. Tiền và sao phải thấy trong phần đầu điện thoại.
  - *Tiến độ hiện tại:* Đã triển khai mã cho 3 mục; `npm run build` (TypeScript + Vite) đạt. Chưa kiểm tra thao tác trực tiếp trong trình duyệt nên giữ các checkbox ở `[ ]`.

---

### 📍 PHASE 6: CỐT TRUYỆN, MENU VÀ BÀ CHỦ TRỌ

- [ ] **Task 6.1: Mở đầu có tranh minh họa khi Chơi mới**
  - Kể chuyện Minh tốt nghiệp Công nghệ thông tin, tìm việc hai tháng không thành, cạn tiền và quyết định chạy ship.
  - Tạo tranh pixel art theo từng đoạn; chỉ phát phần mở đầu khi chọn Chơi mới rồi bắt đầu ván ở phòng trọ.
- [ ] **Task 6.2: Menu đầu game và bà chủ trọ có sự kiện**
  - Có Chơi tiếp (nạp tiến trình) và Chơi mới (mở cốt truyện); cả hai bắt đầu trong phòng trọ. Chỉ bàn làm việc trong trọ mới lưu tiến trình.
  - Bà Hạnh thu 80.000đ đúng mỗi 7 ngày trong game; những lần ghé khác có thể càu nhàu hoặc tặng món ăn. Lưu lịch ghé và ngày thu tiền cùng tiến trình.
  - *Tiến độ hiện tại:* Đã triển khai scene, tranh và lịch sự kiện; `npm run build` đạt. Chưa kiểm tra thao tác thực tế trong trình duyệt nên giữ checkbox `[ ]`.

---

### 📍 PHASE 7: GIAO THÔNG VÀ ĐIỂM ĐẾN CÓ THỂ VÀO

- [x] **Task 7.1: Đèn tín hiệu và xử phạt vượt đèn đỏ**
  - Hiển thị đèn xanh/đỏ tại một số giao lộ; lần vượt đầu nhắc nhở, lần thứ hai trở đi trừ tiền phạt.
  - Lưu số lần vi phạm cùng tiến trình; kiểm tra pha đèn và khoản phạt trong gameplay.
  - *Bố cục:* Mỗi giao lộ có hai cụm đèn tạo góc chữ L ở phía tây và phía bắc; đầu đèn phía bắc xoay ngang, bóng đỏ vẫn nhận ra khi chưa sáng. Đã kiểm tra trực quan trong trình duyệt.
- [x] **Task 7.2: Vào mọi cửa hàng và giao tận cửa chung cư**
  - Mở cửa hàng theo loại công trình; tạo nội thất sảnh chung cư để người chơi vào/ra.
  - Đơn địa chỉ chung cư giao tại cửa căn hộ; đơn nhà phố vẫn giao ngoài đường.
  - *Tiến độ hiện tại:* Đã kiểm tra trực tiếp trong Chrome: lần đầu vượt đèn chỉ nhắc, lần hai trừ 25.000đ; vào được cửa hàng tổng quát và giao được đơn căn hộ ở chung cư. `npm run build`, `npm run check:city`, `npm run check:social` đều đạt.

---

### 📍 PHASE 8: BẾN CÂU CUỐI NGÕ

- [x] **Task 8.1: Mở lối xuống hồ câu và thêm vòng lặp câu cá**
  - Thêm lối đi phía nam nhà trọ để chuyển giữa thành phố và bản đồ hồ câu riêng.
  - Dựng bờ hồ pixel art yên bình, cầu gỗ, chòi nghỉ và cây cỏ theo tông cozy life-sim.
  - Cho Minh mượn cần câu lần đầu; nhấn `E` thả câu, đợi phao rung rồi nhấn `E` kéo cá vào túi đồ.
  - Lưu cá trong `PlayerStats.inventory`; kiểm tra túi đầy, đường vào/ra, điều khiển bàn phím và cảm ứng.
  - *Kết quả:* Đã kiểm tra chuyển phố ↔ hồ, thả câu/bắt cá bằng `E`, cá vào túi, báo túi đầy ở 12 ô; bàn phím và D-pad/nút `E` cảm ứng di chuyển/tương tác được. Mở túi đồ tạm dừng hồ và đóng túi tiếp tục bình thường. `npm run build` đạt, trình duyệt không có lỗi JavaScript.

---

### 📍 PHASE 9: TUẦN ĐẦU CỦA MINH & KINH TẾ LIÊN THÔNG

- [x] **Task 9.1: Vòng chơi và câu chuyện 7 ngày**
  - Mỗi ngày đầu có một đoạn nhật ký trong phòng trọ, mục tiêu giao một đơn/ngày và thưởng khi ngủ qua đêm.
  - Điện thoại hiện tiến độ ngày và kỳ tiền trọ. Cô Hạnh tính 80.000đ mỗi 7 ngày; khi khất, nợ giữ lại và tiếp tục được nhắc tới lúc trả. Thanh toán tuần đầu mở đoạn kết ngắn rồi tiếp tục ván chơi.
  - *Kiểm thử:* Trình duyệt hiển thị nhật ký ngày 1/ngày 7, hội thoại thu trọ và đoạn kết; `npm run check:week` kiểm tra thưởng chỉ phát một lần, nợ không mất khi khất, cộng kỳ ngày 14 và save cũ.
- [x] **Task 9.2: Ba kiểu đơn giao hàng**
  - Đơn thường, giao nhanh có thưởng theo giờ game và món dễ đổ có thưởng khi độ nguyên vẹn đạt 90%.
  - Thẻ đơn nêu rõ điều kiện trước khi nhận; bảng quyết toán tính và hiển thị thưởng riêng.
  - *Kiểm thử:* Trình duyệt hiển thị thẻ giao nhanh và thời gian còn lại; kiểm tra ranh giới thưởng đúng giờ/trễ và món còn 90%/89%. `npm run build` đạt.
- [x] **Task 9.3: Cá trở thành tài nguyên trong kinh tế và quan hệ**
  - Cá trong túi có thể nấu ở phòng trọ để hồi đói/sức, bán cho quán ăn để kiếm tiền hoặc tặng cô Hạnh để tăng thiện cảm.
  - *Kiểm thử:* Trình duyệt nấu cá giảm số lượng trong túi và hồi chỉ số; tặng cá tăng thiện cảm mà không xóa nợ trọ. `npm run check:week` kiểm tra thêm bán cá, giao dịch khi hết cá và lưu/tải trạng thái.

---

### 📍 PHASE 10: LỰA CHỌN ĐƠN GIAO HÀNG CÓ TÍNH TOÁN

- [x] **Task 10.1: Ba lời mời đơn có tuyến và cước hợp lý**
  - Luôn cho chọn ba loại đơn thường, giao nhanh và dễ đổ khi online. Ưu tiên một tuyến ngắn gần Minh; cước phản ánh quãng từ quán tới khách.
  - Điện thoại hiển thị quãng đường qua quán đến khách, thời gian, xăng và sức dự kiến; cảnh báo khi chỉ số hiện tại có thể không đủ.
  - *Kiểm thử:* Kiểm tra dữ liệu ba lời mời, cước tuyến ngắn/dài, dự báo chỉ số và bố cục trên màn hình nhỏ.
  - *Kết quả:* Điện thoại trong trình duyệt hiện cùng lúc đơn gần 545m, đơn nhanh 1.113m và đơn dễ đổ 1.335m; kiểm tra bố cục 844 × 390 và dự báo xăng/sức. `npm run check:delivery` đạt.
- [x] **Task 10.2: Hạn giao nhanh theo tuyến thực tế và quyết toán**
  - Thời hạn thưởng giao nhanh được chốt lúc nhận dựa trên quãng đường, không đổi khi Minh di chuyển; đồng hồ chỉ chạy trong lúc thành phố hoạt động.
  - Thẻ đơn đang chạy hiển thị thời gian còn lại; bảng quyết toán cộng thưởng đúng hạn và thưởng giữ món đúng chất lượng.
  - *Kiểm thử:* Kiểm tra hạn tuyến ngắn/dài, thưởng đúng ranh giới, nhận/giao đơn và quyết toán trong trình duyệt.
  - *Kết quả:* Nhận đơn nhanh trong trình duyệt chốt hạn 5 giờ; đổi vị trí Minh làm dự báo tuyến thay đổi nhưng hạn vẫn giữ nguyên. Kiểm tra thưởng trước/sau hạn 8.000đ/0đ; mở bảng quyết toán mô phỏng bước giao cho thấy cước 36.600đ và tổng 59.600đ. `npm run build`, `npm run check:city`, `npm run check:social`, `npm run check:week`, `npm run check:delivery` đều đạt; không có lỗi JavaScript trong trình duyệt.

---

### 📍 PHASE 11: ĐƠN CÁ TƯƠI HẰNG NGÀY

- [x] **Task 11.1: Quán đặt mua cá từ bến câu**
  - Điện thoại thông báo loại cá, quán mua và tiền thưởng đổi theo ngày. Minh câu cá ở bến, đem đúng loại tới quầy của đúng quán để nhận thưởng thêm và thiện cảm; chỉ nhận thưởng một lần mỗi ngày.
  - Bán cá thường ở các quán vẫn hoạt động. Lưu ngày đã hoàn thành tại bàn làm việc; bản lưu cũ mặc định chưa hoàn thành. Kiểm tra giao dịch đúng/sai quán, nhận thưởng lặp, ngày mới và giao diện điện thoại trong trình duyệt.
  - *Kết quả:* Ngày 1 điện thoại báo quán Cơm Tấm cần cá rô đồng; tại quầy, bán đúng cá được 16.000đ gồm 7.000đ thưởng, thiện cảm +6 và điện thoại đổi sang trạng thái hoàn thành. Đã kiểm tra màn hình 844 × 390, không có lỗi JavaScript. `npm run build`, `npm run check:city`, `npm run check:social`, `npm run check:week`, `npm run check:delivery` đều đạt; bài kiểm tra bao gồm bán sai quán, thưởng một lần, đổi ngày và lưu/tải bản cũ.

---

### 📍 PHASE 12: ĐƠN GHÉP VÀ CÂN BẰNG GIÁ

- [x] **Task 12.1: Nhận, lấy và giao 2–3 đơn ghép theo cấp túi giữ nhiệt**
  - Túi cấp 1/2/3 chở tối đa 1/2/3 đơn. Sau khi nhận đơn đầu, điện thoại mời ghép đơn cùng quán với các khách gần nhau; chỉ nhận thêm trước khi lấy món và khi còn chỗ.
  - Lấy các món cùng lúc tại quầy; chọn mục tiêu giao trên điện thoại, la bàn và khách nhận đi theo mục tiêu. Mỗi món có chất lượng, hạn giao và bảng quyết toán riêng; nhóm kết thúc khi giao hết.
  - Kiểm tra từ chối khi túi chưa đủ cấp, khách xa/sai quán, đồng hồ và chất lượng từng món, luồng nhận/lấy/giao/quyết toán trên trình duyệt.
  - *Kết quả:* Trình duyệt chặn ghép khi túi cấp 1, nhận 2/2 khi cấp 2, nhận 3/3 khi cấp 3; từ chối quán khác, khách xa và giao sai khách. Đã lấy 3 món ở một quầy, chọn mục tiêu giao, kiểm tra mỗi món bị trừ riêng 86%/72%/58% và quyết toán cả ba lần, ví tăng theo từng đơn rồi danh sách mới xuất hiện. Hạn thưởng của hai đơn mô phỏng lần lượt 2/4 giờ cho kết quả 0đ/8.000đ tại mốc 3 giờ. Giao diện điện thoại 844 × 390 và console trình duyệt đạt.
- [x] **Task 12.2: Tăng giá xe, phụ kiện và nội thất**
  - Điều chỉnh giá theo thu nhập từ giao hàng, tiền trọ và thưởng phụ; cấp túi 2/3 trở thành khoản đầu tư để mở 2/3 đơn. Điện thoại hiển thị rõ sức chứa và giá mới.
  - Kiểm tra giao dịch đủ/thiếu tiền và build; quyền sở hữu từ bản lưu cũ vẫn giữ nguyên.
  - *Kết quả:* Túi cấp 2/3 giá 180.000đ/460.000đ; Lead 650.000đ, xe điện 1.500.000đ, giá đỡ 130.000đ/330.000đ, nội thất 110.000–360.000đ. Trình duyệt xác nhận thiếu tiền không mua được, trả đúng giá để nhận xe và bonsai vào túi. `npm run build`, `npm run check:city`, `npm run check:social`, `npm run check:week`, `npm run check:delivery` đều đạt. Bản lưu cũ vẫn giữ cấp túi và quyền sở hữu đã có.

---

### 📍 PHASE 13: PHÁT HÀNH WEB

- [x] **Task 13.1: Đưa mã nguồn lên GitHub và phát hành bằng GitHub Pages**
  - Tạo repository Public `hungdong19982003-sudo/pixel-shipper`, đẩy nhánh `main` và chạy workflow build/deploy.
  - *Kiểm thử:* `npm run build` đạt; GitHub Actions hoàn thành thành công. Trang `https://hungdong19982003-sudo.github.io/pixel-shipper/` và các asset JavaScript/CSS trả về HTTP 200.
