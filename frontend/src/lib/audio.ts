// ─── Audio Manager ─────────────────────────────────────────────────────────
// Singleton quản lý toàn bộ âm thanh trong app.
// Dùng Web Audio API để tạo SFX thay vì file .mp3 (không cần host file).
// Nhạc nền dùng Howler.js với file .mp3 trong public/sounds/.

import { Howl, Howler } from 'howler';

// ── Định nghĩa các track nhạc nền ──────────────────────────────────────────
export type BgTrackId =
  | 'adventure'   // nhạc phiêu lưu — Home, Activities
  | 'calm'        // nhạc thư giãn — Schedule, Lịch
  | 'naruto'      // nhạc anime — Chat Naruto
  | 'morning'     // nhạc buổi sáng — chào ngày mới
  | 'space'       // nhạc không gian — khám phá
  | 'none';       // tắt nhạc nền

export type SfxId =
  | 'pop'         // bấm nút / chọn bé
  | 'ding'        // thêm hoạt động vào lịch / Naruto trả lời
  | 'save'        // lưu lịch thành công
  | 'drag'        // bắt đầu kéo thả
  | 'drop'        // thả DnD
  | 'delete'      // xoá hoạt động
  | 'achievement' // hoàn thành lịch ngày
  | 'welcome';    // thêm bé mới / chào mừng

// ── Thư viện track nhạc nền ────────────────────────────────────────────────
export const BG_TRACKS: Record<BgTrackId, { label: string; emoji: string; src: string }> = {
  adventure: { label: 'Phiêu Lưu', emoji: '🗺️', src: '/sounds/bg-adventure.mp3' },
  calm:      { label: 'Thư Giãn',  emoji: '🌿', src: '/sounds/bg-calm.mp3' },
  naruto:    { label: 'Naruto',    emoji: '🍥', src: '/sounds/bg-naruto.mp3' },
  morning:   { label: 'Buổi Sáng', emoji: '☀️', src: '/sounds/bg-morning.mp3' },
  space:     { label: 'Không Gian', emoji: '🚀', src: '/sounds/bg-space.mp3' },
  none:      { label: 'Tắt nhạc', emoji: '🔇', src: '' },
};

// ── Route → Track mặc định ─────────────────────────────────────────────────
export const ROUTE_DEFAULT_TRACK: Record<string, BgTrackId> = {
  '/home':       'adventure',
  '/schedule':   'calm',
  '/chat':       'naruto',
  '/activities': 'adventure',
  '/parent':     'calm',
};

// ── Cài đặt mặc định ─────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  bgEnabled: true,
  sfxEnabled: true,
  bgVolume: 0.3,
  sfxVolume: 0.7,
  currentTrack: 'adventure' as BgTrackId,
  routeTracks: ROUTE_DEFAULT_TRACK as Record<string, BgTrackId>,
};

const STORAGE_KEY = 'kid_audio_settings';

function loadSettings() {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

function saveSettings(s: typeof DEFAULT_SETTINGS) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// ── Web Audio SFX: tạo âm thanh bằng oscillator ───────────────────────────
function createWebAudioSfx(type: SfxId, volume: number) {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(volume * 0.5, ctx.currentTime);

    const configs: Record<SfxId, { freq: number[]; dur: number; type: OscillatorType; ramp?: number }> = {
      pop:         { freq: [600, 900],      dur: 0.12, type: 'sine',   ramp: 800 },
      ding:        { freq: [880, 1320],     dur: 0.3,  type: 'sine',   ramp: 1100 },
      save:        { freq: [523, 659, 784], dur: 0.5,  type: 'sine',   ramp: 900 },
      drag:        { freq: [200, 300],      dur: 0.1,  type: 'square', ramp: 250 },
      drop:        { freq: [300, 200],      dur: 0.15, type: 'sine',   ramp: 150 },
      delete:      { freq: [400, 200],      dur: 0.2,  type: 'sawtooth' },
      achievement: { freq: [523, 659, 784, 1047], dur: 0.8, type: 'sine', ramp: 900 },
      welcome:     { freq: [784, 880, 988, 1047], dur: 0.6, type: 'sine', ramp: 1000 },
    };

    const cfg = configs[type];
    const startTime = ctx.currentTime;
    const stepDur = cfg.dur / cfg.freq.length;

    cfg.freq.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = cfg.type;
      osc.connect(gainNode);
      osc.frequency.setValueAtTime(f, startTime + i * stepDur);
      if (cfg.ramp) {
        osc.frequency.exponentialRampToValueAtTime(cfg.ramp, startTime + (i + 1) * stepDur);
      }
      osc.start(startTime + i * stepDur);
      osc.stop(startTime + (i + 1) * stepDur);
    });

    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + cfg.dur);
    setTimeout(() => { try { ctx.close(); } catch {} }, (cfg.dur + 0.5) * 1000);
  } catch { /* ignore */ }
}

// ── AudioManager Class ─────────────────────────────────────────────────────
class AudioManager {
  private settings = loadSettings();
  private currentHowl: Howl | null = null;
  private currentTrackId: BgTrackId | null = null;
  private userInteracted = false;
  private pendingTrack: BgTrackId | null = null;
  private listeners: Array<() => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const onInteract = () => {
        this.userInteracted = true;
        if (this.pendingTrack) this.playBg(this.pendingTrack);
        window.removeEventListener('click', onInteract);
        window.removeEventListener('touchstart', onInteract);
      };
      window.addEventListener('click', onInteract, { once: true });
      window.addEventListener('touchstart', onInteract, { once: true });
    }
  }

  // ── Notify UI của thay đổi ────────────────────────────────────────────
  private notify() {
    this.listeners.forEach(fn => fn());
  }

  subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  // ── Getters ────────────────────────────────────────────────────────────
  getSettings() { return { ...this.settings }; }
  isPlaying() { return this.currentHowl?.playing() ?? false; }
  getCurrentTrackId() { return this.currentTrackId; }

  // ── Nhạc nền ──────────────────────────────────────────────────────────
  playBg(trackId: BgTrackId) {
    if (trackId === 'none') { this.stopBg(); return; }
    if (!this.settings.bgEnabled) return;

    if (!this.userInteracted) {
      this.pendingTrack = trackId;
      return;
    }

    // Nếu đang phát cùng track thì không cần làm gì
    if (this.currentTrackId === trackId && this.currentHowl?.playing()) return;

    this.stopBg(false);
    const track = BG_TRACKS[trackId];
    if (!track.src) return;

    this.currentHowl = new Howl({
      src: [track.src],
      loop: true,
      volume: this.settings.bgVolume,
      html5: true,
      onloaderror: () => { /* skip if file not found */ },
    });
    this.currentHowl.play();
    this.currentTrackId = trackId;
    this.settings.currentTrack = trackId;
    saveSettings(this.settings);
    this.notify();
  }

  stopBg(save = true) {
    if (this.currentHowl) {
      this.currentHowl.fade(this.settings.bgVolume, 0, 500);
      setTimeout(() => { this.currentHowl?.stop(); this.currentHowl?.unload(); this.currentHowl = null; }, 550);
    }
    this.currentTrackId = null;
    if (save) { saveSettings(this.settings); this.notify(); }
  }

  // Đổi track theo route
  playForRoute(pathname: string) {
    const routeTrack = this.settings.routeTracks?.[pathname] ?? this.settings.routeTracks?.['/home'] ?? 'adventure';
    this.playBg(routeTrack);
  }

  // ── SFX ────────────────────────────────────────────────────────────────
  playSfx(type: SfxId) {
    if (!this.settings.sfxEnabled || !this.userInteracted) return;
    createWebAudioSfx(type, this.settings.sfxVolume);
  }

  // ── Cập nhật cài đặt ──────────────────────────────────────────────────
  setBgEnabled(v: boolean) {
    this.settings.bgEnabled = v;
    if (!v) this.stopBg(false);
    else if (this.pendingTrack || this.settings.currentTrack) {
      this.playBg(this.pendingTrack ?? this.settings.currentTrack);
    }
    saveSettings(this.settings);
    this.notify();
  }

  setSfxEnabled(v: boolean) {
    this.settings.sfxEnabled = v;
    saveSettings(this.settings);
    this.notify();
  }

  setBgVolume(v: number) {
    this.settings.bgVolume = v;
    if (this.currentHowl) this.currentHowl.volume(v);
    Howler.volume(v);
    saveSettings(this.settings);
    this.notify();
  }

  setSfxVolume(v: number) {
    this.settings.sfxVolume = v;
    saveSettings(this.settings);
    this.notify();
  }

  // Đặt track cho một route cụ thể
  setRouteTrack(route: string, trackId: BgTrackId) {
    if (!this.settings.routeTracks) this.settings.routeTracks = { ...ROUTE_DEFAULT_TRACK };
    this.settings.routeTracks[route] = trackId;
    saveSettings(this.settings);
    this.notify();
  }

  // Reset về mặc định
  resetSettings() {
    this.stopBg(false);
    this.settings = { ...DEFAULT_SETTINGS };
    saveSettings(this.settings);
    this.notify();
  }
}

// Export singleton
let _instance: AudioManager | null = null;
export function getAudioManager(): AudioManager {
  if (typeof window === 'undefined') {
    // SSR: trả về instance giả
    return new AudioManager();
  }
  if (!_instance) _instance = new AudioManager();
  return _instance;
}

export const audio = {
  play: (trackId: BgTrackId) => getAudioManager().playBg(trackId),
  stop: () => getAudioManager().stopBg(),
  sfx: (id: SfxId) => getAudioManager().playSfx(id),
  forRoute: (pathname: string) => getAudioManager().playForRoute(pathname),
};
