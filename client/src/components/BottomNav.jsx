import { Calendar, Package, DollarSign } from 'lucide-react';

const tabs = [
  { key: 'events', label: '拍摄', icon: Calendar },
  { key: 'props', label: '道具', icon: Package },
  { key: 'income', label: '收入', icon: DollarSign },
];

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="bottom-nav max-w-mobile mx-auto left-0 right-0">
      {tabs.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={`nav-item ${activeTab === key ? 'active' : ''}`}
        >
          <Icon className="w-5 h-5" />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
}
