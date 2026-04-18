import { useCallback, useState } from 'react';

import {
  DEFAULT_APP_TAB,
  isMainAppTab,
  type MainAppTab,
  normalizeAppTab
} from '../navigation';

export const useAppNavigation = () => {
  const [activeTab, setActiveTabState] = useState(DEFAULT_APP_TAB);
  const [lastMainTab, setLastMainTab] = useState<MainAppTab>(DEFAULT_APP_TAB);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(normalizeAppTab(tab));
  }, []);

  const handleNavigate = useCallback((tab: string) => {
    const nextTab = normalizeAppTab(tab);
    if (isMainAppTab(nextTab)) {
      setLastMainTab(nextTab);
    }
    setActiveTabState(nextTab);
  }, []);

  return {
    activeTab,
    setActiveTab,
    lastMainTab,
    setLastMainTab,
    handleNavigate
  };
};
