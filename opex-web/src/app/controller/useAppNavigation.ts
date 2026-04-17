import { useCallback, useState } from 'react';

const MAIN_TABS = new Set(['DASHBOARD', 'BUDGET', 'TAXES', 'SETTINGS']);

export const useAppNavigation = () => {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [lastMainTab, setLastMainTab] = useState('DASHBOARD');

  const handleNavigate = useCallback((tab: string) => {
    if (MAIN_TABS.has(tab)) {
      setLastMainTab(tab);
    }
    setActiveTab(tab);
  }, []);

  return {
    activeTab,
    setActiveTab,
    lastMainTab,
    setLastMainTab,
    handleNavigate
  };
};
