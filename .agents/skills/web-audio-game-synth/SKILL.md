---
name: web-audio-game-synth
description: >-
  Recipes and implementations for synthesized procedural sound effects and chill Lo-fi BGM
  using the native Web Audio API. Use when implementing vehicle acceleration hum, bike horn,
  order incoming chimes, bump rattles, coin cascades, and relaxing ambient music.
---

# Web Audio Game Synthesizer Skill

This skill provides native Web Audio API recipes for producing rich, zero-asset game audio.

## 1. Engine Revving & Throttle (Motorbike)
Modulate oscillator frequency based on player speed:
```typescript
class BikeEngineSynth {
  private ctx: AudioContext;
  private osc: OscillatorNode;
  private gain: GainNode;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.osc = ctx.createOscillator();
    this.gain = ctx.createGain();
    this.osc.type = 'sawtooth';
    this.osc.frequency.value = 55; // idle rumble
    this.gain.gain.value = 0.05;
    this.osc.connect(this.gain);
    this.gain.connect(ctx.destination);
    this.osc.start();
  }

  setSpeed(ratio: number) { // ratio from 0.0 to 1.0
    const targetFreq = 55 + ratio * 180;
    this.osc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);
  }
}
```

## 2. Order Bell / Chime (Ting-Ting)
```typescript
function playOrderChime(ctx: AudioContext) {
  const notes = [1046.5, 1318.5]; // C6 -> E6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const time = ctx.currentTime + idx * 0.12;
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.65);
  });
}
```

## 3. Bump & Food Rattle (Impact)
```typescript
function playRattle(ctx: AudioContext) {
  // Burst of filtered noise
  const bufferSize = ctx.sampleRate * 0.1;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 400;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
}
```
