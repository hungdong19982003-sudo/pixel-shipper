# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Dự án: Pixel Shipper: City Tales (Phố Cuối Ngày)

---

## 1. Tổng quan & Tầm nhìn Sản phẩm (Product Overview & Vision)
* **Tên dự án:** *Pixel Shipper: City Tales* (hoặc *Phố Cuối Ngày*)
* **Thể loại:** 2D Top-Down Life-Sim / Cozy Delivery RPG.
* **Phong cách đồ họa:** Pixel Art 16-bit / 32-bit mang âm hưởng Á Đông đương đại (Việt Nam / Đông Nam Á), bảng màu ấm áp, lấy cảm hứng từ mỹ thuật của *Stardew Valley*.
* **Góc nhìn (Camera):** Top-down trực diện (Orthographic Top-Down), camera bám theo nhân vật mượt mà (smooth lerp).
* **Tông cảm xúc (Mood & Tone):** Nhẹ nhàng, bình dị, hài hước, phản ánh chân thực cuộc sống mưu sinh của shipper công nghệ nhưng thư giãn, không gây áp lực thời gian tiêu cực (No stress / Cozy vibe).
* **Nền tảng mục tiêu:** PC (Steam), WebGL (Chạy mượt trên trình duyệt), Mobile (Android/iOS).

---

## 2. Đối tượng Người chơi & Mục tiêu Trải nghiệm (Target Audience & UX Goals)
* **Đối tượng:**
  * Người chơi yêu thích dòng game Cozy, Life-sim (*Stardew Valley*, *Dave the Diver*, *Coffee Talk*).
  * Người chơi thích đề tài đời thường đô thị, shipper công nghệ thân thuộc.
* **Cảm xúc mang lại:**
  * Cảm giác thỏa mãn khi lách xe êm qua ổ gà, bảo vệ nguyên vẹn tô phở nóng hổi.
  * Sự ấm lòng khi nhận tiền tip kèm review 5 sao từ khách hàng.
  * Cảm giác thư giãn khi kết thúc một ngày làm việc, trở về căn phòng trọ ấm cúng nghe nhạc lofi và vuốt mèo.

---

## 3. Vòng lặp Gameplay Cốt lõi (Core Loop)

```
[Phòng trọ buổi sáng]
        │
        ▼ (Bật App Driver trên điện thoại, nhận đơn)
[Lên xe máy & Di chuyển theo Mũi tên La bàn]
        │
        ▼ (Tới quán, xuống xe lấy đồ ăn - Bắt đầu tính độ nguyên vẹn)
[Lái xe luồn lách né ổ gà, vũng trơn & giữ độ nguyên vẹn]
        │
        ▼ (Tới điểm giao nhà khách, bấm bàn giao món)
[Nhận Tiền + EXP + Chấm Sao Đánh Giá + Đọc Review]
        │
        ▼ (Duy trì thể lực, đổ xăng, bảo dưỡng xe)
[Tối về phòng trọ: Ngủ hồi năng lượng, lưu game, vuốt mèo, sắm nội thất]
```

---

## 4. Chi tiết Yêu cầu Tính năng (Functional Requirements)

### 4.1. Module 1: Hệ thống Điều khiển & Nhân vật (Player Controller & States)
* **Trạng thái Đi bộ (On-Foot):**
  * Di chuyển 4/8 hướng bằng `WASD` hoặc phím mũi tên. Tốc độ cơ bản: $120\text{ px/s}$.
  * Phím `E`: Tương tác với cửa hàng, NPC, xe nhận đơn và vật thể gần người chơi.
  * Tự do đi trên vỉa hè, lòng đường, bước vào trong nhà/quán xá.
* **Trạng thái Lên xe (Mounted / Driving):**
  * Bấm `F` khi đứng gần xe để lên hoặc xuống xe; khi đang chạy phải giảm tốc trước khi xuống.
  * Tương tác đứng gần xe máy và bấm `E` để Lên/Xuống xe (Mount/Dismount).
  * Tốc độ tối đa tăng gấp $2.5 - 3.5$ lần ($300 - 420\text{ px/s}$).
  * Vật lý xe: Có gia tốc tăng tốc mượt mà, quán tính khi nhả ga, góc quay đầu theo hướng di chuyển và hiệu ứng trượt lết bánh (skid effect) khi phanh đổi hướng gấp.
  * Giới hạn: Xe máy chỉ chạy trên lòng đường và ngõ lớn, không thể phi xe vào nhà hẹp.

### 4.2. Module 2: Ứng dụng Giao hàng Smartphone (Driver App Flow)
* **Giao diện Điện thoại:**
  * Nút gọi phím tắt `Tab` hoặc icon điện thoại ở góc phải dưới màn hình.
  * Hiệu ứng trượt lên (Slide-up modal) mô phỏng smartphone hiện đại.
  * Nút gạt trạng thái **Online / Offline** nhận đơn.
  * **Danh sách đơn hàng (Order Cards):** Hiển thị quán ăn, món ăn, khoảng cách, cước phí cơ bản.
  * Thu nhỏ thành **Mini Order Widget** khi đang di chuyển trên đường để không chắn tầm nhìn.
* **Vòng đời Đơn hàng (Order Lifecycle):**
  * `Pending` (Chờ nhận trên app) $\rightarrow$ `Accepted` (Đã nhận đơn) $\rightarrow$ `Picked Up` (Đã tới quán lấy hàng) $\rightarrow$ `Delivering` (Đang trên đường giao) $\rightarrow$ `Delivered` (Giao thành công) $\rightarrow$ `Settled` (Quyết toán sao và tiền).

### 4.3. Module 3: Chướng ngại vật & Độ nguyên vẹn Món ăn (Hazard & Food Integrity Engine)
* **Chỉ số Độ nguyên vẹn (Integrity):**
  * Mặc định khi lấy hàng: $100\%$.
  * Giảm dần khi gặp chấn động và va quẹt mạnh.
* **Hệ thống Chướng ngại vật (Hazards):**
  * **Ổ gà (Pothole) / Gờ giảm tốc:** Xe chạy nhanh qua sẽ bị nảy xóc $\rightarrow$ Camera rung nhẹ, trừ $-10\%$ đến $-15\%$ độ nguyên vẹn. Đi chậm qua $(< 40\%$ tốc độ tối đa) không bị trừ.
  * **Vết dầu loang / Vũng nước trơn:** Khiến xe trượt bánh, chệch góc lái trong $1.5\text{s}$, nếu tông vào lề đường bị trừ $-20\%$.
  * **Chó chạy rông / Người sang đường:** Chạy cắt ngang đường $\rightarrow$ buộc người chơi phanh gấp, xô lệch $-5\%$.

### 4.4. Module 4: Hệ thống Định vị (Compass & Waypoint Navigation)
* **Mũi tên La bàn (Compass HUD):**
  * Mũi tên phát sáng neon xoay quanh nhân vật / widget chỉ thẳng góc về điểm đến (quán ăn hoặc nhà khách).
  * Hiển thị khoảng cách số mét thời gian thực ($m$).
  * Cho phép người chơi tự do tìm lối đi trong mạng lưới đường phố và ngõ hẻm Á Đông.

### 4.5. Module 5: Đánh giá Sao, Kinh tế & Đời sống (Rating & Economy)
* **Công thức Quyết toán:**
  $$\text{Tổng tiền nhận} = \text{Cước cơ bản} + \text{Tiền Tip (theo chất lượng)} + \text{Phụ phí}$$
* **Hệ thống Đánh giá Sao (Customer Review Matrix):**
  * **5 Sao ($\ge 90\%$):** $100\%$ cước + $30-50\%$ boa + $100\%$ EXP + Lời khen ngọt ngào ("Đồ ăn còn bốc khói, 10 điểm phục vụ!").
  * **4 Sao ($70\% - 89\%$):** $100\%$ cước + $10\%$ boa + $80\%$ EXP.
  * **3 Sao ($50\% - 69\%$):** $100\%$ cước, $0\%$ boa + $50\%$ EXP + Góp ý nhẹ ("Nước dùng bị sóng ra ngoài một ít rồi bác tài").
  * **1 Sao ($< 50\%$):** Trừ $50\%$ cước (bồi thường vỡ đổ) + $10\%$ EXP + Review bực bội ("Bánh nát bét không ăn nổi!").
* **Ví tiền & Cấp tài xế:** Tích lũy tiền mua xăng, mua thức ăn, trang trí phòng trọ, nâng cấp xe máy.

### 4.6. Module 6: Hệ sinh tồn Nhẹ (Cozy Vitals) - *Giai đoạn P1*
* **Đói (Hunger) - Khát (Thirst) - Năng lượng (Energy):**
  * Tiêu hao từ tốn, không tạo áp lực khẩn cấp kiểu Hardcore Survival.
  * Ghé quán trà đá vỉa hè mua nước khát, mua bánh mì ăn lót dạ.
* Về phòng trọ ngủ qua đêm để hồi $100\%$ năng lượng; chỉ bàn làm việc trong phòng mới ghi tiến trình.

### 4.7. Module 7: Thế giới Động (World, Day/Night & Weather) - *Giai đoạn P2*
* Chu kỳ ngày/đêm với bảng màu ánh sáng thay đổi (buổi sáng trong lành $\rightarrow$ chiều hoàng hôn cam $\rightarrow$ đêm phố thị lung linh ánh đèn).
* Thời tiết mưa rào: Đường trơn hơn, tăng tiền cước mưa $1.5\times$, tiếng mưa rơi êm đềm.

### 4.8. Module 8: Thành phố đông đúc và quan hệ xã hội - *Giai đoạn P4*
* Thành phố 6400 × 5120 px có dãy nhà ống và hàng quán sát nhau, đường đi thông tới mọi địa điểm giao hàng và dịch vụ. Hai cây xăng ở hai khu xa nhau đều cho đổ xăng và hiển thị trên bản đồ thu nhỏ.
* Người dân, khách nhận đơn và chó di chuyển ngoài phố; ô tô và xe máy chạy hai chiều, giảm tốc tại giao lộ và nhường người đi bộ. Người chơi có thể trò chuyện hoặc vuốt chó khi đứng gần.
* Mỗi quán trong danh sách nhận đơn có nội thất, người bán và quầy nhận món. Người chơi phải vào đúng quán, gặp người bán rồi lấy món ở quầy; có thể mua món trong menu để hồi chỉ số sinh tồn. Khách nhận đơn bước ra trước cửa, người chơi gặp đúng khách và giao qua hội thoại.
* Thiện cảm 0–100 tăng khi trò chuyện, mua món, lấy đơn và giao món chất lượng tốt. Chỉ nhận điểm trò chuyện một lần mỗi ngày; người bán quen giảm giá món, khách quen cho thêm tiền boa. Tiến trình quan hệ và đồ đã mua được lưu cùng ván chơi, bản lưu cũ vẫn đọc được.
* Hội thoại và điện thoại hỗ trợ bàn phím, chuột và cảm ứng; nội dung dài cuộn được, giao diện vừa màn hình nhỏ và không giữ kẹt nút điều hướng khi đóng.

### 4.9. Module 9: Túi đồ, Cài đặt và HUD - *Giai đoạn P5*
* Túi đồ đa dụng chứa tối đa 12 vật phẩm theo danh mục: đồ tiêu hao, nội thất, dụng cụ câu cá, cá và vật phẩm khác. Các món cùng loại được xếp chồng và dữ liệu được lưu cùng tiến trình.
* Mua nội thất qua điện thoại sẽ cất món vào túi. Trong phòng trọ, chọn Đặt để xem bóng xem trước; người chơi chọn vị trí trống trong phòng bằng chuột/cảm ứng hoặc xác nhận bằng `E`. Vị trí và quyền sở hữu được lưu.
* Tại quán, dùng món hồi chỉ số ngay; mua mang đi cất vào túi và hồi chỉ số khi dùng sau. Túi được thiết kế để nhận thêm dụng cụ câu cá và cá khi có hệ thống câu cá.
* Cài đặt là nơi bật/tắt âm thanh, bản đồ thu nhỏ, thời tiết và phím cảm ứng; kèm danh sách phím tắt. Mở túi bằng `B`, cài đặt bằng `O`, tương tác bằng `E`, lên/xuống xe bằng `F`, và đóng cửa sổ bằng `Esc`. Chỉ bàn làm việc trong phòng trọ mới lưu tiến trình; ngủ, giao hàng và mua đồ không tự lưu.
* HUD phía trên chỉ có hai thanh nền. Hàng đầu có Điện thoại ở góc trái, ngày/giờ/thời tiết, khu phố, Túi đồ và Cài đặt; hàng hai gom đơn hàng, chất lượng món, la bàn và buff. Đói/khát/năng lượng cùng tốc độ/xăng nằm phía dưới, cạnh bản đồ mà không chồng lên nhau. Khi mở điện thoại, tiền và điểm sao hiện trong thẻ hồ sơ.

### 4.10. Module 10: Cốt truyện, màn hình đầu game và bà chủ trọ - *Giai đoạn P6*
* Màn hình đầu game có **Chơi tiếp** để tải tiến trình và **Chơi mới** để bắt đầu lại. Cả hai đều bắt đầu trong phòng trọ; Chơi mới mở cốt truyện trước ngày đầu tiên.
* Cốt truyện theo chân Minh, cử nhân Công nghệ thông tin mới ra trường. Sau hai tháng tìm việc không thành, tiền sinh hoạt và tiền trọ gần cạn nên Minh đăng ký chạy giao hàng. Mỗi đoạn có tranh pixel art minh họa.
* Bà Hạnh, chủ nhà trọ, thu 80.000đ tiền trọ đúng một lần mỗi 7 ngày trong game; những lần ghé khác có thể càu nhàu lo lắng hoặc tặng hộp xôi. Quà được cất vào túi; nếu túi đầy thì nhân vật dùng ngay. Lịch ghé, ngày thu tiền và tiến độ truyện được lưu.

### 4.11. Module 11: Luật giao thông, cửa hàng và giao hàng chung cư - *Giai đoạn P7*
* Một số giao lộ có đèn tín hiệu xanh/đỏ đồng bộ với luồng xe. Vượt đèn đỏ lần đầu nhận nhắc nhở; từ lần thứ hai bị phạt 25.000đ mỗi lần. Số lần vi phạm được lưu.
* Mọi cửa hàng có cửa vào được bằng `E`. Cửa hàng dùng nội thất, người bán và luồng mua món hiện có; các cửa hàng đặt đơn vẫn giữ đúng tên và điểm nhận món.
* Đơn có địa chỉ căn hộ cho phép vào chung cư và giao tại cửa phòng. Đơn nhà phố vẫn giao với khách ở ngoài đường.

### 4.12. Module 12: Vòng chơi tuần đầu và kinh tế phụ - *Giai đoạn P9*
* Bảy ngày đầu của Minh có nhật ký ngắn theo ngày, hiện tại phòng trọ. Giao ít nhất một đơn trong ngày nhận thưởng 6.000đ khi ngủ qua đêm. Điện thoại hiển thị tiến độ và ngày đến hạn tiền trọ.
* Tiền trọ 80.000đ phát sinh mỗi bảy ngày. Xin khất giữ khoản nợ để trả sau; kỳ tiếp theo tiếp tục cộng tiền trọ. Thanh toán kỳ đầu mở đoạn kết tuần đầu và người chơi tiếp tục ván đang chơi.
* Đơn hàng có ba loại: thường, giao nhanh thưởng thêm nếu hoàn thành trong năm giờ game, và món dễ đổ thưởng thêm nếu độ nguyên vẹn còn ít nhất 90%. Điều kiện và thưởng được hiển thị trước khi nhận và trong quyết toán.
* Cá câu được có thể nấu tại phòng trọ để hồi chỉ số, bán cho quán ăn lấy tiền hoặc tặng cô Hạnh tăng thiện cảm. Mọi thay đổi ở ví, túi và quan hệ được ghi khi người chơi lưu tại bàn làm việc.

### 4.13. Module 13: Chọn đơn theo tuyến đường - *Giai đoạn P10*
* Khi online, điện thoại đưa ra ba lời mời cùng lúc: đơn thường ưu tiên tuyến gần, đơn giao nhanh ở khoảng giữa và đơn dễ đổ thường có tuyến xa hơn. Mỗi lời mời có quán, khách, món và cước riêng.
* Thẻ đơn hiển thị quãng đường dự kiến đi qua quán tới khách, thời gian game, xăng và sức cần dùng. Khi nguồn lực hiện tại quá thấp, điện thoại cảnh báo trước khi nhận. Đơn giao tới chung cư và khách quen được nhận biết trên thẻ.
* Cước tăng theo quãng đường từ quán tới khách. Hạn nhận thưởng giao nhanh được tính theo tuyến và tốc độ xe tại lúc nhận rồi giữ cố định; thời gian còn lại cập nhật trong lúc giao. Quyết toán chỉ cộng thưởng giao nhanh khi giao đúng hạn, còn đơn dễ đổ nhận thưởng theo độ nguyên vẹn món.

### 4.14. Module 14: Đơn cá tươi hằng ngày - *Giai đoạn P11*
* Mỗi ngày một quán cần mua một loại cá từ bến câu cuối ngõ; điện thoại nêu rõ loại cá, tên quán và tiền thưởng. Minh câu cá rồi tới đúng quầy để bán.
* Giao đúng yêu cầu nhận giá cá thường cộng 7.000đ và thêm thiện cảm với người bán, tối đa một lần mỗi ngày. Bán sai quán, sai cá hoặc bán tiếp sau khi hoàn thành vẫn nhận giá thường. Ngày mới có yêu cầu mới.
* Ngày hoàn thành được lưu tại bàn làm việc trong phòng trọ. Bản lưu cũ bắt đầu với yêu cầu ngày hiện tại chưa hoàn thành.

### 4.15. Module 15: Đơn ghép và giá nâng cấp - *Giai đoạn P12*
* Túi giữ nhiệt cấp 1/2/3 chở tối đa 1/2/3 đơn. Sau khi nhận đơn đầu tiên, điện thoại có thể mời tối đa hai đơn cùng quán, giao cho các khách ở gần nhau. Minh chỉ được ghép thêm trước khi lấy món và khi túi còn sức chứa.
* Tại quầy, người bán giao toàn bộ món của nhóm cùng lúc. Điện thoại cho chọn khách cần giao trước; la bàn và bản đồ đánh dấu mục tiêu đã chọn cùng các điểm giao còn lại. Mỗi món giữ chất lượng và hạn thưởng riêng. Giao xong một khách thì quyết toán đơn đó, sau đó tiếp tục các đơn còn lại.
* Giá túi cấp 2/3 là 180.000đ/460.000đ. Xe Lead 650.000đ, xe điện 1.500.000đ; giá đỡ điện thoại và nội thất cũng tăng giá. Đồ đã sở hữu trong bản lưu cũ vẫn thuộc về người chơi.

---

## 5. Tiêu chuẩn Kỹ thuật & Hiệu năng
* **Khung hình mục tiêu:** 60 FPS ổn định trên trình duyệt WebGL và Canvas.
* **Asset Loading:** Procedural Pixel Generator tải tức thì $0\text{ ms}$, không có màn hình loading lâu, không bị lỗi mạng 404 hình ảnh.
* **Âm thanh:** Tự động điều chỉnh âm lượng mượt qua Web Audio Synth, hỗ trợ bật/tắt âm thanh (Mute toggle).
