import { Check, ChevronDown, ChevronUp, CircleDashed, Sparkles } from 'lucide-react';
import { Badge, Button, Card } from '../../../shared/ui';
import { SettingsChecklistItem } from '../types';

type SettingsConfigurationStatusProps = {
  checklistItems: SettingsChecklistItem[];
  completedCount: number;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onSelectItem: (item: SettingsChecklistItem) => void;
};

export const SettingsConfigurationStatus = ({
  checklistItems,
  completedCount,
  isCollapsed,
  onToggleCollapsed,
  onSelectItem
}: SettingsConfigurationStatusProps) => {
  const totalItems = checklistItems.length;
  const isComplete = totalItems > 0 && completedCount === totalItems;
  const pendingItems = totalItems - completedCount;
  const statusLabel = isComplete
    ? 'Account setup complete'
    : `${pendingItems} ${pendingItems === 1 ? 'item needs attention' : 'items need attention'}`;

  return (
    <Card
      title="Configuration Status"
      className={isComplete ? 'border-green-100 bg-green-50/50' : 'border-gray-100'}
      action={(
        <div className="flex items-center gap-2">
          <Badge variant={isComplete ? 'success' : 'info'}>
            {completedCount}/{totalItems} Completed
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            icon={isCollapsed ? ChevronDown : ChevronUp}
            onClick={onToggleCollapsed}
          >
            {isCollapsed ? 'Expand' : 'Collapse'}
          </Button>
        </div>
      )}
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isComplete ? 'bg-green-500 text-white' : 'bg-opex-dark text-white'}`}>
              {isComplete ? <Check size={20} /> : <Sparkles size={20} />}
            </div>
            <div>
              <p className="text-base font-black text-gray-900">{statusLabel}</p>
              <p className="text-sm text-gray-500">
                This status follows you across all settings tabs and can be reopened at any time.
              </p>
            </div>
          </div>
        </div>

        {!isCollapsed && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            {checklistItems.map((item) => (
              <div
                key={item.id}
                className={`flex min-h-[112px] flex-col justify-between gap-4 rounded-[1.5rem] border px-4 py-4 transition-all ${
                  item.completed ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${
                    item.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {item.completed ? <Check size={16} /> : <CircleDashed size={16} className="animate-spin-slow" />}
                  </div>
                  <div className="space-y-1.5">
                    <p className={`text-sm font-black leading-tight ${item.completed ? 'text-green-800' : 'text-gray-800'}`}>
                      {item.label}
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                      {item.completed ? 'Completed' : 'Pending'}
                    </p>
                    {item.detail && (
                      <p className="text-xs font-medium text-opex-teal">{item.detail}</p>
                    )}
                  </div>
                </div>

                {!item.completed && (item.action || item.opensProfileEditor || item.targetSection) && item.cta && (
                  <button
                    type="button"
                    onClick={() => onSelectItem(item)}
                    disabled={item.actionDisabled}
                    className="self-start text-[10px] font-black text-opex-teal uppercase tracking-widest hover:underline px-2 py-1 disabled:text-gray-300 disabled:no-underline"
                  >
                    {item.cta}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
