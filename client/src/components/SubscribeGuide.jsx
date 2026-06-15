import { useState } from 'react';
import { Copy, Check, Apple, Smartphone, Info, X } from 'lucide-react';

export default function SubscribeGuide({ onClose }) {
  const [copied, setCopied] = useState(false);

  const icsUrl = `${window.location.origin}/calendar.ics`;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(icsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = icsUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-5 py-4 border-b border-gray-100 dark:border-gray-700 rounded-t-3xl flex items-center justify-between">
          <h2 className="text-lg font-bold">📅 如何使用日历订阅</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* 订阅链接 */}
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              你的日历订阅链接（长期有效）：
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-3 text-sm break-all select-all">
                {icsUrl}
              </code>
              <button
                onClick={copyUrl}
                className="btn-secondary shrink-0 !px-3"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* iOS 指引 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Apple className="w-5 h-5" />
              <h3 className="font-semibold">iOS / Apple 日历</h3>
            </div>
            <ol className="text-sm space-y-1.5 text-gray-600 dark:text-gray-300 list-decimal list-inside">
              <li>打开「日历」App</li>
              <li>底部点击「日历」→「添加日历」→「添加订阅日历」</li>
              <li>粘贴上面的订阅链接，点击「订阅」</li>
              <li>点击「完成」即可</li>
            </ol>
            <p className="text-xs text-gray-400 mt-2">
              💡 系统会自动同步，拍摄前一天早上和拍摄前3小时会弹出提醒。
            </p>
          </div>

          {/* Android 指引 */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-5 h-5" />
              <h3 className="font-semibold">Android / Google 日历</h3>
            </div>
            <ol className="text-sm space-y-1.5 text-gray-600 dark:text-gray-300 list-decimal list-inside">
              <li>打开「Google 日历」App</li>
              <li>左上角菜单 →「设置」</li>
              <li>点击「添加日历」→「通过网址」</li>
              <li>粘贴订阅链接，点击「添加日历」</li>
            </ol>
          </div>

          {/* 其他日历 */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5" />
              <h3 className="font-semibold">其他日历 App</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              任何支持 iCal/ICS 订阅的日历 App 都可以使用。在 App 中找到「添加日历」「订阅日历」「通过 URL 添加」等选项，粘贴上述链接即可。
            </p>
          </div>

          {/* 自动更新说明 */}
          <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
            手机日历每 15-30 分钟自动刷新订阅。在管理页面修改拍摄信息后，日历会自动同步更新。
          </div>
        </div>
      </div>
    </>
  );
}
