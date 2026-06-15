import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Package, CheckCircle2 } from 'lucide-react';
import { propsApi } from '../api';

export default function PropsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState({});

  const fetchProps = useCallback(async () => {
    setLoading(true);
    try {
      const result = await propsApi.monthly(year, month);
      setData(result);
      // 加载已勾选状态
      const saved = localStorage.getItem(`props_checked_${year}_${month}`);
      setCheckedItems(saved ? JSON.parse(saved) : {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchProps(); }, [fetchProps]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const toggleCheck = (item) => {
    const updated = { ...checkedItems, [item]: !checkedItems[item] };
    setCheckedItems(updated);
    localStorage.setItem(`props_checked_${year}_${month}`, JSON.stringify(updated));
  };

  const props = data?.props || [];
  const completedCount = props.filter(p => checkedItems[p]).length;

  return (
    <div>
      {/* 月份选择器 */}
      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-bold">{year}年{month}月</span>
          <button onClick={nextMonth} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        {/* 进度 */}
        {props.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-gray-500 dark:text-gray-400">准备进度</span>
              <span className="font-medium">{completedCount}/{props.length}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / props.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 道具列表 */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : props.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 dark:text-gray-500">当月暂无拍摄安排，无需准备道具</p>
        </div>
      ) : (
        <div className="space-y-2">
          {props.map((item, idx) => (
            <button
              key={idx}
              onClick={() => toggleCheck(item)}
              className={`card w-full text-left flex items-center gap-3 transition-all ${
                checkedItems[item]
                  ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                  : ''
              }`}
            >
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                checkedItems[item]
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {checkedItems[item] && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
              <span className={`text-base flex-1 ${checkedItems[item] ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                {item}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 底部提示 */}
      {props.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-6 mb-4">
          💡 点击道具可标记为已准备，状态自动保存
        </p>
      )}
    </div>
  );
}
