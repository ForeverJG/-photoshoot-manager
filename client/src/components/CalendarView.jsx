import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarView({ events, onSelectDate }) {
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const { year, month } = viewDate;

  const eventsMap = useMemo(() => {
    const map = {};
    events.forEach(e => {
      const key = e.shoot_date; // YYYY-MM-DD
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [events]);

  const calendar = useMemo(() => {
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun

    const days = [];
    // 上月填充
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const m = month === 1 ? 12 : month - 1;
      const y = month === 1 ? year - 1 : year;
      days.push({ day: d, month: m, year: y, isCurrentMonth: false });
    }

    // 当月
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, month, year, isCurrentMonth: true });
    }

    // 下月填充
    const remaining = 42 - days.length; // 6周 × 7天
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, month: nextMonth, year: nextYear, isCurrentMonth: false });
    }

    // 分成6周
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) setViewDate({ year: year - 1, month: 12 });
    else setViewDate({ year, month: month - 1 });
  };

  const nextMonth = () => {
    if (month === 12) setViewDate({ year: year + 1, month: 1 });
    else setViewDate({ year, month: month + 1 });
  };

  const goToday = () => {
    const now = new Date();
    setViewDate({ year: now.getFullYear(), month: now.getMonth() + 1 });
  };

  const today = new Date().toISOString().split('T')[0];
  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="card">
      {/* 月份导航 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={goToday} className="text-base font-bold">
          {year}年{month}月
        </button>
        <button onClick={nextMonth} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 周标题 */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">
            周{d}
          </div>
        ))}
      </div>

      {/* 日历格子 */}
      <div className="grid grid-cols-7 gap-1">
        {calendar.flat().map((d, idx) => {
          const dateStr = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
          const dayEvents = eventsMap[dateStr] || [];
          const isToday = dateStr === today;

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(dateStr)}
              className={`
                aspect-square rounded-xl flex flex-col items-center justify-center
                text-sm transition-colors relative
                ${!d.isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : ''}
                ${isToday ? 'bg-primary-500 text-white font-bold' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
              `}
            >
              <span>{d.day}</span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 3).map((_, i) => (
                    <span
                      key={i}
                      className={`w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-primary-500'}`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
