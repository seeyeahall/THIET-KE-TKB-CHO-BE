'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Mic, MicOff, Bot, Check, GripVertical } from 'lucide-react';
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
  initialItems?: ScheduleItem[];
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

// Slot giờ (06:00 → 21:00 mỗi 30 phút)
const TIME_SLOTS = Array.from({ length: 31 }, (_, i) => {
  const totalMin = 6 * 60 + i * 30;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

const DEFAULT_DURATION = 30;

export default function DayDesignModal({
  dateStr, childId, childName, initialItems = [], onClose, onSaved,
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
  const [dragSlot, setDragSlot] = useState<string | null>(null);

  // Text input
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newDuration, setNewDuration] = useState(DEFAULT_DURATION);

  // AI
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<DraftItem[]>([]);

  // Voice
  const [listeningRole, setListeningRole] = useState<'child' | 'parent' | null>(null);
  const recognitionRef = useRef<any>(null);

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

  // ── @dnd-kit sensors — hỗ trợ cả mouse lẫn touch mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // chết để bé scroll thoải mái
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 }, // hold 250ms để DnD, tách với scroll
    })
  );

  // ── DnD handlers — dùng @dnd-kit events
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
          addDraftItem({
            activity_title: dragItem.title,
            activity_theme: dragItem.theme,
            start_time: slot,
            duration_minutes: dragItem.duration_minutes ?? DEFAULT_DURATION,
            activity_id: dragItem.id,
            isNew: true,
          });
        } else if (dragActiveItem) {
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
    setDragSlot(null);
  }, [dragItem, dragActiveItem]);

  // ── Thêm item ────────────────────────────────────────────────────────────────
  const addDraftItem = (item: Omit<DraftItem, 'id'>) => {
    setDraftItems(prev => [
      ...prev,
      { ...item, id: `draft-${Date.now()}-${Math.random()}` },
    ]);
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
  };

  const removeDraft = (id: string) => {
    setDraftItems(prev => prev.filter(i => i.id !== id));
  };

  // ── AI gợi ý ─────────────────────────────────────────────────────────────────
  const handleAiSuggest = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    try {
      const dayLabel = getDayLabelFull(dateStr);
      const prompt = `Bé ${childName}, ngày ${dayLabel} (${formatShortDate(dateStr)}). Yêu cầu: ${aiInput}. Hãy gợi ý danh sách hoạt động với giờ cụ thể cho ngày này dưới dạng JSON: [{title, theme, start_time (HH:mm), duration_minutes}]`;
      const result = await api.sendChat(childId, prompt);
      // Parse JSON từ reply nếu có
      const jsonMatch = result.reply.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setAiSuggestions(
          parsed.map((p: any, i: number) => ({
            id: `ai-sug-${i}`,
            activity_title: p.title ?? 'Hoạt động',
            activity_theme: p.theme ?? 'Tự chọn',
            start_time: p.start_time ?? '08:00',
            duration_minutes: p.duration_minutes ?? 30,
            isNew: true,
          }))
        );
      } else {
        // Tạo gợi ý đơn giản từ reply text
        setAiSuggestions([{
          id: 'ai-sug-0',
          activity_title: aiInput,
          activity_theme: 'Tự chọn',
          start_time: '08:00',
          duration_minutes: 30,
          isNew: true,
        }]);
      }
    } catch {
      alert('AI chưa sẵn sàng. Thêm thủ công nhé!');
    } finally {
      setAiLoading(false);
    }
  };

  const confirmAiSuggestion = (sug: DraftItem) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...rest } = sug;
    addDraftItem(rest);
    setAiSuggestions(prev => prev.filter(s => s.id !== sug.id));
  };

  // ── Voice STT ────────────────────────────────────────────────────────────────
  const startVoice = (role: 'child' | 'parent') => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Trình duyệt không hỗ trợ giọng nói.'); return; }

    const recognition = new SR();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognitionRef.current = recognition;
    setListeningRole(role);

    // Watchdog timer to prevent hanging in "listening" state on some test/headless environments
    let safetyTimer = setTimeout(() => {
      console.warn('Speech recognition safety timeout triggered.');
      recognition.stop();
      setListeningRole(null);
    }, 8000);

    recognition.onstart = () => {
      clearTimeout(safetyTimer);
      safetyTimer = setTimeout(() => {
        recognition.stop();
        setListeningRole(null);
      }, 10000);
    };

    recognition.onresult = async (e: any) => {
      clearTimeout(safetyTimer);
      const text = e.results[0][0].transcript;
      setListeningRole(null);
      setAiInput(text);
      // Tự động gửi AI
      setAiLoading(true);
      try {
        const prompt = role === 'parent'
          ? `Phụ huynh ra lệnh: "${text}". Tạo lịch hoạt động cho bé ${childName} ngày ${formatShortDate(dateStr)} dạng JSON: [{title, theme, start_time, duration_minutes}]`
          : `Bé ${childName} nói: "${text}". Gợi ý hoạt động cho ngày ${formatShortDate(dateStr)} dạng JSON: [{title, theme, start_time, duration_minutes}]`;
        const result = await api.sendChat(childId, prompt);
        const jsonMatch = result.reply.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setAiSuggestions(
            parsed.map((p: any, i: number) => ({
              id: `voice-sug-${i}`,
              activity_title: p.title ?? 'Hoạt động',
              activity_theme: p.theme ?? 'Tự chọn',
              start_time: p.start_time ?? '08:00',
              duration_minutes: p.duration_minutes ?? 30,
              isNew: true,
            }))
          );
        } else {
          // Fallback: thêm trực tiếp
          addDraftItem({
            activity_title: text,
            activity_theme: 'Tự chọn',
            start_time: '08:00',
            duration_minutes: 30,
            isNew: true,
          });
        }
      } catch {
        addDraftItem({
          activity_title: text,
          activity_theme: 'Tự chọn',
          start_time: '08:00',
          duration_minutes: 30,
          isNew: true,
        });
      }
      setAiLoading(false);
    };

    recognition.onerror = (e: any) => {
      clearTimeout(safetyTimer);
      console.error('Speech recognition error', e);
      alert('Lỗi nhận diện giọng nói: ' + e.error + '. Vui lòng kiểm tra quyền micro hoặc thử gõ tay.');
      setListeningRole(null);
    };
    
    recognition.onend = () => {
      clearTimeout(safetyTimer);
      setListeningRole(null);
    };
    
    try {
      recognition.start();
    } catch (err) {
      clearTimeout(safetyTimer);
      alert('Không thể bắt đầu ghi âm. Thử lại sau.');
      setListeningRole(null);
    }
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setListeningRole(null);
  };

  // ── Lưu lịch ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (draftItems.length === 0) { onClose(); return; }
    setSaving(true);
    try {
      // Tạo schedule nếu chưa có
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
      } catch {}

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
      // JS getDay(): 0=CN, 1=T2... → convert: (getDay()+6)%7
      const dow = (parseLocalDate(dateStr).getDay() + 6) % 7;

      // Thêm từng item mới
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
      // Save unsaved draft items to localStorage for syncing later
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
          alert('Đã lưu lịch tạm thời ở chế độ ngoại tuyến! Lịch sẽ tự động đồng bộ khi bạn có mạng trở lại.');
        } catch (storageErr) {
          console.error('Failed to save to localStorage:', storageErr);
        }
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
          <button onClick={handleClose} className="p-2 rounded-xl hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto overscroll-contain flex-1 px-5 py-4 space-y-5 pb-20">

          {/* ── AI gợi ý + Voice ──────────────────────────────── */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 shadow-sm border border-purple-100">
            <p className="text-xs font-black text-purple-600 mb-3">🤖 Trợ lý AI & Giọng nói</p>

            {/* Voice buttons */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => listeningRole === 'child' ? stopVoice() : startVoice('child')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  listeningRole === 'child'
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-white border-2 border-kid-pink text-kid-pink hover:bg-pink-50'
                }`}
              >
                {listeningRole === 'child' ? <MicOff size={14} /> : <Mic size={14} />}
                {listeningRole === 'child' ? 'Đang nghe...' : '🎤 Bé nói'}
              </button>
              <button
                onClick={() => listeningRole === 'parent' ? stopVoice() : startVoice('parent')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  listeningRole === 'parent'
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-white border-2 border-kid-blue text-kid-blue hover:bg-blue-50'
                }`}
              >
                {listeningRole === 'parent' ? <MicOff size={14} /> : <Mic size={14} />}
                {listeningRole === 'parent' ? 'Đang nghe...' : '🎤 Phụ huynh'}
              </button>
            </div>
            {!isSecure && (
              <p className="text-[10px] text-red-500 font-bold mb-3 text-center">
                ⚠️ Ghi âm giọng nói yêu cầu kết nối bảo mật HTTPS (hoặc localhost)
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

            {/* AI gợi ý */}
            {aiSuggestions.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-[10px] font-black text-purple-500">✨ AI gợi ý — Chọn để thêm:</p>
                {aiSuggestions.map(sug => (
                  <div key={sug.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-purple-200">
                    <span>{themeEmoji(sug.activity_theme)}</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-700">{sug.activity_title}</p>
                      <p className="text-[10px] text-gray-400">{sug.start_time} • {sug.duration_minutes}p</p>
                    </div>
                    <button
                      onClick={() => confirmAiSuggestion(sug)}
                      className="bg-kid-green text-white rounded-lg p-1.5 hover:bg-green-600"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── ActivityPool ─────────────────────────────────────── */}
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

            {/* ── Timeline với drop zones ─────────────────────────── */}
            <div>
              <p className="text-xs font-black text-gray-500 mb-2">⏰ Timeline ngày</p>
              <div className="space-y-1 max-h-72 overflow-y-auto border border-gray-100 rounded-2xl p-3 bg-gray-50 scrollbar-hide">
                {/* Items đã thêm */}
                {itemsSorted.length > 0 && (
                  <SortableContext items={itemsSorted.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1 mb-2">
                      {itemsSorted.map(item => (
                        <SortableDraftItem key={item.id} item={item} onRemove={removeDraft} />
                      ))}
                    </div>
                  </SortableContext>
                )}

                {/* Drop zones — @dnd-kit DroppableTimeSlot (touch-enabled) */}
                {TIME_SLOTS.filter(slot =>
                  !itemsSorted.some(i => i.start_time === slot)
                ).map(slot => (
                  <DroppableTimeSlot key={slot} slot={slot} isDragging={!!dragItem || !!dragActiveItem} />
                ))}
              </div>
            </div>

            {/* DragOverlay — preview đẹp khi đang kéo */}
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


          {/* ── Nhập text nhanh ───────────────────────────────── */}
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
                <select
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  className="flex-1 bg-white border-2 border-gray-200 rounded-xl px-2 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-kid-blue"
                >
                  {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
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


        </div>

        {/* Footer */}
        <div className="px-5 pt-4 pb-8 md:pb-6 border-t border-gray-100 bg-white pb-safe">
          <p className="text-xs text-gray-400 font-bold text-center mb-3">
            {draftItems.length} hoạt động trong lịch ngày này
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-kid-green to-green-500 text-white font-black text-lg py-4 rounded-2xl shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-60"
          >
            {saving ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
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

// ── @dnd-kit: ActivityPool draggable item ─────────────────────────────────────
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

// ── @dnd-kit: Timeline droppable slot ────────────────────────────────────────
function DroppableTimeSlot({ slot, isDragging }: { slot: string; isDragging: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${slot}` });
  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold border-2 border-dashed transition-all ${
        isOver
          ? 'border-kid-orange bg-orange-50 text-kid-orange scale-[1.02] shadow-md'
          : isDragging
          ? 'border-yellow-200 bg-yellow-50 text-yellow-400'
          : 'border-gray-200 text-gray-300'
      }`}
    >
      <span className="text-gray-400 w-10 font-mono">{slot}</span>
      <span>{isOver ? '📌 Thả vào đây!' : isDragging ? '↓ Kéo đến đây' : 'Trống'}</span>
    </div>
  );
}

// ── @dnd-kit: Timeline sortable item ──────────────────────────────────────────
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
      className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200 shadow-sm animate-fade-in-up"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
      >
        <GripVertical size={16} />
      </div>
      <span className="text-base flex-shrink-0">{themeEmoji(item.activity_theme)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-700 truncate">{item.activity_title}</p>
        <p className="text-[10px] text-gray-400">{item.start_time} • {item.duration_minutes}p</p>
      </div>
      <button
        onClick={() => onRemove(item.id)}
        className="text-gray-300 hover:text-red-400 p-0.5 rounded flex-shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}

