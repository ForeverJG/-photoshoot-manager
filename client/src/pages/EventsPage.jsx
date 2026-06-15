import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Calendar, List, Rss, AlertCircle } from 'lucide-react';
import { eventsApi } from '../api';
import EventCard from '../components/EventCard';
import EventForm from '../components/EventForm';
import CalendarView from '../components/CalendarView';
import SubscribeGuide from '../components/SubscribeGuide';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [showGuide, setShowGuide] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const fetchEvents = useCallback(async () => {
    try {
      setError(null);
      const data = await eventsApi.list();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // 选中日期的筛选（列表视图下）
  const filteredEvents = useMemo(() => {
    if (viewMode === 'calendar' || !selectedDate) return events;
    return events.filter(e => e.shoot_date === selectedDate);
  }, [events, selectedDate, viewMode]);

  // 按日期分组（列表视图、无日期筛选时）
  const groupedEvents = useMemo(() => {
    if (selectedDate) return null;
    const groups = {};
    events.forEach(e => {
      const date = e.shoot_date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(e);
    });
    return groups;
  }, [events, selectedDate]);

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setShowForm(true);
  };

  const handleOpenEdit = (event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleSave = async (formData) => {
    try {
      if (editingEvent) {
        await eventsApi.update(editingEvent.id, formData);
      } else {
        await eventsApi.create(formData);
      }
      setShowForm(false);
      setEditingEvent(null);
      await fetchEvents();
    } catch (err) {
      alert('保存失败：' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个拍摄事件吗？')) return;
    try {
      await eventsApi.remove(id);
      await fetchEvents();
    } catch (err) {
      alert('删除失败：' + err.message);
    }
  };

  const handleSelectDate = (dateStr) => {
    // 日历视图中点击日期 → 切换到列表并筛选
    setSelectedDate(dateStr);
    setViewMode('list');
  };

  const formatGroupDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);

    let prefix = '';
    if (target.getTime() === today.getTime()) prefix = '今天 · ';
    else if (target.getTime() === tomorrow.getTime()) prefix = '明天 · ';
    const weekDay = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    return `${prefix}${d.getMonth() + 1}月${d.getDate()}日 周${weekDay}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* 工具栏 */}
      <div className="flex items-center gap-2 mb-4">
        {/* 视图切换 */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 flex-1">
          <button
            onClick={() => { setViewMode('list'); setSelectedDate(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <List className="w-4 h-4" />
            列表
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'calendar'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Calendar className="w-4 h-4" />
            月历
          </button>
        </div>

        {/* 订阅指引 */}
        <button
          onClick={() => setShowGuide(true)}
          className="btn-secondary !px-3"
          title="日历订阅指引"
        >
          <Rss className="w-4 h-4" />
        </button>
      </div>

      {/* 日历视图 */}
      {viewMode === 'calendar' && (
        <CalendarView events={events} onSelectDate={handleSelectDate} />
      )}

      {/* 列表视图 */}
      {viewMode === 'list' && (
        <>
          {selectedDate && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-primary-500">
                📅 {formatGroupDate(selectedDate)}
              </span>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                清除筛选
              </button>
            </div>
          )}

          {error && (
            <div className="card mb-4 flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
              <button onClick={fetchEvents} className="ml-auto text-sm font-medium underline">重试</button>
            </div>
          )}

          {filteredEvents.length === 0 && (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 dark:text-gray-500">
                {selectedDate ? '当天暂无拍摄安排' : '暂无拍摄事件'}
              </p>
              <button onClick={handleOpenAdd} className="btn-primary mt-4">
                添加第一个拍摄
              </button>
            </div>
          )}

          {/* 分组列表 */}
          {!selectedDate && groupedEvents && Object.entries(groupedEvents)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, dayEvents]) => (
              <div key={date} className="mb-4">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 px-1">
                  {formatGroupDate(date)} · {dayEvents.length}场拍摄
                </h3>
                <div className="space-y-3">
                  {dayEvents.map(event => (
                    <div key={event.id} className="relative group">
                      <EventCard
                        event={event}
                        onClick={handleOpenEdit}
                        onDelete={handleDelete}
                      />
                      {/* 长按删除按钮 */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="删除"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {/* 有日期筛选时直接显示 */}
          {selectedDate && filteredEvents.length > 0 && (
            <div className="space-y-3">
              {filteredEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={handleOpenEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* FAB 添加按钮 */}
      {!showForm && (
        <button onClick={handleOpenAdd} className="fab right-4 md:right-[calc(50%-200px)]" aria-label="添加拍摄">
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* 事件表单 */}
      {showForm && (
        <EventForm
          event={editingEvent}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingEvent(null); }}
        />
      )}

      {/* 订阅指引 */}
      {showGuide && (
        <SubscribeGuide onClose={() => setShowGuide(false)} />
      )}
    </div>
  );
}
