/**
 * Web Audio Synthesizer Engine (SoundManager.ts)
 * Tổng hợp toàn bộ hiệu ứng âm thanh & nhạc nền Lo-fi bằng Web Audio API thuần (Zero external audio assets)
 */
export class SoundManager {
  private static instance: SoundManager;

  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Động cơ xe máy Wave Alpha (Engine Rumble & Revving)
  private engineOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineRunning: boolean = false;

  // Nhạc nền Lo-fi BGM Loop
  private lofiTimer: number | null = null;
  private isLofiPlaying: boolean = false;

  // Tiếng mưa rào (Rain Ambience Loop)
  private rainNoiseNode: AudioBufferSourceNode | null = null;
  private rainGainNode: GainNode | null = null;
  private isRainingPlaying: boolean = false;

  private constructor() {}

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  /**
   * Khởi tạo AudioContext khi người chơi tương tác đầu tiên (tránh lỗi Autoplay policy của trình duyệt)
   */
  public init() {
    if (this.ctx) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);

      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.masterGain);

      // Music Gain (êm dịu để không lấn át SFX)
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.12;
      this.musicGain.connect(this.masterGain);

      console.log('[SoundManager] Web Audio API Synthesizer đã sẵn sàng!');
    } catch (e) {
      console.warn('[SoundManager] Trình duyệt không hỗ trợ Web Audio API:', e);
    }
  }

  public resumeContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.resumeContext();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.5, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // =========================================================================
  // 1. ĐỘNG CƠ XE MÁY WAVE ALPHA (ENGINE REVVING & THROTTLE)
  // =========================================================================

  public startEngine() {
    this.resumeContext();
    if (!this.ctx || !this.sfxGain || this.isEngineRunning) return;

    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Tiếng nổ máy gằn ga-răng-ti

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(160, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.sfxGain);

      this.engineOsc.start();
      this.isEngineRunning = true;
    } catch (e) {
      console.warn('Lỗi khởi động động cơ:', e);
    }
  }

  /**
   * Điều chỉnh âm thanh động cơ theo tỉ lệ tốc độ xe (0.0 đến 1.0)
   */
  public updateEngineSpeed(speedRatio: number) {
    if (!this.ctx || !this.engineOsc || !this.engineFilter || !this.engineGain || !this.isEngineRunning) return;

    const ratio = Math.max(0, Math.min(1, speedRatio));
    const targetFreq = 55 + ratio * 155; // 55Hz -> 210Hz
    const filterFreq = 160 + ratio * 320; // 160Hz -> 480Hz
    const targetVol = 0.04 + ratio * 0.06;

    const now = this.ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.05);
    this.engineGain.gain.setTargetAtTime(targetVol, now, 0.05);
  }

  public stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      if (this.engineOsc) {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
        this.engineOsc = null;
      }
      this.isEngineRunning = false;
    } catch (e) {
      // Ignored
    }
  }

  // =========================================================================
  // 2. HIỆU ỨNG ÂM THANH GAMEPLAY (SFX)
  // =========================================================================

  /**
   * Còi xe máy "Bim Bim" (Square wave đôi 440Hz + 466Hz)
   */
  public playHorn() {
    this.resumeContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const freqs = [440, 466];
    const duration = 0.12;
    const now = this.ctx.currentTime;

    freqs.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.setValueAtTime(0.08, now + duration);
      gain.gain.setValueAtTime(0, now + duration + 0.02);

      // Tiếng bim thứ 2
      gain.gain.setValueAtTime(0.08, now + duration + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration * 2 + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now);
      osc.stop(now + duration * 2 + 0.1);
    });
  }

  /**
   * Chuông Ting-Ting nổ đơn / Lấy món phở (Sine wave trong trẻo)
   */
  public playOrderChime() {
    this.resumeContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const notes = [1046.5, 1318.5, 1568]; // C6 -> E6 -> G6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.18, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.55);
    });
  }

  /**
   * Tiếng đồ ăn xóc lộc cộc & va quẹt ổ gà (Bandpass Filtered White Noise)
   */
  public playRattle() {
    this.resumeContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(380, this.ctx.currentTime);
    filter.Q.setValueAtTime(3, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  /**
   * Tiếng tiền xu rơi keng keng khi quyết toán thù lao
   */
  public playCoinSound() {
    this.resumeContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const coinNotes = [987.77, 1318.51, 1760.0]; // B5 -> E6 -> A6
    const now = this.ctx.currentTime;

    coinNotes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.45);
    });
  }

  /**
   * Tiếng uống trà đá / hút nước mát lành (Bong bóng nước sine)
   */
  public playDrinkSip() {
    this.resumeContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const bubblePitches = [420, 560, 680, 820];

    bubblePitches.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.3, now + idx * 0.05 + 0.06);

      gain.gain.setValueAtTime(0.12, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.09);
    });
  }

  /**
   * Tiếng cắn bánh mì giòn rụm (Noise burst lọc băng thông dồn dập)
   */
  public playEatCrunch() {
    this.resumeContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const bites = [0, 0.08, 0.16];

    bites.forEach((delay) => {
      const bufferSize = Math.floor(this.ctx!.sampleRate * 0.06);
      const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx!.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now + delay);
      filter.Q.setValueAtTime(3.0, now + delay);

      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.18, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);

      whiteNoise.start(now + delay);
      whiteNoise.stop(now + delay + 0.07);
    });
  }

  /**
   * Tiếng chuông ru ngủ êm đềm & sáng sớm thức giấc
   */
  public playSleepChime() {
    this.resumeContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const sleepNotes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    sleepNotes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.linearRampToValueAtTime(0.16, now + idx * 0.14 + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.9);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 1.0);
    });
  }

  /**
   * Tiếng lưu game thành công (Crystal save chime)
   */
  public playSaveSuccess() {
    this.resumeContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const saveNotes = [1046.5, 1318.51, 1567.98, 2093.0]; // C6, E6, G6, C7

    saveNotes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.14, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.4);
    });
  }

  /**
   * Tiếng bơm xăng tại cây xăng (Vòi bơm ngắt cò 'cạch' + tiếng tít tít điện tử)
   */
  public playGasRefuel() {
    this.resumeContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    // Tiếng cạch ngắt vòi kim loại
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(220, now);
    clickOsc.frequency.exponentialRampToValueAtTime(80, now + 0.06);
    clickGain.gain.setValueAtTime(0.2, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    clickOsc.connect(clickGain);
    clickGain.connect(this.sfxGain);
    clickOsc.start(now);
    clickOsc.stop(now + 0.07);

    // Tiếng tít tít điện tử của trụ bơm Petrolimex
    const beeps = [1174.66, 1760.0]; // D6 -> A6
    beeps.forEach((freq, idx) => {
      const beepOsc = this.ctx!.createOscillator();
      const beepGain = this.ctx!.createGain();
      beepOsc.type = 'sine';
      beepOsc.frequency.setValueAtTime(freq, now + 0.08 + idx * 0.09);
      beepGain.gain.setValueAtTime(0.12, now + 0.08 + idx * 0.09);
      beepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08 + idx * 0.09 + 0.08);
      beepOsc.connect(beepGain);
      beepGain.connect(this.sfxGain!);
      beepOsc.start(now + 0.08 + idx * 0.09);
      beepOsc.stop(now + 0.08 + idx * 0.09 + 0.09);
    });
  }

  /**
   * Tiếng chuông báo đơn hàng mới đổ chuông
   */
  public playPhoneRing() {
    this.resumeContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const ringNotes = [784, 1046.5, 1318.5]; // G5 -> C6 -> E6
    ringNotes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.15, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.22);
    });
  }

  /**
   * Tiếng click giao diện / Dựng chân chống xe
   */
  public playClick() {
    this.resumeContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Tiếng uống nước / ngụm cà phê thơm ngon (Drink sound effect)
   */
  public playDrinkSound() {
    this.resumeContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.09);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.18);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  // =========================================================================
  // 3. NHẠC NỀN CHILL LO-FI (LO-FI CHORD PROGRESSION SYNTHESIZER)
  // =========================================================================

  /**
   * Phát nhạc nền Lo-fi thư giãn tuần hoàn
   * Hợp âm: Fmaj7 -> Em7 -> Dm7 -> Cmaj7 (Vibe phố cuối ngày êm đềm)
   */
  public startLofiBGM() {
    this.resumeContext();
    if (this.isLofiPlaying || !this.ctx || !this.musicGain) return;

    this.isLofiPlaying = true;

    // Vòng hợp âm Lo-fi (Tần số nốt nhạc Hz)
    const chords = [
      [349.23, 440.0, 523.25, 659.25], // Fmaj7 (F4, A4, C5, E5)
      [329.63, 392.0, 493.88, 587.33], // Em7   (E4, G4, B4, D5)
      [293.66, 349.23, 440.0, 523.25], // Dm7   (D4, F4, A4, C5)
      [261.63, 329.63, 392.0, 493.88]  // Cmaj7 (C4, E4, G4, B4)
    ];

    let chordIndex = 0;

    const playChordStep = () => {
      if (!this.isLofiPlaying || !this.ctx || !this.musicGain || this.isMuted) return;

      const currentChord = chords[chordIndex];
      const now = this.ctx.currentTime;
      const stepDuration = 2.4; // 2.4s mỗi hợp âm

      currentChord.forEach((freq, noteIdx) => {
        const osc = this.ctx!.createOscillator();
        const filter = this.ctx!.createBiquadFilter();
        const gain = this.ctx!.createGain();

        osc.type = noteIdx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        // Lọc âm tạo chất ấm Lo-fi cổ điển
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, now);

        // Hiệu ứng phím Rhodes nở dần rồi tan chậm
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.025, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration - 0.1);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(now);
        osc.stop(now + stepDuration);
      });

      chordIndex = (chordIndex + 1) % chords.length;
    };

    // Chơi hợp âm đầu tiên và lặp lại mỗi 2.4s
    playChordStep();
    this.lofiTimer = window.setInterval(playChordStep, 2400);
  }

  public stopLofiBGM() {
    this.isLofiPlaying = false;
    if (this.lofiTimer !== null) {
      window.clearInterval(this.lofiTimer);
      this.lofiTimer = null;
    }
  }

  // =========================================================================
  // 4. TIẾNG MƯA RÀO VÀ THỜI TIẾT (TASK 2.2)
  // =========================================================================

  private createNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public startRainAmbience() {
    this.resumeContext();
    if (this.isRainingPlaying || !this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const buffer = this.createNoiseBuffer();
      if (!buffer) return;

      this.rainNoiseNode = this.ctx.createBufferSource();
      this.rainNoiseNode.buffer = buffer;
      this.rainNoiseNode.loop = true;

      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = 'lowpass';
      rainFilter.frequency.setValueAtTime(950, this.ctx.currentTime);

      this.rainGainNode = this.ctx.createGain();
      this.rainGainNode.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.rainGainNode.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 1.2);

      this.rainNoiseNode.connect(rainFilter);
      rainFilter.connect(this.rainGainNode);
      this.rainGainNode.connect(this.sfxGain);

      this.rainNoiseNode.start();
      this.isRainingPlaying = true;
    } catch (e) {
      console.warn('[SoundManager] Lỗi startRainAmbience:', e);
    }
  }

  public stopRainAmbience() {
    if (!this.isRainingPlaying || !this.rainGainNode || !this.ctx) return;
    try {
      this.rainGainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 1.0);
      window.setTimeout(() => {
        if (this.rainNoiseNode) {
          try { this.rainNoiseNode.stop(); } catch (e) {}
          this.rainNoiseNode.disconnect();
          this.rainNoiseNode = null;
        }
        this.isRainingPlaying = false;
      }, 1000);
    } catch (e) {
      this.isRainingPlaying = false;
    }
  }

  public playThunder() {
    this.resumeContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const buffer = this.createNoiseBuffer();
    if (!buffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const now = this.ctx.currentTime;
    filter.frequency.setValueAtTime(220, now);
    filter.frequency.exponentialRampToValueAtTime(50, now + 1.6);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 1.9);
  }

  // =========================================================================
  // 5. TIẾNG MÈO PHÒNG TRỌ (TASK 2.3)
  // =========================================================================

  public playCatMeow() {
    this.resumeContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.linearRampToValueAtTime(1080, now + 0.16);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.42);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.46);
  }

  public playDogBark() {
    this.init();
    if(!this.ctx||!this.sfxGain||this.isMuted) return;
    for(let index=0;index<2;index++) {
      const time=this.ctx.currentTime+index*0.16;
      const oscillator=this.ctx.createOscillator();
      const filter=this.ctx.createBiquadFilter();
      const gain=this.ctx.createGain();
      oscillator.type='square';
      oscillator.frequency.setValueAtTime(210,time);
      oscillator.frequency.exponentialRampToValueAtTime(110,time+0.10);
      filter.type='lowpass';filter.frequency.value=700;
      gain.gain.setValueAtTime(0.035,time);
      gain.gain.exponentialRampToValueAtTime(0.001,time+0.12);
      oscillator.connect(filter);filter.connect(gain);gain.connect(this.sfxGain);
      oscillator.start(time);oscillator.stop(time+0.13);
    }
  }

  public playCatPurr() {
    this.resumeContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const carrier = this.ctx.createOscillator();
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(75, now);

    mod.type = 'sine';
    mod.frequency.setValueAtTime(28, now);
    modGain.gain.setValueAtTime(45, now);

    mod.connect(carrier.frequency);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    carrier.connect(gain);
    gain.connect(this.sfxGain);

    mod.start(now);
    carrier.start(now);
    mod.stop(now + 1.25);
    carrier.stop(now + 1.25);
  }

  public playCatEat() {
    this.resumeContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const t = now + i * 0.14;
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.08);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.09);
    }
  }
}
