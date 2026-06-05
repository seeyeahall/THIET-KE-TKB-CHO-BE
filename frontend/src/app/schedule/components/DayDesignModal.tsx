'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Mic, MicOff, Bot, Check, GripVertical, Trash2, Undo2 } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '@/lib/api';
import { getDayLabelFull, formatShortDate, parseLocalDate, themeEmoji } from '@/lib/utils/scheduleProgress';
import type { Activity, ScheduleItem } from '@/lib/types';

interface DayDesignModalProps {
  dateStr: string;               // 'YYYY-MM-DD'
  childId: string;
  childName: string;
  childAge?: number;
  initialItems?: ScheduleItem[];
  prefilledTime?: string;        // Giờ pre-filled từ DayView nút +
  onClose: () => void;
  onSaved: () => void;           // refresh Day View sau khi lưu
}

interface DraftItem {
  id: string;
  activity_title: string;
  activity_theme: string;
  start_time: string;
  duration_minutes: number;
  isNew?: boolean;
  activity_id?: string;
}

// Slot giờ bước 30 phút (06:00 → 21:00) — dùng cho drop zones
const TIME_SLOTS_30 = Array.from({ length: 31 }, (_, i) => {
  const totalMin = 6 * 60 + i * 30;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

// FIX: Thêm helper tính phút từ HH:MM
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Thêm N phút vào HH:MM → HH:MM
function addMinutes(t: string, mins: number): string {
  const total = Math.min(timeToMinutes(t) + mins, 21 * 60); // cap tại 21:00
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Kiểm tra 2 items có trùng giờ không
function timeOverlap(
  t1: string, d1: number,
  t2: string, d2: number,
): boolean {
  const s1 = timeToMinutes(t1), e1 = s1 + d1;
  const s2 = timeToMinutes(t2), e2 = s2 + d2;
  return s1 < e2 && s2 < e1;
}

// TTS: Naruto đọc xác nhận
function speak(text: string) {
  if (typeof window === 'undefined') return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'vi-VN';
  utt.rate = 1.1;
  synth.speak(utt);
}

const DEFAULT_DURATION = 30;

export default function DayDesignModal({
  dateStr, childId, childName, childAge, initialItems = [], prefilledTime, onClose, onSaved,
}: DayDesignModalProps) {
  const [draftItems, setDraftItems] = useState<DraftItem[]>(
    initialItems.map(i => ({
      id: i.id,
      activity_title: i.activity?.title ?? 'Hoạt động',
      activity_theme: i.activity?.theme ?? 'Tự chọn',
      start_time: i.start_time ?? '08:00',
      duration_minutes: i.duration_minutes ?? DEFAULT_DURATION,
      activity_id: i.activity_id,
    }))
  );
  const [pool, setPool] = useState<Activity[]>([]);
  const [dragItem, setDragItem] = useState<Activity | null>(null);
  const [dragActiveItem, setDragActiveItem] = useState<DraftItem | null>(null);

  // FIX: Manual entry — khởi tạo newTime từ prefilledTime hoặc giờ tiếp theo
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState(prefilledTime ?? '08:00');
  const [newDuration, setNewDuration] = useState(DEFAULT_DURATION);
  const [conflictWarning, setConflictWarning] = useState(false);

  // AI
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<DraftItem[]>([]);

  // Voice
  const [listeningRole, setListeningRole] = useState<'child' | 'parent' | null>(null);
  const [interimText, setInterimText] = useState('');  // FIX: interim voice text
  const recognitionRef = useRef<any>(null);

  // Undo queue
  const [undoItem, setUndoItem] = useState<DraftItem | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref scroll đến item mới
  const lastItemRef = useRef<HTMLDivElement | null>(null);

  // Saving
  const [saving, setSaving] = useState(false);
  const [isSecure, setIsSecure] = useState(true);

  // Load activity pool
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSecure(window.isSecureContext);
    }
    api.listActivities().then(data => {
      setPool(data.length > 0 ? data.slice(0, 12) : DEMO_POOL);
    }).catch(() => setPool(DEMO_POOL));
  }, []);

  // FIX: Conflict check khi newTime/newDuration thay đổi
  useEffect(() => {
    const conflict = draftItems.some(i =>
      timeOverlap(i.start_time, i.duration_minutes, newTime, newDuration)
    );
    setConflictWarning(conflict);
  }, [newTime, newDuration, draftItems]);

  // ── @dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  );

  // ── DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeId = String(active.id);
    if (activeId.startsWith('pool-')) {
      const activityId = activeId.replace('pool-', '');
      const act = pool.find(a => a.id === activityId);
      if (act) setDragItem(act);
    } else {
      const item = draftItems.find(i => i.id === activeId);
      if (item) setDragActiveItem(item);
    }
  }, [pool, draftItems]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { over } = event;
    if (over) {
      const overId = String(over.id);
      if (overId.startsWith('slot-')) {
        const slot = overId.replace('slot-', '');
        if (dragItem) {
          // FIX: Kéo từ pool → đặt vào slot cụ thể với start_time = slot
          addDraftItem({
            activity_title: dragItem.title,
            activity_theme: dragItem.theme,
            start_time: slot,
            duration_minutes: dragItem.duration_minutes ?? DEFAULT_DURATION,
            activity_id: dragItem.id,
            isNew: true,
          });
        } else if (dragActiveItem) {
          // FIX: Kéo item trong timeline → update start_time THỰC SỰ
          setDraftItems(prev => prev.map(item => {
            if (item.id === dragActiveItem.id) {
              return { ...item, start_time: slot, isNew: true };
            }
            return item;
          }));
        }
      }
    }
    setDragItem(null);
    setDragActiveItem(null);
  }, [dragItem, dragActiveItem]);

  // ── Thêm item
  const addDraftItem = (item: Omit<DraftItem, 'id'>) => {
    const newItem: DraftItem = { ...item, id: `draft-${Date.now()}-${Math.random()}` };
    setDraftItems(prev => [...prev, newItem]);
    // Scroll đến item mới sau render
    setTimeout(() => {
      lastItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const handleAddManual = () => {
    if (!newTitle.trim()) return;
    addDraftItem({
      activity_title: newTitle.trim(),
      activity_theme: 'Tự chọn',
      start_time: newTime,
      duration_minutes: newDuration,
      isNew: true,
    });
    setNewTitle('');
    // FIX: Auto-advance time sang slot tiếp theo
    setNewTime(addMinutes(newTime, newDuration));
  };

  // FIX: Xóa với Undo 5 giây
  const removeDraft = (id: string) => {
    const item = draftItems.find(i => i.id === id);
    if (!item) return;
    setDraftItems(prev => prev.filter(i => i.id !== id));
    setUndoItem(item);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setUndoItem(null), 5000);
  };

  const handleUndo = () => {
    if (!undoItem) return;
    setDraftItems(prev => [...prev, undoItem]);
    setUndoItem(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  };

  // ── FIX: AI gợi ý dùng JSON mode (parseScheduleItemsFromText)
  const handleAiSuggest = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiSuggestions([]);
    try {
      const dayLabel = getDayLabelFull(dateStr);
      const existingItems = draftItems.map(i => ({
        activity_title: i.activity_title,
        start_time: i.start_time,
        duration_minutes: i.duration_minutes,
      }));

      // FIX: Dùng JSON mode API thay vì sendChat + regex
      const parsed = await api.parseScheduleItemsFromText(aiInput, {
        childName,
        childAge,
        dateStr,
        dayLabel,
        existingItems,
      });

      if (parsed.length > 0) {
        setAiSuggestions(
          parsed.map((p, i) => ({
            id: `ai-sug-${i}`,
            activity_title: p.activity_title,
            activity_theme: p.activity_theme,
            start_time: p.start_time,
            duration_minutes: p.duration_minutes,
            isNew: true,
          }))
        );
      } else {
        alert('AI chưa tạo được gợi ý. Thử mô tả cụ thể hơn nhé!');
      }
    } catch {
      alert('AI chưa sẵn sàng. Thêm thủ công nhé!');
    } finally {
      setAiLoading(false);
    }
  };

  // Thêm tất cả AI suggestions
  const confirmAllSuggestions = () => {
    aiSuggestions.forEach(sug => {
      const { id: _id, ...rest } = sug;
      addDraftItem(rest);
    });
    setAiSuggestions([]);
  };

  const confirmAiSuggestion = (sug: DraftItem) => {
    const { id: _id, ...rest } = sug;
    addDraftItem(rest);
    setAiSuggestions(prev => prev.filter(s => s.id !== sug.id));
  };

  // ── FIX: Voice pipeline mới — Intent detection JSON mode
  const startVoice = (role: 'child' | 'parent') => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Trình duyệt không hỗ trợ giọng nói.'); return; }

    const recognition = new SR();
    recognition.lang = 'vi-VN';
    recognition.interimResults = true; // FIX: Bật interim để hiển thị live
    recognition.continuous = false;
    recognitionRef.current = recognition;
    setListeningRole(role);
    setInterimText('');

    let safetyTimer = setTimeout(() => {
      recognition.stop();
      setListeningRole(null);
    }, 10000);

    // FIX: Interim results → hiển thị text đang nghe live
    recognition.onresult = async (e: any) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      if (interim) setInterimText(interim);

      if (final) {
        clearTimeout(safetyTimer);
        setInterimText('');
        setListeningRole(null);
        setAiInput(final);
        setAiLoading(true);

        try {
          const dayLabel = getDayLabelFull(dateStr);
          const existingItems = draftItems.map(i => ({
            activity_title: i.activity_title,
            start_time: i.start_time,
            duration_minutes: i.duration_minutes,
          }));

          // FIX: Dùng detectVoiceIntent với JSON mode
          const result = await api.detectVoiceIntent(final, {
            childName,
            dateStr,
            dayLabel,
            existingItems,
          });

          if (result.intent === 'add' && result.items && result.items.length > 0) {
            // Auto-apply items
            result.items.forEach(item => {
              addDraftItem({
                activity_title: item.activity_title,
                activity_theme: item.activity_theme,
                start_time: item.start_time,
                duration_minutes: item.duration_minutes,
                isNew: true,
              });
            });
            // FIX: TTS phản hồi Naruto
            speak(result.confirmMessage);
          } else if (result.intent === 'modify' && result.target_title) {
            // Sửa item có tên gần đúng
            setDraftItems(prev => prev.map(item => {
              if (item.activity_title.toLowerCase().includes(result.target_title!.toLowerCase())) {
                return {
                  ...item,
                  start_time: result.new_start_time ?? item.start_time,
                  duration_minutes: result.new_duration_minutes ?? item.duration_minutes,
                  isNew: true,
                };
              }
              return item;
            }));
            speak(result.confirmMessage);
          } else if (result.intent === 'delete' && result.target_title) {
            const found = draftItems.find(i =>
              i.activity_title.toLowerCase().includes(result.target_title!.toLowerCase())
            );
            if (found) removeDraft(found.id);
            speak(result.confirmMessage);
          } else {
            // Fallback: nếu intent không rõ → thêm vào AI suggestions để user confirm
            const items = await api.parseScheduleItemsFromText(final, {
              childName, childAge, dateStr, dayLabel, existingItems,
            });
            if (items.length > 0) {
              setAiSuggestions(items.map((p, i) => ({
                id: `voice-sug-${i}`,
                activity_title: p.activity_title,
                activity_theme: p.activity_theme,
                start_time: p.start_time,
                duration_minutes: p.duration_minutes,
                isNew: true,
              })));
            }
            speak(result.confirmMessage);
          }
        } catch {
          // Hard fallback
          addDraftItem({
            activity_title: final,
            activity_theme: 'Tự chọn',
            start_time: newTime,
            duration_minutes: DEFAULT_DURATION,
            isNew: true,
          });
        }
        setAiLoading(false);
      }
    };

    recognition.onerror = (e: any) => {
      clearTimeout(safetyTimer);
      console.error('Speech recognition error', e);
      setInterimText('');
      setListeningRole(null);
    };

    recognition.onend = () => {
      clearTimeout(safetyTimer);
      setInterimText('');
      setListeningRole(null);
    };

    try {
      recognition.start();
    } catch {
      clearTimeout(safetyTimer);
      setListeningRole(null);
    }
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setInterimText('');
    setListeningRole(null);
  };

  // ── Lưu lịch
  const handleSave = async () => {
    if (draftItems.length === 0) { onClose(); return; }
    setSaving(true);
    try {
      const weekDate = parseLocalDate(dateStr);
      const day = weekDate.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const monday = new Date(weekDate);
      monday.setDate(weekDate.getDate() + mondayOffset);
      const weekStart = `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,'0')}-${String(monday.getDate()).padStart(2,'0')}`;

      let scheduleId: string | null = null;
      try {
        const existing = await api.listSchedules(childId);
        const sched = existing.find(s => s.week_start_date === weekStart);
        if (sched) scheduleId = sched.id;
      } catch { /* ignore */ }

      if (!scheduleId) {
        const newSched = await api.createSchedule({
          child_id: childId,
          title: `Lịch tuần của ${childName}`,
          week_start_date: weekStart,
          theme: 'Tự chọn',
          items: [],
        });
        scheduleId = newSched.id;
      }

      // day_of_week: 0=T2(Mon)...6=CN(Sun) — weekday convention
      const dow = (parseLocalDate(dateStr).getDay() + 6) % 7;

      for (const item of draftItems.filter(i => i.isNew)) {
        let activityId = item.activity_id;
        if (!activityId) {
          const act = await api.createActivity({
            title: item.activity_title,
            theme: item.activity_theme,
            duration_minutes: item.duration_minutes,
          });
          activityId = act.id;
        }
        await api.addScheduleItem(scheduleId!, {
          activity_id: activityId,
          day_of_week: dow,
          start_time: item.start_time,
          duration_minutes: item.duration_minutes,
          sort_order: 0,
        });
      }

      onSaved();
      onClose();
    } catch (e) {
      console.error('Save error:', e);
      // Offline: lưu localStorage
      const newItems = draftItems.filter(i => i.isNew);
      if (newItems.length > 0) {
        try {
          const offlineKey = `offline_drafts_${childId}`;
          const existingOffline = JSON.parse(localStorage.getItem(offlineKey) || '[]');
          const toSave = newItems.map(item => ({
            activity_title: item.activity_title,
            activity_theme: item.activity_theme,
            start_time: item.start_time,
            duration_minutes: item.duration_minutes,
            activity_id: item.activity_id,
            dateStr,
          }));
          localStorage.setItem(offlineKey, JSON.stringify([...existingOffline, ...toSave]));
          alert('Đã lưu tạm thời (offline)! Sẽ tự đồng bộ khi có mạng.');
        } catch { /* ignore */ }
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const itemsSorted = [...draftItems].sort((a, b) => a.start_time.localeCompare(b.start_time));

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const handleClose = () => {
    if (draftItems.length > 0) {
      if (!confirm('Bạn có muốn bỏ qua lịch đã thiết kế không? Lịch chưa được lưu sẽ bị mất.')) return;
    }
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Bottom Sheet */}
      <div className="relative bg-white rounded-t-[2rem] shadow-2xl h-[90dvh] flex flex-col animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-black text-gray-800 text-lg">
              🎨 Thiết kế lịch
            </h3>
            <p className="text-xs font-bold text-kid-orange">
              {getDayLabelFull(dateStr)}, {formatShortDate(dateStr)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400">{draftItems.length} HĐ</span>
            <button onClick={handleClose} className="p-2 rounded-xl hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto overscroll-contain flex-1 px-5 py-4 space-y-5 pb-28">

          {/* ── AI gợi ý + Voice ──────────────────────────────── */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 shadow-sm border border-purple-100">
            <p className="text-xs font-black text-purple-600 mb-3">🤖 Trợ lý AI & Giọng nói</p>

            {/* Voice buttons */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => listeningRole === 'child' ? stopVoice() : startVoice('child')}
                disabled={!!listeningRole && listeningRole !== 'child'}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl font-bold text-xs transition-all ${
                  listeningRole === 'child'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                    : 'bg-white border-2 border-kid-pink text-kid-pink hover:bg-pink-50'
                }`}
              >
                {listeningRole === 'child' ? <MicOff size={18} className="animate-pulse" /> : <Mic size={18} />}
                {listeningRole === 'child' ? 'Dừng nghe' : '🎤 Bé nói'}
              </button>
              <button
                onClick={() => listeningRole === 'parent' ? stopVoice() : startVoice('parent')}
                disabled={!!listeningRole && listeningRole !== 'parent'}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl font-bold text-xs transition-all ${
                  listeningRole === 'parent'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                    : 'bg-white border-2 border-kid-blue text-kid-blue hover:bg-blue-50'
                }`}
              >
                {listeningRole === 'parent' ? <MicOff size={18} className="animate-pulse" /> : <Mic size={18} />}
                {listeningRole === 'parent' ? 'Dừng nghe' : '🎤 Phụ huynh'}
              </button>
            </div>

            {/* FIX: Interim voice text display */}
            {(listeningRole || interimText) && (
              <div className="mb-3 px-3 py-2 bg-white rounded-xl border-2 border-purple-200 min-h-[36px]">
                <p className="text-xs font-bold text-gray-500 flex items-center gap-2">
                  {listeningRole && (
                    <span className="inline-flex gap-0.5 items-end">
                      <span className="w-1 h-2 bg-purple-400 rounded animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-3 bg-purple-500 rounded animate-bounce" style={{ animationDelay: '100ms' }} />
                      <span className="w-1 h-4 bg-purple-600 rounded animate-bounce" style={{ animationDelay: '200ms' }} />
                      <span className="w-1 h-3 bg-purple-500 rounded animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                  {interimText || (listeningRole ? 'Đang nghe...' : '')}
                </p>
              </div>
            )}

            {!isSecure && (
              <p className="text-[10px] text-red-500 font-bold mb-3 text-center">
                ⚠️ Ghi âm yêu cầu HTTPS hoặc localhost
              </p>
            )}

            {/* AI text input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAiSuggest()}
                placeholder="VD: Con muốn học vẽ và bơi lội..."
                className="flex-1 bg-white border-2 border-purple-100 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-purple-300"
              />
              <button
                onClick={handleAiSuggest}
                disabled={!aiInput.trim() || aiLoading}
                className="bg-purple-500 text-white rounded-xl px-3 py-2 font-black disabled:opacity-40 hover:bg-purple-600 transition-colors"
              >
                {aiLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Bot size={16} />
                )}
              </button>
            </div>

            {/* FIX: AI suggestions với Thêm tất cả */}
            {aiSuggestions.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-purple-500">✨ AI gợi ý — Chọn để thêm:</p>
                  {aiSuggestions.length > 1 && (
                    <button
                      onClick={confirmAllSuggestions}
                      className="text-[10px] font-black text-white bg-purple-500 hover:bg-purple-600 rounded-lg px-2 py-1 transition-colors"
                    >
                      Thêm tất cả ({aiSuggestions.length})
                    </button>
                  )}
                </div>
                {aiSuggestions.map(sug => (
                  <div key={sug.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-purple-200 shadow-sm">
                    <span className="text-lg">{themeEmoji(sug.activity_theme)}</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-700">{sug.activity_title}</p>
                      <p className="text-[10px] text-gray-400">{sug.start_time} • {sug.duration_minutes}p • {sug.activity_theme}</p>
                    </div>
                    <button
                      onClick={() => confirmAiSuggestion(sug)}
                      className="bg-kid-green text-white rounded-lg p-1.5 hover:bg-green-600 transition-colors"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── ActivityPool + Timeline với dnd-kit ──────── */}
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div>
              <p className="text-xs font-black text-gray-500 mb-2">
                📦 Kho hoạt động — kéo thả vào lịch
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {pool.map(act => (
                  <DraggablePoolItem key={act.id} activity={act} />
                ))}
              </div>
            </div>

            {/* ── Timeline hợp nhất: items + drop zones cùng 1 container */}
            <div>
              <p className="text-xs font-black text-gray-500 mb-2">⏰ Timeline — kéo vào ô giờ</p>
              <div className="border border-gray-100 rounded-2xl bg-gray-50 overflow-hidden">
                {/* Items đã thêm (sortable) */}
                {itemsSorted.length > 0 && (
                  <SortableContext items={itemsSorted.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="p-3 space-y-1.5 border-b border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 mb-2">Đã thêm vào lịch:</p>
                      {itemsSorted.map((item, idx) => (
                        <div
                          key={item.id}
                          ref={idx === itemsSorted.length - 1 ? lastItemRef : undefined}
                        >
                          <SortableDraftItem item={item} onRemove={removeDraft} />
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                )}

                {/* FIX: Drop zones — LUÔN HIỂN THỊ (không filter bởi isDragging) */}
                <div className="p-3 max-h-60 overflow-y-auto scrollbar-hide">
                  <p className="text-[10px] font-black text-gray-400 mb-2">
                    {dragItem || dragActiveItem ? '📌 Thả vào ô giờ:' : 'Ô giờ trống:'}
                  </p>
                  <div className="space-y-1">
                    {TIME_SLOTS_30.filter(slot =>
                      !itemsSorted.some(i => i.start_time === slot)
                    ).map(slot => (
                      <DroppableTimeSlot
                        key={slot}
                        slot={slot}
                        isDragging={!!(dragItem || dragActiveItem)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* DragOverlay */}
            <DragOverlay>
              {dragItem ? (
                <div className="flex-shrink-0 bg-white border-2 border-kid-orange rounded-xl p-2.5 shadow-xl w-24 text-center select-none opacity-95 rotate-2">
                  <div className="text-xl mb-1">{themeEmoji(dragItem.theme)}</div>
                  <div className="text-[10px] font-bold text-gray-700 truncate">{dragItem.title}</div>
                  <div className="text-[9px] text-orange-400 font-bold">thả vào ô giờ!</div>
                </div>
              ) : dragActiveItem ? (
                <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border-2 border-kid-orange shadow-xl opacity-95 rotate-2 w-64">
                  <GripVertical size={16} className="text-gray-400" />
                  <span className="text-base">{themeEmoji(dragActiveItem.activity_theme)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-700 truncate">{dragActiveItem.activity_title}</p>
                    <p className="text-[10px] text-gray-400">{dragActiveItem.start_time} • {dragActiveItem.duration_minutes}p</p>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* ── FIX: Nhập tay nâng cấp ─────────────────────── */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-black text-gray-500 mb-3">✏️ Thêm nhanh bằng tay</p>
            <div className="space-y-2">
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddManual()}
                placeholder="Tên hoạt động..."
                className="w-full bg-white border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:border-kid-blue"
              />
              <div className="flex gap-2">
                {/* FIX: input type=time step=900 (15p) thay vì select 30p */}
                <div className="flex-1 relative">
                  <input
                    type="time"
                    step="900"
                    min="06:00"
                    max="21:00"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className={`w-full bg-white border-2 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none transition-colors ${
                      conflictWarning ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-kid-blue'
                    }`}
                  />
                  {conflictWarning && (
                    <p className="absolute -bottom-4 left-0 text-[10px] text-red-500 font-bold whitespace-nowrap">
                      ⚠️ Trùng giờ!
                    </p>
                  )}
                </div>
                <select
                  value={newDuration}
                  onChange={e => setNewDuration(Number(e.target.value))}
                  className="flex-1 bg-white border-2 border-gray-200 rounded-xl px-2 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-kid-blue"
                >
                  {[15,20,30,45,60,90,120].map(d => (
                    <option key={d} value={d}>{d} phút</option>
                  ))}
                </select>
                <button
                  onClick={handleAddManual}
                  disabled={!newTitle.trim()}
                  className="bg-kid-blue text-white rounded-xl px-3 py-2 font-black disabled:opacity-40 hover:bg-blue-600 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Undo bar */}
          {undoItem && (
            <div className="flex items-center gap-3 bg-gray-800 text-white rounded-2xl px-4 py-3 animate-fade-in-up">
              <Trash2 size={16} className="text-gray-400 flex-shrink-0" />
              <p className="flex-1 text-xs font-bold truncate">Đã xóa "{undoItem.activity_title}"</p>
              <button
                onClick={handleUndo}
                className="flex items-center gap-1 text-xs font-black text-kid-yellow hover:text-yellow-300 flex-shrink-0"
              >
                <Undo2 size={14} /> Hoàn tác
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pt-4 pb-8 md:pb-6 border-t border-gray-100 bg-white">
          <p className="text-xs text-gray-400 font-bold text-center mb-3">
            {draftItems.length} hoạt động trong lịch ngày này
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-kid-green to-green-500 text-white font-black text-lg py-4 rounded-2xl shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-60"
          >
            {saving ? (
              <div className="w-6 h-6 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>✅ Lưu lịch ngày</>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Demo pool khi backend offline
const DEMO_POOL: Activity[] = [
  { id:'p1', title:'Vẽ tranh', slug:'ve-tranh', theme:'Nghệ thuật', duration_minutes:30, difficulty:'Dễ', requires_parent:false, status:'published' },
  { id:'p2', title:'Đọc sách', slug:'doc-sach', theme:'Học tập', duration_minutes:20, difficulty:'Dễ', requires_parent:false, status:'published' },
  { id:'p3', title:'Bơi lội', slug:'boi-loi', theme:'Vận động', duration_minutes:45, difficulty:'Trung bình', requires_parent:true, status:'published' },
  { id:'p4', title:'Trồng cây', slug:'trong-cay', theme:'Thiên nhiên', duration_minutes:20, difficulty:'Dễ', requires_parent:true, status:'published' },
  { id:'p5', title:'Làm toán', slug:'lam-toan', theme:'Học tập', duration_minutes:25, difficulty:'Dễ', requires_parent:false, status:'published' },
  { id:'p6', title:'Khiêu vũ', slug:'khieu-vu', theme:'Âm nhạc', duration_minutes:20, difficulty:'Dễ', requires_parent:false, status:'published' },
];

// ── @dnd-kit: ActivityPool draggable item
function DraggablePoolItem({ activity }: { activity: Activity }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pool-${activity.id}`,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex-shrink-0 bg-white border-2 rounded-xl p-2.5 cursor-grab active:cursor-grabbing w-24 text-center select-none transition-all touch-none ${
        isDragging
          ? 'opacity-40 border-kid-orange scale-95'
          : 'border-gray-100 hover:border-kid-yellow hover:shadow-md'
      }`}
    >
      <div className="text-xl mb-1">{themeEmoji(activity.theme)}</div>
      <div className="text-[10px] font-bold text-gray-700 truncate">{activity.title}</div>
      <div className="text-[9px] text-gray-400">{activity.duration_minutes}p</div>
    </div>
  );
}

// ── @dnd-kit: Timeline droppable slot — LUÔN HIỂN THỊ
function DroppableTimeSlot({ slot, isDragging }: { slot: string; isDragging: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${slot}` });
  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold border-2 transition-all ${
        isOver
          ? 'border-kid-orange bg-orange-50 text-kid-orange scale-[1.02] shadow-md'
          : isDragging
          ? 'border-yellow-300 bg-yellow-50 text-yellow-500'
          : 'border-dashed border-gray-200 text-gray-300 hover:border-gray-300'
      }`}
    >
      <span className="text-gray-400 w-10 font-mono text-[10px]">{slot}</span>
      <span className="text-[11px]">{isOver ? '📌 Thả vào đây!' : isDragging ? '↓ Kéo đến đây' : 'Trống'}</span>
    </div>
  );
}

// ── @dnd-kit: Timeline sortable item
function SortableDraftItem({ item, onRemove }: { item: DraftItem; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-gray-200 shadow-sm animate-fade-in-up"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 flex-shrink-0 touch-none"
      >
        <GripVertical size={16} />
      </div>
      <span className="text-base flex-shrink-0">{themeEmoji(item.activity_theme)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-700 truncate">{item.activity_title}</p>
        <p className="text-[10px] text-gray-400">{item.start_time} • {item.duration_minutes}p • {item.activity_theme}</p>
      </div>
      <button
        onClick={() => onRemove(item.id)}
        className="text-gray-300 hover:text-red-400 p-1 rounded transition-colors flex-shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}
