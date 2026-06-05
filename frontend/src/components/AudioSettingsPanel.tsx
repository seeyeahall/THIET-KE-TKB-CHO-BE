'use client';

import { useState, useEffect, useCallback } from 'react';
import { Music, Volume2, VolumeX, RotateCcw, Play, ChevronDown } from 'lucide-react';
import { getAudioManager, BG_TRACKS, BgTrackId, SfxId, ROUTE_DEFAULT_TRACK } from '@/lib/audio';

const ROUTES = [
  { path: '/home',       label: 'Trang chủ',   emoji: '🏠' },
  { path: '/schedule',   label: 'Lịch',         emoji: '📅' },
  { path: '/chat',       label: 'Chat Naruto',  emoji: '🍥' },
  { path: '/activities', label: 'Hoạt động',    emoji: '🎯' },
  { path: '/parent',     label: 'Phụ huynh',    emoji: '👨‍👩‍👧' },
];

const SFX_DEMOS: { id: SfxId; label: string; emoji: string }[] = [
  { id: 'pop',         label: 'Bấm nút',        emoji: '👆' },
  { id: 'ding',        label: 'Thêm HĐ',        emoji: '➕' },
  { id: 'save',        label: 'Lưu lịch',       emoji: '💾' },
  { id: 'drag',        label: 'Kéo thả',        emoji: '✋' },
  { id: 'drop',        label: 'Thả xuống',      emoji: '📌' },
  { id: 'delete',      label: 'Xoá',            emoji: '🗑️' },
  { id: 'achievement', label: 'Thành tích',     emoji: '🏆' },
  { id: 'welcome',     label: 'Chào mừng',      emoji: '🎉' },
];

function useAudio() {
  const manager = getAudioManager();
  const [settings, setSettings] = useState(manager.getSettings());
  useEffect(() => manager.subscribe(() => setSettings(manager.getSettings())), [manager]);
  return { settings, manager };
}

export default function AudioSettingsPanel() {
  const { settings, manager } = useAudio();
  const [saved, setSaved] = useState(false);

  const showSaved = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-kid-orange/10 rounded-2xl flex items-center justify-center">
          <Music size={20} className="text-kid-orange" />
        </div>
        <div>
          <h3 className="font-black text-gray-800 text-base">Cài đặt Âm Thanh</h3>
          <p className="text-xs text-gray-400 font-bold">Tuỳ chỉnh nhạc nền và hiệu ứng</p>
        </div>
      </div>

      {/* Toggle nhạc nền */}
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎵</span>
            <div>
              <div className="font-black text-sm text-gray-800">Nhạc nền</div>
              <div className="text-xs text-gray-400">Phát nhạc theo từng màn hình</div>
            </div>
          </div>
          <button
            onClick={() => { manager.setBgEnabled(!settings.bgEnabled); showSaved(); }}
            className={`w-12 h-6 rounded-full transition-colors relative ${settings.bgEnabled ? 'bg-kid-green' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.bgEnabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
        {settings.bgEnabled && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <VolumeX size={12} className="text-gray-400" />
              <input
                type="range" min="0" max="1" step="0.05"
                value={settings.bgVolume}
                onChange={e => { manager.setBgVolume(Number(e.target.value)); showSaved(); }}
                className="flex-1 h-2 rounded-full accent-kid-green cursor-pointer"
              />
              <Volume2 size={12} className="text-kid-green" />
              <span className="text-xs font-bold text-gray-500 w-8 text-right">{Math.round(settings.bgVolume * 100)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Toggle SFX */}
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔔</span>
            <div>
              <div className="font-black text-sm text-gray-800">Hiệu ứng âm thanh</div>
              <div className="text-xs text-gray-400">Tiếng bấm, lưu, kéo thả...</div>
            </div>
          </div>
          <button
            onClick={() => { manager.setSfxEnabled(!settings.sfxEnabled); showSaved(); }}
            className={`w-12 h-6 rounded-full transition-colors relative ${settings.sfxEnabled ? 'bg-kid-blue' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.sfxEnabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
        {settings.sfxEnabled && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <VolumeX size={12} className="text-gray-400" />
              <input
                type="range" min="0" max="1" step="0.05"
                value={settings.sfxVolume}
                onChange={e => { manager.setSfxVolume(Number(e.target.value)); showSaved(); }}
                className="flex-1 h-2 rounded-full accent-kid-blue cursor-pointer"
              />
              <Volume2 size={12} className="text-kid-blue" />
              <span className="text-xs font-bold text-gray-500 w-8 text-right">{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            {/* Demo SFX */}
            <div className="grid grid-cols-4 gap-1.5">
              {SFX_DEMOS.map(sfx => (
                <button
                  key={sfx.id}
                  onClick={() => manager.playSfx(sfx.id)}
                  className="bg-white rounded-xl p-2 text-center border border-gray-100 hover:border-kid-blue hover:bg-kid-blue/5 transition-all active:scale-95"
                >
                  <div className="text-lg">{sfx.emoji}</div>
                  <div className="text-[9px] font-bold text-gray-500 mt-0.5 leading-tight">{sfx.label}</div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2 text-center">Bấm để nghe thử từng hiệu ứng</p>
          </div>
        )}
      </div>

      {/* Cài track theo màn hình */}
      {settings.bgEnabled && (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🗺️</span>
            <div>
              <div className="font-black text-sm text-gray-800">Nhạc theo màn hình</div>
              <div className="text-xs text-gray-400">Chọn track riêng cho từng trang</div>
            </div>
          </div>
          <div className="space-y-2">
            {ROUTES.map(route => {
              const currentTrack = (settings.routeTracks?.[route.path] ?? 'adventure') as BgTrackId;
              return (
                <div key={route.path} className="flex items-center justify-between gap-2 bg-white rounded-xl p-3 border border-gray-100">
                  <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                    <span>{route.emoji}</span> {route.label}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        manager.playBg(currentTrack);
                      }}
                      className="w-6 h-6 rounded-full bg-kid-orange/10 text-kid-orange flex items-center justify-center hover:bg-kid-orange/20 transition-colors"
                      title="Nghe thử"
                    >
                      <Play size={10} />
                    </button>
                    <select
                      value={currentTrack}
                      onChange={e => { manager.setRouteTrack(route.path, e.target.value as BgTrackId); showSaved(); }}
                      className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-kid-orange appearance-none cursor-pointer pr-5 relative"
                      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
                    >
                      {(Object.entries(BG_TRACKS) as [BgTrackId, { label: string; emoji: string }][]).map(([id, t]) => (
                        <option key={id} value={id}>{t.emoji} {t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Track đang phát hiện tại */}
      {settings.bgEnabled && (
        <div className="bg-gradient-to-r from-kid-orange/10 to-kid-yellow/20 rounded-2xl p-4">
          <div className="text-xs font-bold text-gray-500 mb-2">🎶 Đang phát</div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(BG_TRACKS) as [BgTrackId, { label: string; emoji: string }][]).map(([id, t]) => (
              <button
                key={id}
                onClick={() => { manager.playBg(id); showSaved(); }}
                className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border-2 transition-all active:scale-95 ${
                  settings.currentTrack === id
                    ? 'border-kid-orange bg-kid-orange/20 text-kid-orange shadow-sm'
                    : 'border-transparent bg-white/70 text-gray-500 hover:border-gray-200'
                }`}
              >
                <span className="text-xl">{t.emoji}</span>
                <span style={{ fontSize: '10px' }} className="text-center leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reset */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => { manager.resetSettings(); showSaved(); }}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-400 transition-colors"
        >
          <RotateCcw size={13} />
          Về mặc định
        </button>
        {saved && (
          <span className="text-xs font-bold text-kid-green animate-fade-in-up">✓ Đã lưu</span>
        )}
      </div>
    </div>
  );
}
