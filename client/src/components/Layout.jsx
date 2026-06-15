import { Sun, Moon, Camera } from 'lucide-react';
import BottomNav from './BottomNav';

export default function Layout({ children, activeTab, onTabChange, darkMode, onToggleDark }) {
  return (
    <div className="mobile-container flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary-500" />
          <h1 className="text-lg font-bold">拍摄管理</h1>
        </div>
        <button
          onClick={onToggleDark}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={darkMode ? '切换亮色模式' : '切换暗色模式'}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-4 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
