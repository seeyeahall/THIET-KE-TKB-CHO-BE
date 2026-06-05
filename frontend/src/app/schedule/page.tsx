'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wand2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { todayStr } from '@/lib/utils/scheduleProgress';
import { api } from '@/lib/api';

import SkeletonPage from '@/components/SkeletonPage';
import YearView from './components/YearView';
import MonthView from './components/MonthView';
import WeekView from './components/WeekView';
import DayView from './components/DayView';
import DayDesignModal from './components/DayDesignModal';
import ScheduleWizardSheet from './components/ScheduleWizardSheet';


// ─── Reward popup ─────────────────────────────────────────────────────────────
interface RewardPopup { id: string; xp: number }

export default function SchedulePage() {
  const router = useRouter();
  const { selectedChild } = useAppStore();

  // ── Dùng Zustand store làm single source of truth (không dùng useState local)
  const {
    scheduleViewMode,   setScheduleViewMode,
    selectedDate,       setSelectedDate,
    selectedMonth,      setSelectedMonth,
    selectedYear,       setSelectedYear,
  } = useAppStore();

  // Design modal (local)
  const [designOpen, setDesignOpen] = useState(false);
  const [prefilledTime, setPrefilledTime] = useState<string | undefined>(undefined);

  // AI Wizard
  const [wizardOpen, setWizardOpen] = useState(false);

  // Refresh keys
  const [designRefreshKey, setDesignRefreshKey] = useState(0);
  // Refresh key toàn cục — trigger khi check complete để Month/Week/Year cập nhật sticker
  const [globalRefreshKey, setGlobalRefreshKey] = useState(0);


  // Rewards
  const [rewardPopups, setRewardPopups] = useState<RewardPopup[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Reset viewMode về 'month' mỗi lần mount trang (không persist viewMode)
  useEffect(() => {
    if (!selectedChild) { router.push('/select-child'); return; }
    // Nếu viewMode là 'year' khi mount lại, giữ nguyên; nếu không, đảm bảo hợp lệ
    setInitialized(true);
    // Đảm bảo selectedDate và selectedMonth không bị null
    if (!selectedDate) setSelectedDate(todayStr());
    if (!selectedMonth) {
      const d = new Date();
      setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
  }, [selectedChild, router]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!selectedChild) return null;
  if (!initialized) return <SkeletonPage cardCount={4} />;

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const goToDay = (date: string) => {
    setSelectedDate(date);
    setScheduleViewMode('day');
    // Sync selectedMonth theo ngày được chọn
    const [y, m] = date.split('-');
    setSelectedMonth(`${y}-${m}`);
  };

  const goToMonth = (month: string) => {
    setSelectedMonth(month);
    setScheduleViewMode('month');
  };

  const handleCheckComplete = async (itemId: string) => {
    // Trigger reward popup
    const popupId = Date.now().toString();
    setRewardPopups(prev => [...prev, { id: popupId, xp: 15 }]);
    setTimeout(() => setRewardPopups(prev => prev.filter(p => p.id !== popupId)), 3000);
    // Refresh tất cả views để sticker cập nhật
    setGlobalRefreshKey(k => k + 1);
    try {
      await api.completeActivity(selectedChild.id, itemId);
    } catch { /* optimistic — giữ nguyên UI */ }
  };

  const handleDesignSaved = () => {
    setDesignRefreshKey(k => k + 1); // force DayView re-fetch
    setGlobalRefreshKey(k => k + 1); // cũng refresh Month/Week/Year
  };

  // ── Tab labels ─────────────────────────────────────────────────────────────
  const VIEW_TABS = [
    { id: 'year'  as const, label: 'Năm',   emoji: '📆' },
    { id: 'month' as const, label: 'Tháng', emoji: '📅' },
    { id: 'week'  as const, label: 'Tuần',  emoji: '🗓' },
    { id: 'day'   as const, label: 'Ngày',  emoji: '☀️' },
  ];

  return (
    <>
    <main className="min-h-[100dvh] bg-gray-50 pb-nav">
      <div className="max-w-xl mx-auto px-4 pt-6">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="mb-5">
          <h2 className="text-3xl font-black text-kid-orange">
            📅 Lịch của {selectedChild.name}
          </h2>
          <p className="text-sm font-bold text-gray-400 mt-0.5">
            Theo dõi hành trình phiêu lưu của con
          </p>
        </div>

        {/* ── Tab chuyển view ────────────────────────────────── */}
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100 mb-5 gap-1">
          {VIEW_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setScheduleViewMode(tab.id)}
              className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all ${
                scheduleViewMode === tab.id
                  ? 'bg-kid-orange text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="block text-base leading-none">{tab.emoji}</span>
              <span className="block text-[10px] leading-tight mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Nội dung view ─────────────────────────────────── */}
        {scheduleViewMode === 'year' && (
          <YearView
            key={`year-${globalRefreshKey}`}
            childId={selectedChild.id}
            year={selectedYear}
            onSelectMonth={(month) => goToMonth(month)}
            onChangeYear={setSelectedYear}
          />
        )}

        {scheduleViewMode === 'month' && (
          <MonthView
            key={`month-${selectedMonth}-${globalRefreshKey}`}
            childId={selectedChild.id}
            monthStr={selectedMonth}
            selectedDate={selectedDate}
            onSelectDay={goToDay}
            onChangeMonth={setSelectedMonth}
          />
        )}

        {scheduleViewMode === 'week' && (
          <WeekView
            key={`week-${selectedDate}-${globalRefreshKey}`}
            childId={selectedChild.id}
            selectedDate={selectedDate}
            onSelectDay={goToDay}
            onNavigateWeek={(date) => setSelectedDate(date)}
          />
        )}

        {scheduleViewMode === 'day' && (
          <DayView
            key={`day-${selectedDate}-${designRefreshKey}`}
            dateStr={selectedDate}
            childId={selectedChild.id}
            onOpenDesign={(time?: string) => {
              setPrefilledTime(time);
              setDesignOpen(true);
            }}
            onNavigate={(date) => {
              setSelectedDate(date);
              const [y, m] = date.split('-');
              setSelectedMonth(`${y}-${m}`);
            }}
            onCheckComplete={handleCheckComplete}
          />
        )}

      </div>

      {/* ── DayDesignModal ─────────────────────────────────── */}
      {designOpen && (
        <DayDesignModal
          dateStr={selectedDate}
          childId={selectedChild.id}
          childName={selectedChild.name}
          childAge={selectedChild.age}
          prefilledTime={prefilledTime}
          onClose={() => { setDesignOpen(false); setPrefilledTime(undefined); }}
          onSaved={handleDesignSaved}
        />
      )}

      {/* ── Reward popups ─────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
        {rewardPopups.map(popup => (
          <div
            key={popup.id}
            className="absolute animate-bounce bg-kid-yellow text-kid-orange font-black text-2xl px-6 py-3 rounded-full shadow-2xl border-4 border-white flex items-center gap-2"
            style={{ top: '30%' }}
          >
            🎉 +{popup.xp} XP
          </div>
        ))}
      </div>

      {/* ── FAB: AI Planner ─────────────────────────────────── */}
      <button
        onClick={() => setWizardOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-kid-orange to-yellow-400 text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        title="Naruto AI Planner"
      >
        <Wand2 size={24} />
      </button>
    </main>

    {/* AI Wizard Sheet */}
    {wizardOpen && selectedChild && (
      <ScheduleWizardSheet
        child={selectedChild}
        initialScope={scheduleViewMode === 'day' ? 'day' : 'week'}
        initialDate={selectedDate}
        onClose={() => setWizardOpen(false)}
        onSaved={(_scheduleId, _weekStart) => {
          setWizardOpen(false);
          setGlobalRefreshKey(k => k + 1);
          setDesignRefreshKey(k => k + 1);
        }}
      />
    )}
    </>
  );
}
