'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wand2, Plus, CheckCircle2, Clock } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import SkeletonPage from '@/components/SkeletonPage';

const DAYS = [
  { id: 1, name: 'Thứ 2' },
  { id: 2, name: 'Thứ 3' },
  { id: 3, name: 'Thứ 4' },
  { id: 4, name: 'Thứ 5' },
  { id: 5, name: 'Thứ 6' },
  { id: 6, name: 'Thứ 7' },
  { id: 0, name: 'Chủ Nhật' },
];

interface ScheduleItemView {
  id: string;
  day_of_week: number;
  start_time: string;
  duration_minutes: number;
  activity_title: string;
  activity_theme: string;
  status: string;
}

export default function SchedulePage() {
  const router = useRouter();
  const { selectedChild } = useAppStore();
  const [schedule, setSchedule] = useState<ScheduleItemView[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [rewardPopups, setRewardPopups] = useState<{ id: string; xp: number }[]>([]);

  // Add form state
  const [addTitle, setAddTitle] = useState('');
  const [addTime, setAddTime] = useState('08:00');
  const [addDuration, setAddDuration] = useState('30');
  
  const [scheduleId, setScheduleId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedChild) {
      router.push('/select-child');
      return;
    }
    fetchSchedule();
  }, [selectedChild, router]);

  const fetchSchedule = () => {
    setLoading(true);
    api.listSchedules(selectedChild!.id)
      .then((data) => {
        if (data.length > 0) {
          setScheduleId(data[0].id);
          if (data[0].items) {
            setSchedule(
              data[0].items.map((item) => ({
                id: item.id,
                day_of_week: item.day_of_week,
                start_time: item.start_time ?? '08:00',
                duration_minutes: item.duration_minutes,
                activity_title: item.activity?.title ?? 'Hoạt động',
                activity_theme: item.activity?.theme ?? 'Khác',
                status: item.status ?? 'planned',
              }))
            );
          }
        }
      })
      .catch(() => {
        setSchedule([
          { id: '1', day_of_week: 1, start_time: '08:00', duration_minutes: 30, activity_title: 'Đọc sách', activity_theme: 'Học tập', status: 'planned' },
          { id: '2', day_of_week: 1, start_time: '15:00', duration_minutes: 45, activity_title: 'Vẽ tranh', activity_theme: 'Nghệ thuật', status: 'planned' },
          { id: '3', day_of_week: 2, start_time: '16:00', duration_minutes: 60, activity_title: 'Bơi lội', activity_theme: 'Vận động', status: 'planned' },
        ]);
      })
      .finally(() => setLoading(false));
  };

  const generateAI = async () => {
    if (!selectedChild) return;
    setGenerating(true);
    try {
      const result = await api.generateSchedule(selectedChild.id, new Date().toISOString().split('T')[0], 'tự chọn');
      if (result.schedule?.items) {
        setSchedule(
          result.schedule.items.map((item, idx) => ({
            id: `ai-${idx}`,
            day_of_week: item.day_of_week,
            start_time: item.start_time,
            duration_minutes: item.duration_minutes,
            activity_title: item.activity_title,
            activity_theme: item.activity_theme,
            status: 'planned',
          }))
        );
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCompleteItem = async (itemId: string) => {
    if (!selectedChild) return;
    try {
      const res = await api.completeActivity(selectedChild.id, itemId);
      if (res.status === 'success') {
        setSchedule((prev) => prev.map((i) => i.id === itemId ? { ...i, status: 'completed' } : i));
        triggerReward(res.xp_earned);
      }
    } catch (error) {
      setSchedule((prev) => prev.map((i) => i.id === itemId ? { ...i, status: 'completed' } : i));
      triggerReward(15);
    }
  };

  const triggerReward = (xp: number) => {
    const popupId = Date.now().toString();
    setRewardPopups((prev) => [...prev, { id: popupId, xp }]);
    setTimeout(() => {
      setRewardPopups((prev) => prev.filter((p) => p.id !== popupId));
    }, 3000);
  };

  const handleAddManual = async () => {
    if (!addTitle.trim() || !selectedChild) return;
    
    try {
      let currentScheduleId = scheduleId;
      if (!currentScheduleId) {
        // Create a new schedule if none exists
        const newSched = await api.createSchedule({
          child_id: selectedChild.id,
          title: `Lịch tuần của ${selectedChild.name}`,
          week_start_date: new Date().toISOString().split('T')[0],
          theme: 'Tự chọn',
          items: []
        });
        currentScheduleId = newSched.id;
        setScheduleId(newSched.id);
      }
      
      // Create activity first
      const newActivity = await api.createActivity({
        title: addTitle,
        theme: 'Tự chọn',
        duration_minutes: parseInt(addDuration, 10),
      });

      // Add item to schedule
      await api.addScheduleItem(currentScheduleId!, {
        activity_id: newActivity.id,
        day_of_week: selectedDay,
        start_time: addTime,
        duration_minutes: parseInt(addDuration, 10),
        sort_order: 0
      });
      
      // Refresh schedule
      fetchSchedule();
      setShowAddModal(false);
      setAddTitle('');
    } catch (e) {
      console.error(e);
      alert('Đã xảy ra lỗi khi lưu hoạt động!');
    }
  };

  if (!selectedChild) return null;
  if (loading) return <SkeletonPage cardCount={4} />;

  return (
    <main className="min-h-screen p-6 pb-24 bg-gray-50">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          <h2 className="text-3xl font-black text-kid-orange">
            📅 Lịch của {selectedChild.name}
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 bg-kid-blue text-white px-4 py-3 rounded-2xl font-black text-sm flex justify-center items-center gap-2 hover:scale-[1.02] transition-transform shadow-sm"
            >
              <Plus size={18} />
              Thêm hoạt động
            </button>
            <button
              onClick={generateAI}
              disabled={generating}
              className="flex-1 bg-kid-green text-white px-4 py-3 rounded-2xl font-black text-sm flex justify-center items-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-sm"
            >
              <Wand2 size={18} />
              {generating ? 'Đang tạo...' : 'AI Lên Lịch'}
            </button>
          </div>
        </div>

        {/* Vertical Schedule View */}
        <div className="space-y-8">
          {DAYS.map((day) => {
            const dayItems = schedule.filter((s) => s.day_of_week === day.id).sort((a, b) => a.start_time.localeCompare(b.start_time));
            if (dayItems.length === 0) return null;

            return (
              <div key={day.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-xl font-black text-gray-800 mb-4 border-b-2 border-kid-orange/20 pb-2 inline-block">
                  {day.name}
                </h3>
                <div className="space-y-3">
                  {dayItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                        item.status === 'completed'
                          ? 'bg-gray-50 border-gray-100 opacity-70'
                          : 'bg-white border-kid-blue/20 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center min-w-[60px]">
                        <span className="text-lg font-black text-gray-700">{item.start_time}</span>
                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                          <Clock size={10} /> {item.duration_minutes}p
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-black text-gray-800 text-lg">{item.activity_title}</div>
                        <div className="text-sm font-bold text-kid-blue">{item.activity_theme}</div>
                      </div>
                      <button
                        onClick={() => handleCompleteItem(item.id)}
                        disabled={item.status === 'completed'}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform ${
                          item.status === 'completed'
                            ? 'bg-kid-green text-white'
                            : 'bg-gray-100 text-gray-400 hover:bg-kid-green/20 hover:text-kid-green hover:scale-110'
                        }`}
                      >
                        <CheckCircle2 size={24} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl">
              <h3 className="text-2xl font-black text-gray-800 mb-6">Thêm hoạt động mới</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">Tên hoạt động</label>
                  <input
                    type="text"
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    placeholder="VD: Đọc sách tranh..."
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-kid-blue"
                  />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-600 mb-1">Ngày</label>
                    <select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(Number(e.target.value))}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-kid-blue"
                    >
                      {DAYS.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-600 mb-1">Giờ</label>
                    <input
                      type="time"
                      value={addTime}
                      onChange={(e) => setAddTime(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-kid-blue"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">Thời lượng (phút)</label>
                  <select
                    value={addDuration}
                    onChange={(e) => setAddDuration(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-kid-blue"
                  >
                    <option value="15">15 phút</option>
                    <option value="30">30 phút</option>
                    <option value="45">45 phút</option>
                    <option value="60">1 tiếng</option>
                    <option value="120">2 tiếng</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 text-gray-600 font-black py-3 rounded-xl hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddManual}
                  disabled={!addTitle.trim()}
                  className="flex-1 bg-kid-orange text-white font-black py-3 rounded-xl disabled:opacity-50 hover:bg-orange-600"
                >
                  Lưu lại
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Reward Popups */}
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          {rewardPopups.map((popup) => (
            <div
              key={popup.id}
              className="absolute animate-bounce-up bg-kid-yellow text-kid-orange font-black text-2xl px-6 py-3 rounded-full shadow-lg border-4 border-white flex items-center gap-2"
              style={{ top: '30%' }}
            >
              🎉 +{popup.xp} XP
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
