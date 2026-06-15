import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, DollarSign, TrendingUp, CreditCard, Banknote } from 'lucide-react';
import { incomeApi } from '../api';

export default function IncomePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [viewType, setViewType] = useState('monthly'); // 'monthly' | 'yearly'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchIncome = useCallback(async () => {
    setLoading(true);
    try {
      const params = viewType === 'monthly' ? { year, month } : { year };
      const result = await incomeApi.get(params);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [year, month, viewType]);

  useEffect(() => { fetchIncome(); }, [fetchIncome]);

  const prev = () => {
    if (viewType === 'monthly') {
      if (month === 1) { setYear(y => y - 1); setMonth(12); }
      else setMonth(m => m - 1);
    } else {
      setYear(y => y - 1);
    }
  };

  const next = () => {
    if (viewType === 'monthly') {
      if (month === 12) { setYear(y => y + 1); setMonth(1); }
      else setMonth(m => m + 1);
    } else {
      setYear(y => y + 1);
    }
  };

  const formatMoney = (val) => {
    return (val || 0).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const label = viewType === 'monthly' ? `${year}年${month}月` : `${year}年`;

  return (
    <div>
      {/* 视图切换 */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
        <button
          onClick={() => setViewType('monthly')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            viewType === 'monthly'
              ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          按月
        </button>
        <button
          onClick={() => setViewType('yearly')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            viewType === 'yearly'
              ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          按年
        </button>
      </div>

      {/* 时间选择器 */}
      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <button onClick={prev} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-bold">{label}</span>
          <button onClick={next} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 统计数据 */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* 定金 */}
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">已收定金</span>
              </div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                ¥{formatMoney(data?.deposit_total)}
              </p>
            </div>

            {/* 尾款 */}
            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-purple-500 flex items-center justify-center">
                  <Banknote className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">已收尾款</span>
              </div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                ¥{formatMoney(data?.balance_total)}
              </p>
            </div>
          </div>

          {/* 总收入 */}
          <div className="card bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">{label}总收入</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                  ¥{formatMoney(data?.total)}
                </p>
              </div>
            </div>
            {/* 明细 */}
            <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800 flex justify-between text-sm text-green-600 dark:text-green-400">
              <span>定金 ¥{formatMoney(data?.deposit_total)}</span>
              <span>+</span>
              <span>尾款 ¥{formatMoney(data?.balance_total)}</span>
              <span>=</span>
              <span className="font-bold">¥{formatMoney(data?.total)}</span>
            </div>
          </div>

          {data?.total === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 dark:text-gray-500">{label}暂无已收款项</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                仅统计"已收定金"和"已收尾款"勾选的金额
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
