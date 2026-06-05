'use client';

import { useEffect, useState, useCallback } from 'react';
import { Volume2, VolumeX, Music, ChevronDown } from 'lucide-react';
import { getAudioManager, BG_TRACKS, BgTrackId, SfxId } from '@/lib/audio';

// Hook dùng để subscribe AudioManager state
function useAudio() {
  const manager = getAudioManager();
  const [settings, setSettings] = useState(manager.getSettings());

  useEffect(() => {
    const unsub = manager.subscribe(() => setSettings(manager.getSettings()));
    return unsub;
  }, [manager]);

  return { settings, manager };
}

// ── Nút nổi (Floating Button) ─────────────────────────────────────────────
export default function AudioController() {
  const { settings, manager } = useAudio();
  const [open, setOpen] = useState(false);

  // Đóng panel khi bấm ra ngoài
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const el = document.getElementById('audio-controller-panel');
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    setTimeout(() => window.addEventListener('click', handler), 100);
    return () => window.removeEventListener('click', handler);
  }, [open]);

  const isMuted = !settings.bgEnabled && !settings.sfxEnabled;

  return (
    <div id="audio-controller-panel" className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
      {/* Panel mở rộng */}
      {open && (
        <div className="bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 p-4 w-72 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Music size={18} className="text-kid-orange" />
            <span className="font-black text-gray-800 text-sm">Âm Thanh</span>
          </div>

          {/* Nhạc nền */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-600">🎵 Nhạc nền</span>
              <button
                onClick={() => manager.setBgEnabled(!settings.bgEnabled)}
                className={`w-10 h-5 rounded-full transition-colors relative ${settings.bgEnabled ? 'bg-kid-green' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.bgEnabled ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            {settings.bgEnabled && (
              <input
                type="range" min="0" max="1" step="0.05"
                value={settings.bgVolume}
                onChange={e => manager.setBgVolume(Number(e.target.value))}
                className="w-full h-1.5 rounded-full accent-kid-green cursor-pointer"
              />
            )}
          </div>

          {/* Hiệu ứng âm thanh */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-600">🔔 Hiệu ứng</span>
              <button
                onClick={() => manager.setSfxEnabled(!settings.sfxEnabled)}
                className={`w-10 h-5 rounded-full transition-colors relative ${settings.sfxEnabled ? 'bg-kid-blue' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.sfxEnabled ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            {settings.sfxEnabled && (
              <input
                type="range" min="0" max="1" step="0.05"
                value={settings.sfxVolume}
                onChange={e => manager.setSfxVolume(Number(e.target.value))}
                className="w-full h-1.5 rounded-full accent-kid-blue cursor-pointer"
              />
            )}
          </div>

          {/* Chọn track nhạc nền đang phát */}
          {settings.bgEnabled && (
            <div>
              <span className="text-xs font-bold text-gray-600 block mb-2">🎶 Track hiện tại</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.entries(BG_TRACKS) as [BgTrackId, { label: string; emoji: string }][]).map(([id, t]) => (
                  <button
                    key={id}
                    onClick={() => { manager.playBg(id); }}
                    className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 border-2 ${
                      settings.currentTrack === id
                        ? 'border-kid-orange bg-kid-orange/10 text-kid-orange'
                        : 'border-transparent bg-gray-50 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    <span className="text-base">{t.emoji}</span>
                    <span className="leading-tight text-center" style={{ fontSize: '9px' }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nút nổi */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
          isMuted ? 'bg-gray-200 text-gray-400' : 'bg-white text-kid-orange border-2 border-kid-orange/20'
        }`}
        title="Cài đặt âm thanh"
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </div>
  );
}
