'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Mic, MicOff, Wand2, ChevronRight, ChevronLeft,
  Check, Trash2, Clock, Calendar, Sparkles, Plus, AlertCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Child } from '@/lib/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getMondayStr(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const day = d.getDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMon);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
  return `${days[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}`;
}

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'vi-VN'; utt.rate = 1.05;
  window.speechSynthesis.speak(utt);
}

// Kiểm tra 2 items trùng giờ
function hasTimeConflict(
  t1: string, d1: number,
  t2: string, d2: number,
): boolean {
  const toMin = (t: string) => { const [h,m] = t.split(':').map(Number); return h*60+m; };
  const s1 = toMin(t1), e1 = s1+d1, s2 = toMin(t2), e2 = s2+d2;
  return s1 < e2 && s2 < e1;
}

const THEME_BG: Record<string, string> = {
  'Học tập':'bg-blue-50 border-blue-200 text-blue-700',
  'Nghệ thuật':'bg-pink-50 border-pink-200 text-pink-700',
  'Vận động':'bg-green-50 border-green-200 text-green-700',
  'Thiên nhiên':'bg-emerald-50 border-emerald-200 text-emerald-700',
  'Âm nhạc':'bg-purple-50 border-purple-200 text-purple-700',
  'Khoa học':'bg-cyan-50 border-cyan-200 text-cyan-700',
  'Gia đình':'bg-orange-50 border-orange-200 text-orange-700',
  'Tự chọn':'bg-yellow-50 border-yellow-200 text-yellow-700',
};
function themeBg(t: string) { return THEME_BG[t] ?? 'bg-gray-50 border-gray-200 text-gray-700'; }

const DAY_LABELS = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','CN'];

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlanItem {
  id: string;
  day_of_week: number;
  date_str: string;
  start_time: string;
  duration_minutes: number;
  activity_title: string;
  activity_theme: string;
  notes: string;
  emoji: string;
}

interface Plan {
  title: string;
  theme: string;
  scope: 'day' | 'week';
  items: PlanItem[];
  naruto_summary: string;
}

interface ScheduleWizardSheetProps {
  child: Child;
  initialText?: string;                  // Pre-fill từ chat/DayView
  initialScope?: 'day' | 'week';
  initialDate?: string;                  // 'YYYY-MM-DD' nếu scope=day
  onClose: () => void;
  onSaved: (scheduleId: string, weekStart: string) => void;
}

// ── Quick Presets ─────────────────────────────────────────────────────────────

const QUICK_PRESETS = [
  { label: '📅 Hôm nay', scope: 'day' as const, text: 'Lên lịch cho hôm nay' },
  { label: '📆 Cả tuần', scope: 'week' as const, text: 'Lên lịch cả tuần vui vẻ' },
  { label: '🎨 Nghệ thuật', scope: 'week' as const, text: 'Tuần nhiều hoạt động nghệ thuật sáng tạo' },
  { label: '⚡ Vận động', scope: 'week' as const, text: 'Tuần tập trung vận động và thể thao ngoài trời' },
  { label: '📚 Học tập', scope: 'week' as const, text: 'Tuần cân bằng học tập và vui chơi' },
  { label: '🌿 Thiên nhiên', scope: 'week' as const, text: 'Tuần khám phá thiên nhiên và trồng cây' },
];

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ScheduleWizardSheet({
  child, initialText = '', initialScope = 'week', initialDate, onClose, onSaved,
}: ScheduleWizardSheetProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 state
  const [inputText, setInputText] = useState(initialText);
  const [scope, setScope] = useState<'day' | 'week'>(initialScope);
  const [listeningRole, setListeningRole] = useState<'child' | 'parent' | null>(null);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Step 2 state
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [replaceMode, setReplaceMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Step 3 state
  const [savedResult, setSavedResult] = useState<{ scheduleId: string; itemCount: number; weekStart: string } | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ── Voice STT ──────────────────────────────────────────────────────────────

  const startVoice = (role: 'child' | 'parent') => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Trình duyệt không hỗ trợ giọng nói.'); return; }
    const rec = new SR();
    rec.lang = 'vi-VN';
    rec.interimResults = true;
    rec.continuous = false;
    recognitionRef.current = rec;
    setListeningRole(role);
    setInterimText('');

    const timer = setTimeout(() => { rec.stop(); setListeningRole(null); }, 10000);

    rec.onresult = (e: any) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      if (interim) setInterimText(interim);
      if (final) {
        clearTimeout(timer);
        setInputText(final);
        setInterimText('');
        setListeningRole(null);
      }
    };
    rec.onerror = () => { clearTimeout(timer); setListeningRole(null); setInterimText(''); };
    rec.onend = () => { clearTimeout(timer); setListeningRole(null); setInterimText(''); };
    try { rec.start(); } catch { setListeningRole(null); }
  };

  const stopVoice = () => { recognitionRef.current?.stop(); setListeningRole(null); setInterimText(''); };

  // ── Step 1 → 2: Phân tích + Tạo plan ────────────────────────────────────────

  const handleAnalyze = useCallback(async () => {
    if (!inputText.trim() && !scope) return;
    setAnalyzing(true);

    const today = getTodayStr();
    const weekStart = getMondayStr(initialDate);

    try {
      // Bước 1: Phân tích intent
      const analysis = await api.analyzeScheduleRequest(
        inputText || `Tạo lịch ${scope === 'day' ? 'hôm nay' : 'cả tuần'} cho bé`,
        { childName: child.name, childAge: child.age, todayStr: today, currentWeekStart: weekStart }
      );

      // Override scope nếu user đã toggle
      analysis.scope = scope;
      if (scope === 'day') analysis.target_date = initialDate ?? today;
      if (scope === 'week') analysis.target_week_start = weekStart;

      // TTS xác nhận
      speak(analysis.naruto_intro);

      // Bước 2: Tạo plan
      const generatedPlan = await api.generateSchedulePlan(analysis, {
        childName: child.name,
        childAge: child.age,
        interests: child.interests ?? [],
        dislikes: child.dislikes ?? [],
        parentNotes: child.parent_notes,
        existingItems: [],   // TODO: load từ DB nếu cần
        recentActivities: [],
      });

      // Gán ID cho mỗi item để quản lý trong preview
      const itemsWithId: PlanItem[] = generatedPlan.items.map((item, i) => ({
        ...item,
        id: `plan-${i}-${Date.now()}`,
      }));

      setPlan({ ...generatedPlan, items: itemsWithId });
      setPlanItems(itemsWithId);
      setStep(2);

      // TTS summary
      setTimeout(() => speak(generatedPlan.naruto_summary), 300);
    } catch (err) {
      console.error('Analyze error:', err);
      alert('Có lỗi xảy ra. Thử lại nhé!');
    } finally {
      setAnalyzing(false);
    }
  }, [inputText, scope, child, initialDate]);

  // ── Step 2: Edit items ────────────────────────────────────────────────────────

  const updateItem = (id: string, changes: Partial<PlanItem>) => {
    setPlanItems(prev => prev.map(i => i.id === id ? { ...i, ...changes } : i));
  };

  const removeItem = (id: string) => {
    setPlanItems(prev => prev.filter(i => i.id !== id));
  };

  const addItemToDay = (dayOfWeek: number, dateStr: string) => {
    const dayItems = planItems.filter(i => i.day_of_week === dayOfWeek).sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    );
    // Tìm slot trống
    let nextTime = '09:00';
    if (dayItems.length > 0) {
      const last = dayItems[dayItems.length - 1];
      const [h, m] = last.start_time.split(':').map(Number);
      const endMin = h * 60 + m + last.duration_minutes + 30;
      const endH = Math.min(Math.floor(endMin / 60), 19);
      nextTime = `${String(endH).padStart(2,'0')}:${String(endMin % 60).padStart(2,'0')}`;
    }
    const newItem: PlanItem = {
      id: `new-${Date.now()}`,
      day_of_week: dayOfWeek,
      date_str: dateStr,
      start_time: nextTime,
      duration_minutes: 30,
      activity_title: 'Hoạt động mới',
      activity_theme: 'Tự chọn',
      notes: '',
      emoji: '⭐',
    };
    setPlanItems(prev => [...prev, newItem]);
    setEditingId(newItem.id);
  };

  // ── Step 2 → 3: Lưu ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!plan || planItems.length === 0) return;
    setSaving(true);
    try {
      const weekStart = getMondayStr(plan.items[0]?.date_str);
      const result = await api.executeSchedulePlan(
        { ...plan, items: planItems },
        child.id,
        weekStart,
        undefined,
        replaceMode,
      );

      if (result.success) {
        setSavedResult({ scheduleId: result.scheduleId, itemCount: result.itemCount, weekStart });
        setStep(3);
        speak(`Dattebayo! Mình đã lưu ${result.itemCount} hoạt động cho ${child.name} rồi! Chiến thôi! 🍥`);
        onSaved(result.scheduleId, weekStart);
      } else {
        alert('Lưu thất bại. Thử lại nhé!');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Có lỗi khi lưu. Thử lại nhé!');
    } finally {
      setSaving(false);
    }
  };

  // ── Group items by day ────────────────────────────────────────────────────────

  const days = plan ? (plan.scope === 'day'
    ? [{ dow: planItems[0]?.day_of_week ?? 0, date: plan.items[0]?.date_str ?? '' }]
    : Array.from({ length: 7 }, (_, i) => ({
        dow: i,
        date: (() => {
          const weekStr = plan.items.find(it => it.day_of_week === i)?.date_str;
          if (weekStr) return weekStr;
          const base = getMondayStr(plan.items[0]?.date_str);
          const d = new Date(base + 'T00:00:00');
          d.setDate(d.getDate() + i);
          return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        })(),
      }))
  ) : [];

  // ── Conflict detection ────────────────────────────────────────────────────────

  const getConflictIds = (): Set<string> => {
    const conflicts = new Set<string>();
    const byDay: Record<number, PlanItem[]> = {};
    planItems.forEach(i => {
      if (!byDay[i.day_of_week]) byDay[i.day_of_week] = [];
      byDay[i.day_of_week].push(i);
    });
    Object.values(byDay).forEach(items => {
      for (let a = 0; a < items.length; a++) {
        for (let b = a + 1; b < items.length; b++) {
          if (hasTimeConflict(items[a].start_time, items[a].duration_minutes, items[b].start_time, items[b].duration_minutes)) {
            conflicts.add(items[a].id);
            conflicts.add(items[b].id);
          }
        }
      }
    });
    return conflicts;
  };

  if (!mounted) return null;
  const conflictIds = getConflictIds();
  const totalItems = planItems.length;
  const activeDays = new Set(planItems.map(i => i.day_of_week)).size;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={step === 1 ? onClose : undefined} />

      {/* Sheet */}
      <div className="relative mt-auto bg-white rounded-t-[2rem] shadow-2xl h-[95dvh] flex flex-col animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Step back */}
            {step === 2 && (
              <button onClick={() => setStep(1)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
                <ChevronLeft size={20} />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🍥</span>
                <h3 className="font-black text-gray-800 text-lg">
                  {step === 1 ? 'Naruto Planner' : step === 2 ? 'Xem trước lịch' : 'Đã lưu xong!'}
                </h3>
              </div>
              {/* Step dots */}
              <div className="flex gap-1.5 mt-0.5">
                {[1,2,3].map(s => (
                  <div key={s} className={`h-1 rounded-full transition-all ${s === step ? 'w-6 bg-kid-orange' : s < step ? 'w-3 bg-kid-green' : 'w-3 bg-gray-200'}`} />
                ))}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* ── STEP 1: Input ──────────────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Scope toggle */}
            <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
              <button
                onClick={() => setScope('day')}
                className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all ${scope === 'day' ? 'bg-white text-kid-orange shadow-sm' : 'text-gray-400'}`}
              >
                📅 Lịch Ngày
              </button>
              <button
                onClick={() => setScope('week')}
                className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all ${scope === 'week' ? 'bg-white text-kid-orange shadow-sm' : 'text-gray-400'}`}
              >
                📆 Lịch Tuần
              </button>
            </div>

            {/* Voice input */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-4 border border-orange-100">
              <p className="text-xs font-black text-orange-600 mb-3">🎤 Nói chuyện với Naruto</p>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => listeningRole === 'child' ? stopVoice() : startVoice('child')}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl font-bold text-xs transition-all ${
                    listeningRole === 'child' ? 'bg-red-500 text-white shadow-lg' : 'bg-white border-2 border-kid-pink text-kid-pink hover:bg-pink-50'
                  }`}
                >
                  {listeningRole === 'child' ? <MicOff size={18} className="animate-pulse" /> : <Mic size={18} />}
                  {listeningRole === 'child' ? 'Dừng' : '🎤 Bé nói'}
                </button>
                <button
                  onClick={() => listeningRole === 'parent' ? stopVoice() : startVoice('parent')}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl font-bold text-xs transition-all ${
                    listeningRole === 'parent' ? 'bg-red-500 text-white shadow-lg' : 'bg-white border-2 border-kid-blue text-kid-blue hover:bg-blue-50'
                  }`}
                >
                  {listeningRole === 'parent' ? <MicOff size={18} className="animate-pulse" /> : <Mic size={18} />}
                  {listeningRole === 'parent' ? 'Dừng' : '🎤 Phụ huynh'}
                </button>
              </div>

              {/* Interim text */}
              {(listeningRole || interimText) && (
                <div className="bg-white rounded-xl px-3 py-2 border border-orange-200 mb-3 min-h-[36px]">
                  <p className="text-xs font-bold text-gray-500 flex items-center gap-2">
                    {listeningRole && (
                      <span className="flex gap-0.5 items-end">
                        {[2,3,4,3].map((h, i) => (
                          <span key={i} className={`w-1 bg-orange-400 rounded animate-bounce`} style={{ height: h*4, animationDelay: `${i*100}ms` }} />
                        ))}
                      </span>
                    )}
                    {interimText || (listeningRole ? 'Đang nghe...' : '')}
                  </p>
                </div>
              )}

              {/* Text input */}
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={`VD: Con muốn ${scope === 'day' ? 'hôm nay' : 'tuần này'} có học vẽ, bơi lội và đọc sách...`}
                rows={3}
                className="w-full bg-white border-2 border-orange-100 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 placeholder-gray-300 focus:outline-none focus:border-orange-300 resize-none"
              />
            </div>

            {/* Quick presets */}
            <div>
              <p className="text-xs font-black text-gray-500 mb-2">⚡ Chọn nhanh</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PRESETS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => { setInputText(p.text); setScope(p.scope); }}
                    className={`text-xs font-bold px-3 py-2 rounded-xl border-2 transition-all ${
                      inputText === p.text ? 'bg-kid-orange text-white border-kid-orange' : 'bg-white border-gray-200 text-gray-600 hover:border-kid-orange hover:text-kid-orange'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Naruto mascot */}
            <div className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-2xl flex-shrink-0 shadow-md">🍥</div>
              <div>
                <p className="text-sm font-black text-gray-700">Naruto sẽ thiết kế lịch cho bạn!</p>
                <p className="text-xs text-gray-400 font-bold">Mô tả càng chi tiết → lịch càng phù hợp ⚡</p>
              </div>
            </div>
          </div>
        )}

        {/* Nút Phân tích (Step 1 footer) */}
        {step === 1 && (
          <div className="px-5 pt-4 pb-8 border-t border-gray-100 bg-white flex-shrink-0">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full bg-gradient-to-r from-kid-orange to-yellow-400 text-white font-black text-lg py-4 rounded-2xl shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {analyzing ? (
                <>
                  <div className="w-6 h-6 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
                  <span>Naruto đang thiết kế...</span>
                </>
              ) : (
                <>
                  <Wand2 size={22} />
                  <span>✨ Phân tích & Thiết kế</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ── STEP 2: Preview ────────────────────────────────────────────────────── */}
        {step === 2 && plan && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Naruto summary bubble */}
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-xl flex-shrink-0 shadow-md">🍥</div>
                <div className="flex-1 bg-orange-50 border border-orange-200 rounded-2xl rounded-tl-none px-4 py-3">
                  <p className="text-sm font-bold text-gray-700 leading-relaxed">{plan.naruto_summary}</p>
                  <button
                    onClick={() => speak(plan.naruto_summary)}
                    className="text-[10px] font-black text-orange-400 mt-1 flex items-center gap-1 hover:text-orange-600"
                  >
                    🔊 Nghe lại
                  </button>
                </div>
              </div>

              {/* Stats bar */}
              <div className="flex gap-2">
                <div className="flex-1 bg-kid-green/10 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Sparkles size={16} className="text-kid-green" />
                  <span className="text-sm font-black text-kid-green">{totalItems} hoạt động</span>
                </div>
                <div className="flex-1 bg-kid-blue/10 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Calendar size={16} className="text-kid-blue" />
                  <span className="text-sm font-black text-kid-blue">{activeDays} ngày</span>
                </div>
                {conflictIds.size > 0 && (
                  <div className="flex-1 bg-red-50 rounded-xl px-3 py-2 flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-500" />
                    <span className="text-xs font-black text-red-500">Trùng giờ!</span>
                  </div>
                )}
              </div>

              {/* Merge/Replace toggle */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs font-black text-gray-700">{replaceMode ? '♻️ Thay thế lịch cũ' : '➕ Thêm vào lịch hiện có'}</p>
                  <p className="text-[10px] text-gray-400 font-bold">{replaceMode ? 'Xóa lịch cũ, tạo mới hoàn toàn' : 'Giữ nguyên lịch cũ, thêm mới'}</p>
                </div>
                <button
                  onClick={() => setReplaceMode(!replaceMode)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${replaceMode ? 'bg-red-400' : 'bg-kid-green'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${replaceMode ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Timeline by day */}
              {days.map(({ dow, date }) => {
                const items = planItems.filter(i => i.day_of_week === dow).sort((a, b) => a.start_time.localeCompare(b.start_time));
                return (
                  <div key={dow} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    {/* Day header */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                      <div>
                        <span className="text-sm font-black text-gray-700">{DAY_LABELS[dow]}</span>
                        <span className="text-xs text-gray-400 font-bold ml-2">{formatDateLabel(date)}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-400 bg-white rounded-lg px-2 py-0.5">{items.length} HĐ</span>
                    </div>

                    {/* Items */}
                    <div className="divide-y divide-gray-50">
                      {items.map(item => (
                        <div
                          key={item.id}
                          className={`px-4 py-3 transition-colors ${conflictIds.has(item.id) ? 'bg-red-50' : ''}`}
                        >
                          {editingId === item.id ? (
                            // Edit mode
                            <div className="space-y-2">
                              <input
                                autoFocus
                                value={item.activity_title}
                                onChange={e => updateItem(item.id, { activity_title: e.target.value })}
                                className="w-full text-sm font-bold border-2 border-kid-blue rounded-xl px-3 py-1.5 focus:outline-none"
                              />
                              <div className="flex gap-2">
                                <input
                                  type="time" step="900"
                                  value={item.start_time}
                                  onChange={e => updateItem(item.id, { start_time: e.target.value })}
                                  className="flex-1 text-xs font-bold border-2 border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none focus:border-kid-blue"
                                />
                                <select
                                  value={item.duration_minutes}
                                  onChange={e => updateItem(item.id, { duration_minutes: Number(e.target.value) })}
                                  className="flex-1 text-xs font-bold border-2 border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none focus:border-kid-blue"
                                >
                                  {[15,20,30,45,60,90].map(d => <option key={d} value={d}>{d}p</option>)}
                                </select>
                                <button onClick={() => setEditingId(null)} className="bg-kid-green text-white rounded-xl px-3 font-black text-xs">
                                  <Check size={14} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            // View mode
                            <div className="flex items-center gap-3">
                              <span className="text-xl flex-shrink-0">{item.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-gray-700 truncate">{item.activity_title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${themeBg(item.activity_theme)}`}>
                                    {item.activity_theme}
                                  </span>
                                  <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                    <Clock size={10} />{item.start_time} • {item.duration_minutes}p
                                  </span>
                                  {conflictIds.has(item.id) && (
                                    <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                                      <AlertCircle size={10} /> Trùng giờ
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <button
                                  onClick={() => setEditingId(item.id)}
                                  className="w-8 h-8 rounded-xl bg-gray-100 text-gray-500 hover:bg-kid-blue hover:text-white flex items-center justify-center transition-colors"
                                >
                                  <Clock size={14} />
                                </button>
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="w-8 h-8 rounded-xl bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add to this day */}
                    <button
                      onClick={() => addItemToDay(dow, date)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-black text-gray-400 hover:text-kid-orange hover:bg-orange-50 transition-colors border-t border-dashed border-gray-100"
                    >
                      <Plus size={14} /> Thêm hoạt động
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Step 2 footer */}
            <div className="px-5 pt-4 pb-8 border-t border-gray-100 bg-white flex-shrink-0 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => { setStep(1); setPlan(null); setPlanItems([]); }}
                  className="flex-1 bg-gray-100 text-gray-600 font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft size={18} /> Thiết kế lại
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || planItems.length === 0}
                  className="flex-[2] bg-gradient-to-r from-kid-green to-green-500 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] transition-all disabled:opacity-60 shadow-lg"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={20} />
                      <span>Lưu {totalItems} hoạt động</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 3: Success ────────────────────────────────────────────────────── */}
        {step === 3 && savedResult && (
          <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 text-center">
            {/* Confetti emoji animation */}
            <div className="text-7xl mb-4 animate-bounce">🎉</div>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-kid-green to-green-400 flex items-center justify-center text-4xl shadow-xl mb-6">
              ✅
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">Lịch đã được lưu!</h2>
            <p className="text-gray-500 font-bold text-sm mb-6">
              {savedResult.itemCount} hoạt động · {activeDays} ngày · {plan?.theme}
            </p>

            {/* Naruto bubble */}
            <div className="bg-orange-50 border border-orange-200 rounded-2xl px-6 py-4 mb-8 max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🍥</span>
                <span className="font-black text-orange-600">Naruto</span>
              </div>
              <p className="text-sm font-bold text-gray-700">
                Dattebayo! {child.name} đã có lịch rồi! Chiến thôi! ⚡🔥
              </p>
            </div>

            <button
              onClick={() => {
                onClose();
                // Navigate về schedule week view
                router.push('/schedule');
              }}
              className="w-full bg-gradient-to-r from-kid-orange to-yellow-400 text-white font-black text-lg py-4 rounded-2xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
            >
              <ChevronRight size={22} />
              Xem lịch ngay
            </button>
            <button onClick={onClose} className="mt-3 text-gray-400 font-bold text-sm hover:text-gray-600">
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
