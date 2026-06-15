import { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import EventsPage from './pages/EventsPage';
import PropsPage from './pages/PropsPage';
import IncomePage from './pages/IncomePage';

export default function App() {
  const [activeTab, setActiveTab] = useState('events');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => setDarkMode(d => !d), []);

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} darkMode={darkMode} onToggleDark={toggleDarkMode}>
      {activeTab === 'events' && <EventsPage />}
      {activeTab === 'props' && <PropsPage />}
      {activeTab === 'income' && <IncomePage />}
    </Layout>
  );
}
