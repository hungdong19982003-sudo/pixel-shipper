# KIẾN TRÚC KỸ THUẬT (TECHNICAL ARCHITECTURE)
## Dự án: Pixel Shipper: City Tales

---

## 1. Tổng quan Kiến trúc (Architecture Overview)

Dự án được xây dựng theo mô hình **Entity-Component & State Pattern** trên nền tảng **Phaser 3 Game Engine** kết hợp với **TypeScript** và **Vite**. Kiến trúc tách bạch giữa **Core Simulation Loop (Game World)** và **Application Layer (Smartphone UI & Sound FX)**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PHASER 3 ENGINE                               │
├────────────────────────────────┬───────────────────────────────────────┤
│          CITY SCENE            │               UI SCENE                │
│  - Tilemap / Road Grid         │  - Smartphone Overlay (Driver App)    │
│  - Camera Controller           │  - Compass & Waypoint HUD             │
│  - Physics & Hazard System     │  - Food Integrity Meter               │
│  - Entity World (Player, Bike) │  - Star Rating & Review Modal         │
└────────────────┬───────────────┴───────────────────┬───────────────────┘
                 │                                   │
                 ▼                                   ▼
┌────────────────────────────────┐   ┌───────────────────────────────────┐
│     STATE & EVENT BUS (PubSub) │   │     PROCEDURAL ASSET PIPELINE     │
│  - Order Lifecycle Manager     │   │  - Canvas Pixel Art Texture Gen   │
│  - Player State Machine        │   │  - Dynamic Spritesheet Slicer     │
│  - Wallet & Progression Store  │   │  - Web Audio Synthesizer Engine   │
└────────────────────────────────┘   └───────────────────────────────────┘
```

---

## 2. Cấu trúc Thư mục Dự án (Project Directory Structure)

```text
Game1/
├── docs/                               # Bộ tài liệu quy chuẩn dự án
│   ├── prd.md                          # Yêu cầu sản phẩm (PRD)
│   ├── tech_architecture.md            # Kiến trúc kỹ thuật (File này)
│   ├── plan.md                         # Phân rã phase & danh sách task có checkbox [ ] / [x]
│   └── rules.md                        # Quy tắc làm việc & tiêu chuẩn code
├── public/                             # Tài nguyên tĩnh
│   └── favicon.ico
├── src/
│   ├── assets/
│   │   ├── AssetGenerator.ts           # Trình sinh Procedural Pixel Art Textures
│   │   ├── UrbanAssetGenerator.ts      # Atlas nền, nhà ống, mặt tiền cửa hàng và đồ trang trí
│   │   ├── PopulationAssetGenerator.ts # Pixel art người dân, chó, xe và nội thất quán
│   │   └── SoundManager.ts             # Web Audio API Synth (Động cơ, ting-ting, lofi)
│   ├── config/
│   │   ├── GameConfig.ts               # Thiết lập hằng số thế giới, xe cộ, bảng thưởng
│   │   └── CityMap.ts                  # Dữ liệu ô phố, công trình, đồ trang trí và tên khu phố
│   ├── entities/
│   │   ├── Player.ts                   # Nhân vật chính (On-foot & Mounted states)
│   │   ├── Npc.ts                      # Người dân, khách nhận hàng và chó
│   │   ├── Vehicle.ts                  # Xe máy (Gia tốc, drift lết bánh, góc quay)
│   │   └── Hazard.ts                   # Ổ gà, vũng nước trơn, vật cản
│   ├── managers/
│   │   ├── OrderManager.ts             # Vòng đời đơn hàng, sinh đơn, giao nhận
│   │   ├── PopulationManager.ts        # Tuyến đi bộ và giao thông trong thành phố
│   │   ├── SocialManager.ts            # Thiện cảm, giá khách quen, tiền boa
│   │   ├── InventoryManager.ts         # Túi món mang đi, giới hạn chứa và dùng món
│   │   ├── SaveManager.ts              # Lưu/tải tiến trình và tương thích save cũ
│   │   ├── IntegrityManager.ts         # Tính toán độ nguyên vẹn thức ăn & sốc vật lý
│   │   └── NavigationManager.ts        # Tính góc la bàn & khoảng cách tới mục tiêu
│   ├── scenes/
│   │   ├── BootScene.ts                # Sinh textures và chuẩn bị tài nguyên
│   │   ├── CityScene.ts                # Thế giới mở phố xá, vật lý, chướng ngại vật
│   │   ├── RoomScene.ts                # Phòng trọ, ngủ, mèo và nội thất
│   │   ├── RestaurantScene.ts          # Nội thất quán, người bán, quầy nhận đơn
│   │   ├── ConversationUI.ts           # Hội thoại DOM và lựa chọn tương tác
│   │   ├── UtilityUI.ts                 # Cửa sổ DOM túi đồ và cài đặt
│   │   ├── PhoneUI.ts                  # Điện thoại DOM với viewport cuộn độc lập
│   │   └── UIScene.ts                  # HUD, điện thoại shipper, modal kết quả
│   ├── types/
│   │   └── index.ts                    # Khai báo kiểu TypeScript (Order, State, Vehicle)
│   ├── main.ts                         # Entry point khởi tạo Phaser Game
│   └── style.css                       # Giao diện khung màn hình, font & canvas wrapper
├── index.html                          # Trang chủ game
├── package.json                        # Dependencies (Phaser 3, Vite, TypeScript)
└── tsconfig.json                       # Cấu hình TypeScript
```

---

## 3. Mô hình Dữ liệu (Entity & Data Models)

### 3.1. Player & Trạng thái Điều khiển
```typescript
export enum PlayerState {
  ON_FOOT = 'ON_FOOT',
  MOUNTED = 'MOUNTED'
}

export interface PlayerStats {
  wallet: number;        // Số dư tài khoản (VNĐ)
  rating: number;        // Điểm đánh giá trung bình (1.0 - 5.0)
  exp: number;           // Điểm kinh nghiệm
  level: number;         // Cấp độ tài xế
  hunger: number;        // 0 - 100
  thirst: number;        // 0 - 100
  energy: number;        // 0 - 100
}
```

### 3.2. Phương tiện (Vehicle Specs & Dynamics)
```typescript
export interface VehicleConfig {
  id: string;
  name: string;
  maxSpeed: number;          // Tốc độ tối đa (px/s)
  acceleration: number;      // Gia tốc (px/s^2)
  deceleration: number;      // Quán tính giảm tốc
  handling: number;          // Bán kính / Tốc độ ôm cua
  driftFactor: number;       // Hệ số trượt bánh khi phanh gấp
  cargoDamping: number;      // Giảm xóc bảo vệ đồ ăn (0.0 - 1.0)
}
```

### 3.3. Đơn hàng (Order Lifecycle)
```typescript
export enum OrderStatus {
  PENDING = 'PENDING',       // Hiển thị trên app chờ nhận
  ACCEPTED = 'ACCEPTED',     // Đã nhận, đang đến quán lấy món
  PICKED_UP = 'PICKED_UP',   // Đã lấy món, đang giao cho khách
  DELIVERED = 'DELIVERED',   // Đã tới nhà khách, hoàn tất
  CANCELLED = 'CANCELLED'    // Khách boom hoặc hủy
}

export interface Order {
  id: string;
  restaurantName: string;
  restaurantPos: { x: number; y: number };
  customerName: string;
  customerAddress: string;
  customerPos: { x: number; y: number };
  foodName: string;
  fragility: number;         // Độ nhạy cảm với chướng ngại vật (0.5 - 2.0)
  baseFee: number;           // Cước cơ bản (VNĐ)
  currentIntegrity: number;  // 0 - 100%
  status: OrderStatus;
}
```

---

## 4. Các Hệ thống Lõi (Core Technical Systems)

### 4.1. Procedural Pixel Art Generator (`AssetGenerator.ts`)
* Không load file ảnh ngoài để loại trừ 100% rủi ro mất mạng / lỗi 404.
* Sử dụng HTML5 Offscreen Canvas để vẽ từng pixel theo phong cách 16-bit Pixel Art:
  * **Shipper:** Mũ bảo hiểm xanh, áo khoác đồng phục, ba lô đồ ăn, các frame bước đi 4 hướng.
  * **Xe máy:** Khung xe số/scooter, bánh xe, đèn pha, hiệu ứng khói pô.
  * **Thành phố Á Đông:** Mặt đường nhựa có vạch sơn trắng, vỉa hè lát gạch hoa, quán phở biển hiệu đỏ, tiệm trà đá vỉa hè ghế nhựa, cột điện chằng chịt dây, nhà ống đặc trưng.
  * **Chướng ngại vật:** Vệt nứt ổ gà sẫm màu, vũng nước phản chiếu ánh đèn.
* Nạp trực tiếp vào `Phaser.Textures.TextureManager` ngay trong `BootScene`.

### 4.2. Vehicle Physics & Motion Simulation
* **Vận tốc Vector:** Tính toán vector vận tốc $(v_x, v_y)$ kết hợp ma sát lăn mặt đường.
* **Góc lái (Rotation):** Lerp mượt mà góc xoay của xe theo hướng chuyển động.
* **Quán tính & Drift:** Khi chuyển hướng ngược đột ngột ở tốc độ cao, kích hoạt hạt bụi bánh xe (drift skid particles) và giảm bám đường trong chốc lát.

### 4.3. Hazard Collision & Food Integrity Engine
* **Kiểm tra va chạm:** Sử dụng Arcade Physics Overlap giữa hitbox xe và Hazard Area.
* **Logic trừ chất lượng:**
  ```typescript
  if (speed > SPEED_THRESHOLD_POTHOLE) {
    const damage = basePotholeDamage * order.fragility * (1 - vehicle.cargoDamping);
    order.currentIntegrity = Math.max(0, order.currentIntegrity - damage);
    camera.shake(100, 0.005);
    SoundManager.playRattleSound();
  }
  ```

### 4.4. Navigation & Compass Widget (`NavigationManager.ts`)
* Tính góc phương vị từ vị trí nhân vật hiện tại $(x_1, y_1)$ đến mục tiêu $(x_2, y_2)$ bằng `Math.atan2(dy, dx)`.
* Tính khoảng cách Euclidean thực tế và quy đổi sang đơn vị mét ảo.
* Cập nhật góc quay của Mũi tên la bàn neon trên HUD ở tần số 60 FPS.

### 4.5. Web Audio Synth Engine (`SoundManager.ts`)
* Sử dụng Web Audio API gốc (`AudioContext`, `OscillatorNode`, `GainNode`, `BiquadFilterNode`):
  * **Tiếng ga xe máy:** Sóng Sawtooth kết hợp Lowpass Filter, tần số oscillator tỉ lệ thuận với tốc độ xe ($60\text{Hz} \rightarrow 220\text{Hz}$).
  * **Tiếng còi xe:** Sóng Square đôi ($440\text{Hz} + 466\text{Hz}$) ngắt nhịp "bim bim".
  * **Tiếng ting-ting nổ đơn:** Chuông Sine $1200\text{Hz} \rightarrow 1600\text{Hz}$ trong trẻo.
  * **Tiếng va quẹt xóc nảy:** White Noise đập nhanh mô phỏng tiếng đồ ăn rung lắc.
  * **Tiếng tiền lẻ:** Chuỗi 3 nốt kim loại cao vút mô phỏng xu rơi.
  * **Nhạc nền Lo-fi:** Chuỗi hợp âm Major 7th ấm áp lặp tuần hoàn êm dịu.

---

## 5. Thành phố Mở rộng (Phase 3)

* **Kích thước:** 6400 × 5120 px, lưới 100 × 80 ô, mỗi ô 64 px; diện tích gấp khoảng 7,6 lần map ban đầu.
* **Nguồn dữ liệu chung:** `GameConfig.ts` định nghĩa các dải đường ngang/dọc, hai cây xăng, vị trí dịch vụ, 11 quán nhận đơn và 11 địa chỉ khách hàng. `CityMap.ts` dựng 56 ô phố, 624 công trình (136 cửa hàng), 4 công viên và 317 đồ trang trí theo bố cục cố định.
* **Đồ họa:** `UrbanAssetGenerator.ts` vẽ ở nửa độ phân giải rồi phóng đúng 2 lần, tạo 8 bảng màu nhà ống, 16 mặt tiền cửa hàng, chung cư, cây, đèn đường, ghế, chậu hoa, xe hàng và đài phun nước. `AssetGenerator.generateAll()` đăng ký các texture này trong BootScene.
* **Hiệu năng nền:** CityScene sử dụng một TilemapLayer với atlas 15 tile. Phaser chỉ dựng các tile trong vùng camera, thay cho hàng nghìn GameObject ảnh nền.
* **Vật lý:** Công trình đặt origin ở chân và depth theo tọa độ Y. Footprint va chạm nằm ở phần chân công trình; mọi cửa dịch vụ và cửa giao hàng có khoảng trống phía trước. Đường bộ không bị collider công trình hoặc đồ trang trí chắn.
* **Minimap:** Nền ô phố, công viên và công trình vẽ một lần. Vị trí người chơi, dịch vụ và mục tiêu đơn hàng cập nhật mỗi frame. Scale lấy từ kích thước thế giới để giữ đúng tỉ lệ.
* **Điều khiển:** CityScene đọc E một lần để tương tác với điểm gần nhất; F gọi `Player.tryToggleVehicle()` để lên/xuống xe. RoomScene tạo nhân vật trước khi đăng ký collider và trả người chơi về vị trí cửa phòng trọ trong cấu hình.
* **Kiểm tra bố cục:** `npm run check:city` kiểm tra mật độ, giới hạn thế giới, collider không chắn đường và flood fill với hitbox đi bộ tới toàn bộ 28 điểm tương tác. `npm run build` kiểm tra TypeScript và bundle phát hành.
* **Ảnh xem trước:** [Khu xuất phát](previews/city-spawn.png), [phố hàng quán](previews/city-shops.png), [công viên](previews/city-park.png), [khu dân cư](previews/city-residential.png).

## 6. HUD và Điện thoại (Task 3.2)

* `HUD_LAYOUT` trong GameConfig là nguồn tọa độ/kích thước chung. HUD có ba hàng cách nhau: ví/ngày/giờ/nút chức năng; xe/thể lực/đơn hàng; khu phố/đồ ăn/la bàn/buff mèo. Cảnh báo và thông báo tạm nằm dưới các hàng này.
* Tên khu phố được vẽ trong UIScene, không bị camera của CityScene zoom/cắt mất chữ. Thanh chất lượng món ăn lấy số liệu từ IntegrityManager mỗi frame khi đã lấy hàng.
* `PhoneUI.ts` quản lý DOM bên trong `#ui-overlay`. Khung điện thoại bám tọa độ canvas khi Phaser FIT thay đổi kích thước; header/tab cố định, nội dung dùng `overflow-y: auto`, text tự xuống dòng và thanh cuộn riêng.
* Cuộn bằng bánh xe, kéo chuột hoặc vuốt cảm ứng. CSS `touch-action: none` chỉ áp dụng trên canvas; viewport điện thoại dùng `pan-y`. Kéo danh sách không kích hoạt nút mua/nhận đơn; các hit area ngoài viewport được DOM cắt đúng theo hình hiển thị.
* Mỗi tab giữ vị trí cuộn, kể cả sau khi đóng điện thoại và dữ liệu được render lại. Nút mua tách thành hàng riêng dưới mô tả, không chồng lên tên/mô tả dài.
* Mở điện thoại tạm dừng scene gameplay đang hoạt động. TAB/ESC hoặc nút đóng trả về scene đó và reset phím/nút cảm ứng đang giữ. M âm thanh, N minimap, K thời tiết, P phím cảm ứng. Không có phím lưu nhanh.
* Kiểm thử trên Chrome: đo vùng HUD/chữ, cuộn hai chiều, kéo chuột, vuốt cảm ứng, thao tác thẻ cuối danh sách, đổi tab/đóng mở giữ cuộn, pause/resume và canvas 844 × 390. Ảnh: [HUD](previews/hud-clean.png), [điện thoại](previews/phone-preview.png).

## 7. Dân cư, quán ăn và thiện cảm (Phase 4)

* **Bản đồ và dữ liệu:** `GameConfig.ts` chứa hai cây xăng ở hai khu xa nhau, mật độ nhà, tốc độ và giới hạn tương tác. `CityMap.ts` sinh 77 NPC có tuyến đi bộ hợp lệ và 78 xe đi theo hai chiều của các trục đường; `isCityWalkable()` dùng cùng footprint với phép kiểm tra đường đi. Nhà thường cách nhau 8 px tại footprint, còn địa điểm giao hàng/dịch vụ luôn được chừa cửa.
* **Thực thể:** `PopulationAssetGenerator.ts` tạo sprite pixel art theo hướng và khung bước; `Npc.ts` quản lý hướng, tuyến đi, tên gần người chơi và trạng thái khách đã ra cửa. `PopulationManager.ts` chỉ kích hoạt NPC gần camera, điều tiết xe tại giao lộ, giữ khoảng cách và nhường người đi bộ/chó/người chơi. Va chạm khi chạy nhanh có thể làm giảm độ nguyên vẹn món đang giao.
* **Luồng đơn hàng:** `CityScene` cho vào quán bằng `E`, tự xuống xe khi xe đã chậm. `RestaurantScene` được launch khi CityScene ngủ; quán có người bán, quầy, menu và cửa ra. Người chơi tới quầy trò chuyện để lấy đúng đơn. `OrderManager` kiểm tra scene quán hiện hành, tên quán, khoảng cách tới người bán, trạng thái đơn và khách đã bước ra trước khi chuyển trạng thái. Sau khi ra quán, người chơi gặp đúng khách trước cửa qua hội thoại rồi mở bảng quyết toán.
* **Hội thoại và điều khiển:** `ConversationUI.ts` là lớp DOM bám theo canvas FIT, tự cuộn lựa chọn và tạm dừng scene gameplay. Chuột, bàn phím `E`/`Esc` và phím cảm ứng đều hoạt động; khi đóng hội thoại, trạng thái phím/cảm ứng được xóa để nhân vật không tự đi. `PhoneUI.ts` cũng tạm dừng/khôi phục RestaurantScene.
* **Thiện cảm và kinh tế:** `SocialManager.ts` giữ điểm thiện cảm 0–100 theo ID ổn định của người bán, khách và người dân. Nói chuyện cộng điểm một lần mỗi ngày; mua món, lấy/giao hàng cộng điểm theo hành động và chất lượng. Mốc thân quen cho giảm giá món 5%/10% và thêm tiền boa 10%/20%. `SaveManager.ts` lưu quan hệ cùng ví, xe, nâng cấp và nội thất; bản lưu cũ thiếu `relationships` được nạp với tập quan hệ rỗng, dữ liệu lỗi được chuẩn hóa.
* **Kiểm thử:** `npm run check:city` kiểm tra 28/28 điểm tương tác và dữ liệu dân cư/giao thông. `npm run check:social` kiểm tra giao dịch, giới hạn nói chuyện theo ngày, giảm giá, boa và lưu/tải tương thích. `npm run build` và luồng Chrome từ nhận đơn → vào quán → mua/lấy món → gặp khách → quyết toán đã đạt; cả 11 nội thất, hai cây xăng và màn hình 844 × 390 được kiểm tra trực tiếp.

## 8. Túi đồ, Cài đặt và HUD (Phase 5)

* **Mô hình dữ liệu:** `InventoryItem` lưu mã, tên, biểu tượng, số lượng và `category` (`consumable`, `furniture`, `fishing_gear`, `fish`, `misc`). Thuộc tính hồi chỉ số/metadata là tùy chọn theo loại món. `PlayerStats.inventory` là danh sách stack; `SaveData.inventory` tùy chọn để save cũ nạp túi trống. `FurniturePlacement` giữ mã vật dụng cùng tọa độ đặt trong phòng.
* **Mua và dùng món:** Người bán trong `RestaurantScene` có hành động dùng tại quán (hồi chỉ số ngay) và mua mang đi (thêm món tiêu hao vào túi, tính tiền và thiện cảm). `InventoryManager` giới hạn 12 món, gộp stack theo mã và lưu sau mỗi thao tác.
* **Nội thất:** `FurnitureManager.buyFurniture()` trừ tiền và thêm món nội thất vào túi, chưa đánh dấu đã sở hữu/đặt. Từ `UtilityUI`, chọn đặt khi RoomScene đang hoạt động để tạo bóng theo lưới 32 px. Bản xem trước chuyển xanh/đỏ theo kiểm tra ranh giới, vật cản và món đã đặt; bấm chuột hoặc E xác nhận, Esc hủy. `RoomScene` vẽ lại các placements và tạo collider; save lưu cả placements. Save cũ vẫn hiện nội thất đã mua trước đây tại vị trí mặc định.
* **Giao diện tiện ích:** `UtilityUI` tạo lớp DOM theo kích thước canvas FIT, có danh sách món cuộn được và bảng cài đặt. Nó tạm dừng scene đang chơi, xóa trạng thái cảm ứng khi mở và reset phím khi đóng. Phím tắt E (tương tác/lưu ở bàn làm việc), F (xe), B (túi), O (cài đặt), M (âm thanh), N (bản đồ), K (thời tiết), P (phím cảm ứng) được liệt kê trong Cài đặt. Các giao dịch và giấc ngủ chỉ đổi trạng thái trong phiên; `SaveManager.saveAtDesk()` là điểm duy nhất ghi vào LocalStorage.
* **Bố cục HUD:** `HUD_LAYOUT` có hai thanh nền phía trên. Hàng đầu gồm Điện thoại, ngày/giờ/thời tiết, khu phố, túi và cài đặt; hàng hai chứa đơn hàng, chất lượng món, la bàn và buff không cần thêm khung nền. Đói/khát/sức và tốc độ/nhiên liệu đặt ở hàng dưới cạnh bản đồ. `PhoneUI` luôn hiển thị ví và điểm sao trong thẻ hồ sơ.

## 9. Cốt truyện và màn hình đầu game (Phase 6)

* `BootScene` sinh asset rồi mở `TitleScene`. `TitleScene` cho tải save hiện có hoặc bắt đầu ván mới; nút Chơi mới mở `StorybookPanel` ba trang. Cả hai lựa chọn truyền `startAtBoardingHouse: true` vào `CityScene`, đặt xe cạnh nhà trọ và tự mở `RoomScene`; Chơi mới khởi tạo trạng thái ban đầu, Chơi tiếp tải save.
* `StoryArtGenerator` vẽ tranh pixel art trên canvas để minh họa lễ tốt nghiệp, hai tháng tìm việc và chuyến giao hàng đầu tiên. `StoryProgress` lưu cờ mở đầu và số lần/ngày bà chủ trọ ghé; save cũ được nâng cấp mặc định mà không phát lại đoạn mở đầu.
* `RoomScene` kiểm tra lịch bà Hạnh khi người chơi về phòng. Tiền trọ 80.000đ đến hạn đúng mỗi 7 ngày trong game (ngày 7, 14, 21...); khi đến hạn, cô nhắc thu ở lần về phòng đầu tiên trong ngày. Những lần ghé thông thường cách nhau tối thiểu hai ngày và có thể càu nhàu hoặc tặng xôi. `StoryProgress.lastRentDay` lưu mốc thu tiền riêng khỏi lịch ghé. `ConversationUI` hiển thị chân dung cùng lựa chọn trả tiền/khất hoặc nhận quà; quà vào túi, hoặc hồi chỉ số nếu túi đã đầy.

## 10. Đèn giao thông, cửa hàng và chung cư (Phase 7)

* `CITY_TRAFFIC_SIGNALS` chọn giao lộ từ chỉ số đường trong `GameConfig`. `PopulationManager` vẽ đèn pixel bằng Phaser Graphics và đổi pha xanh/đỏ theo chu kỳ xe. `checkPlayerTrafficSignal()` phát hiện người chơi đang lái cắt qua giao lộ khi hướng đó đỏ; lần đầu nhắc nhở, từ lần hai trừ 25.000đ. `PlayerStats.trafficViolations` được lưu tại bàn làm việc.
* `CityScene` tìm mọi công trình `kind === 'shop'`, dựng mẫu cửa hàng theo mặt tiền và mở `RestaurantScene` khi người chơi nhấn `E`. Cửa hàng trong danh sách đơn vẫn giữ vị trí, tên và logic lấy món; mặt tiền còn lại dùng menu cửa hàng chung.
* `CustomerTemplate.deliveryMode` đánh dấu đơn giao căn hộ. `CityScene` mở `ApartmentScene` tại chung cư; người chơi tới cửa phòng để gọi `OrderManager.deliverOrder()`. `OrderManager.canDeliver()` chỉ chấp nhận trạng thái giao tận cửa khi đúng chung cư và đúng đơn; khách nhà phố tiếp tục nhận hàng ngoài đường.

## 11. Bến câu cuối ngõ (Phase 8)

* `MAP_LOCATIONS.FISHING_GATE` đặt lối xuống ở phía nam nhà trọ. `CityScene` mở `FishingScene` tại đây và giữ nguyên `PlayerStats`; lối cổng trong bản đồ hồ gọi `CityScene.exitFishingMap()` để trở lại đúng khu phố.
* `FishingScene` dựng hồ, bờ cỏ, cầu gỗ, chòi câu và cây pixel art bằng Phaser Graphics. Nước và thân cây có collider, cầu giữ đường tiếp cận bờ hồ.
* Lần đầu vào hồ, game thêm cần câu tre vào `PlayerStats.inventory`. Người chơi nhấn `E` để thả câu; thời gian chờ, cửa sổ phao rung và lựa chọn cá xử lý trong scene. Mỗi loại cá được thêm vào túi theo `InventoryManager`, nên theo giới hạn túi và được lưu cùng tiến trình tại bàn làm việc.
* `UIScene` tiếp tục hiển thị tiền, chỉ số và nút điều khiển cảm ứng; khi ở hồ, nhãn khu vực đổi thành bến câu và radar thành phố được ẩn. `PhoneUI` và `UtilityUI` tạm dừng `FishingScene` khi mở để phao và nhân vật không chạy trong lúc xem bảng.

## 12. Vòng chơi 7 ngày và kinh tế liên thông (Phase 9)

* `WeekManager` quản lý nhật ký ngày 1–7, mục tiêu một đơn/ngày, thưởng khi ngủ và lịch phát sinh tiền trọ 7 ngày/lần. `StoryProgress` thêm nợ trọ, ngày nhật ký đã xem, số đơn đầu ngày và cờ hoàn thành tuần đầu. `SaveManager` nâng dữ liệu lên phiên bản 5 và điền mặc định cho bản lưu cũ.
* `RoomScene` mở nhật ký ngày mới qua `ConversationUI.onClose`, sau đó kiểm tra cô Hạnh. Khoản nợ chỉ xóa khi trả đủ; xin khất hoặc tặng cá không xóa nợ. Thanh toán kỳ đầu mở đoạn kết tuần đầu. Điện thoại hiển thị tiến độ ngày và số ngày tới kỳ trọ.
* `OrderManager` gán luân phiên loại đơn `standard`, `express`, `careful`; chỉ đếm thời gian giao nhanh khi scene thành phố đang chạy. Bảng quyết toán cộng thưởng theo điều kiện thực tế của đơn; phần thưởng loại đơn không thay đổi tiền boa hay sao có sẵn.
* `FishingEconomyManager` là nơi trừ cá khỏi túi khi nấu, bán hoặc tặng; lần lượt cập nhật chỉ số, ví hoặc quan hệ. Phòng trọ cho nấu cá; các quán trong danh sách nhà hàng mua cá; cô Hạnh có lựa chọn nhận quà khi ghé.

## 13. Chọn đơn theo tuyến đường (Phase 10)

* `DeliveryPlanner` tính quãng đường lưới đi từ vị trí Minh qua quán tới khách, đổi sang mét ảo rồi ước tính thời gian game, xăng và sức theo tốc độ xe. Sau khi lấy món, thẻ đơn chỉ dự báo đoạn còn lại. Đây là dự tính theo lưới phố; đường vòng và cách lái thực tế có thể khác.
* `OrderManager` duyệt các cặp quán và khách chưa có trong danh sách, sắp theo độ dài tuyến và chọn ba mức quãng đường cho đơn thường, nhanh, dễ đổ. Cước cộng phí theo quãng đường quán → khách trước các hệ số thời gian và thời tiết. Khi online trở lại hoặc quyết toán xong, danh sách được bù đủ ba loại.
* Lúc nhận đơn nhanh, `deadlineGameHours` được chốt từ tuyến và tốc độ xe hiện hành, giới hạn 2–7 giờ game. `elapsedGameHours` chỉ tăng khi `CityScene` hoạt động; `getServiceBonus()` đối chiếu hai giá trị khi quyết toán. Đơn lưu cũ thiếu hạn dùng mốc tương thích 5 giờ.
* `PhoneUI` hiển thị dự tính, nguồn lực thiếu, loại địa chỉ, khách quen và hạn thưởng còn lại. `npm run check:delivery` kiểm tra tuyến ngắn/dài, phí, nguồn lực, giới hạn thời gian và đoạn đường sau khi lấy món.

## 14. Đơn cá tươi hằng ngày (Phase 11)

* `FISH_MARKET_CONFIG` định nghĩa ba loại cá, ba quán mua và mức thưởng. `FishingEconomyManager.dailyRequest()` chọn yêu cầu ổn định theo ngày, không cần ghi thêm nhiệm vụ phát sinh. `isDailyRequest()` đối chiếu ngày chưa hoàn thành, cá và quán; `salePrice()` dùng chung cho nhãn hội thoại và thanh toán.
* `RestaurantScene` chuyển tên quán vào `FishingEconomyManager.sell()`. Giao dịch chỉ trừ một cá sau khi xác nhận có hàng, rồi cộng giá thường, thưởng và thiện cảm tương ứng; `fishRequestCompletedDay` ngăn nhận thưởng lặp. `PhoneUI` báo yêu cầu và trạng thái đã hoàn thành trong vùng cuộn.
* `SaveManager` lưu phiên bản 6 và chuẩn hóa `fishRequestCompletedDay` về 0 khi đọc bản lưu cũ. `npm run check:week` kiểm tra sai quán, đúng quán, không trả thưởng lặp, chuyển ngày và lưu/tải; trình duyệt kiểm tra thẻ điện thoại, nút bán ở quầy và giao dịch.

## 15. Đơn ghép và giá cửa hàng (Phase 12)

* `OrderManager.activeOrders` giữ tối đa ba đơn theo `BATCH_CONFIG.capacityByBagLevel`. Sau khi nhận đơn đầu, manager tạo tối đa hai lời mời từ cùng quán, chọn các khách trong bán kính 2400 px của nhau. `canAcceptOrder()` kiểm tra còn chỗ, đúng quán, khách khác nhau và chưa lấy món. Khi nhận đơn ghép, đồng hồ từng đơn bắt đầu từ thời điểm nhận.
* `RestaurantScene` cho lấy toàn bộ món cùng quán một lần. `IntegrityManager` cập nhật từng món theo độ dễ đổ và giảm chấn của xe/túi; HUD dùng mức thấp nhất, còn quyết toán đọc `order.currentIntegrity`. `PhoneUI` gọi `OrderManager.focusOrder()` để chọn một đơn đã lấy; la bàn, khách ra cửa và điểm sáng trên minimap đi theo mục tiêu. Các khách khác vẫn có dấu trên bản đồ.
* Sau mỗi quyết toán, `completeSettlement()` bỏ đúng đơn đã giao, chọn khách còn lại gần Minh nhất và chỉ tạo lại ba lời mời thường khi nhóm đã giao hết. Giá xe, túi, giá đỡ và nội thất trong `GameConfig.ts` là giá mua mới; save và vật phẩm đã sở hữu giữ nguyên.
