type TutorialPage = {
  label: string;
  title: string;
  content: string;
};

const PAGES: TutorialPage[] = [
  {
    label: '01 / ĐIỀU KHIỂN',
    title: 'Làm quen với các nút',
    content: `
      <div class="tutorial-grid">
        <div class="tutorial-item"><kbd>W A S D</kbd><span>hoặc phím mũi tên</span><strong>Di chuyển Minh và lái xe</strong></div>
        <div class="tutorial-item"><kbd>E</kbd><span>tương tác</span><strong>Nói chuyện, vào quán, lấy hàng, giao hàng, lưu game</strong></div>
        <div class="tutorial-item"><kbd>F</kbd><span>xe máy</span><strong>Lên hoặc xuống xe khi đứng gần</strong></div>
        <div class="tutorial-item"><kbd>Tab</kbd><span>điện thoại</span><strong>Xem tiền, nhận đơn, chọn điểm giao và mua sắm</strong></div>
        <div class="tutorial-item"><kbd>B</kbd><span>túi đồ</span><strong>Dùng vật phẩm, xem cá và đặt nội thất</strong></div>
        <div class="tutorial-item"><kbd>O</kbd><span>cài đặt</span><strong>Âm thanh, radar, thời tiết và bảng phím tắt</strong></div>
      </div>
      <p class="tutorial-note">Trên điện thoại, dùng cụm phím di chuyển và các nút E, F, Điện thoại trên màn hình. Có thể bật phím cảm ứng trong Cài đặt.</p>
    `
  },
  {
    label: '02 / LỐI CHƠI',
    title: 'Một ngày chạy ship của Minh',
    content: `
      <ol class="tutorial-steps">
        <li><strong>Bắt đầu ở phòng trọ.</strong> Ra phố, mở điện thoại bằng <kbd>Tab</kbd>, bật Online và chọn đơn phù hợp quãng đường, xăng và sức.</li>
        <li><strong>Đến đúng quán.</strong> Xuống xe bằng <kbd>F</kbd>, vào quán và bấm <kbd>E</kbd> tại quầy để lấy món.</li>
        <li><strong>Giao cho khách.</strong> Đi theo la bàn. Với đơn chung cư, vào tòa nhà và đến cửa căn hộ; bấm <kbd>E</kbd> để giao.</li>
        <li><strong>Giữ món và giữ sức.</strong> Tránh ổ gà, dừng đèn đỏ; ăn uống, đổ xăng và nghỉ ngơi khi cần. Nâng cấp túi giữ nhiệt để nhận 2–3 đơn ghép.</li>
        <li><strong>Về trọ cuối ngày.</strong> Ngủ để sang ngày mới; bấm <kbd>E</kbd> ở bàn làm việc để lưu game. Cô Hạnh thu tiền trọ mỗi 7 ngày.</li>
      </ol>
      <p class="tutorial-note">Ngoài giao hàng, Minh có thể câu cá ở bến cuối ngõ, bán hoặc nấu cá, mua nội thất và làm quen với người trong phố.</p>
    `
  }
];

export class TutorialPanel {
  private readonly layer: HTMLDivElement;
  private readonly stepLabel: HTMLElement;
  private readonly title: HTMLElement;
  private readonly content: HTMLElement;
  private readonly backButton: HTMLButtonElement;
  private readonly nextButton: HTMLButtonElement;
  private pageIndex = 0;
  private onStart?: () => void;

  constructor() {
    const host = document.getElementById('ui-overlay');
    if (!host) throw new Error('Missing UI overlay for tutorial');

    this.layer = document.createElement('div');
    this.layer.className = 'tutorial-layer';
    this.layer.hidden = true;
    this.layer.innerHTML = `
      <section class="tutorial-card" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
        <header class="tutorial-header">
          <span class="tutorial-eyebrow">PIXEL SHIPPER · HƯỚNG DẪN CHƠI</span>
          <span class="tutorial-step"></span>
        </header>
        <h2 id="tutorial-title"></h2>
        <div class="tutorial-content"></div>
        <footer class="tutorial-footer">
          <span class="tutorial-progress" aria-hidden="true"></span>
          <div class="tutorial-actions">
            <button type="button" class="tutorial-back"></button>
            <button type="button" class="tutorial-next"></button>
          </div>
        </footer>
      </section>`;
    host.appendChild(this.layer);

    this.stepLabel = this.layer.querySelector('.tutorial-step')!;
    this.title = this.layer.querySelector('#tutorial-title')!;
    this.content = this.layer.querySelector('.tutorial-content')!;
    this.backButton = this.layer.querySelector('.tutorial-back')!;
    this.nextButton = this.layer.querySelector('.tutorial-next')!;
    this.backButton.addEventListener('click', () => {
      if (this.pageIndex === 0) this.close();
      else { this.pageIndex--; this.render(); }
    });
    this.nextButton.addEventListener('click', () => {
      if (this.pageIndex < PAGES.length - 1) {
        this.pageIndex++;
        this.render();
      } else {
        const start = this.onStart;
        this.close();
        start?.();
      }
    });
  }

  open(onStart?: () => void) {
    this.onStart = onStart;
    this.pageIndex = 0;
    this.layer.hidden = false;
    this.render();
    this.nextButton.focus();
  }

  destroy() {
    this.layer.remove();
  }

  private close() {
    this.layer.hidden = true;
    this.onStart = undefined;
  }

  private render() {
    const page = PAGES[this.pageIndex];
    this.stepLabel.textContent = page.label;
    this.title.textContent = page.title;
    this.content.innerHTML = page.content;
    this.content.scrollTop = 0;
    this.backButton.textContent = this.pageIndex === 0 ? 'Về menu' : '← Quay lại';
    this.nextButton.textContent = this.pageIndex === PAGES.length - 1
      ? (this.onStart ? 'Bắt đầu chơi →' : 'Đã hiểu ✓')
      : 'Tiếp theo →';
    const progress = this.layer.querySelector('.tutorial-progress')!;
    progress.textContent = `${this.pageIndex + 1} / ${PAGES.length}`;
  }
}
