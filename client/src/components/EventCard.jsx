import { Clock, MapPin, User, ChevronRight, Check, X, Banknote } from 'lucide-react';

export default function EventCard({ event, onClick, onDelete }) {
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日 周${['日','一','二','三','四','五','六'][d.getDay()]}`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
  };

  let props = [];
  try { props = JSON.parse(event.props || '[]'); } catch { /* */ }

  const isPast = new Date(event.shoot_date + 'T' + (event.end_time || '23:59')) < new Date();

  return (
    <div
      className={`card cursor-pointer active:scale-[0.98] transition-transform ${isPast ? 'opacity-70' : ''}`}
      onClick={() => onClick(event)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* 日期和状态 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-primary-500 bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 rounded-md">
              {formatDate(event.shoot_date)}
            </span>
            {isPast && (
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                已完成
              </span>
            )}
          </div>

          {/* 模特 + 内容 */}
          <h3 className="font-semibold text-base mb-1.5 truncate">
            {event.model_name} <span className="text-gray-400 font-normal">· {event.content}</span>
          </h3>

          {/* 时间 */}
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>
              {formatTime(event.start_time)}
              {event.end_time ? ` - ${formatTime(event.end_time)}` : ' 开始（约2小时）'}
            </span>
          </div>

          {/* 地点 */}
          {event.location && (
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {/* 道具标签 */}
          {props.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {props.slice(0, 3).map((p, i) => (
                <span key={i} className="tag text-xs">{p}</span>
              ))}
              {props.length > 3 && (
                <span className="tag text-xs">+{props.length - 3}</span>
              )}
            </div>
          )}

          {/* 收款状态 */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1 text-xs ${event.deposit_received ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
              {event.deposit_received
                ? <Check className="w-3 h-3" />
                : <X className="w-3 h-3" />
              }
              定金 {event.deposit_amount}元
            </span>
            <span className={`inline-flex items-center gap-1 text-xs ${event.balance_received ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
              {event.balance_received
                ? <Check className="w-3 h-3" />
                : <X className="w-3 h-3" />
              }
              尾款 {event.balance_amount}元
            </span>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0 mt-1" />
      </div>
    </div>
  );
}
