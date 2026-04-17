import { SettingsSectionDefinition, SettingsSectionId } from '../types';

type SettingsTabsProps = {
  sections: SettingsSectionDefinition[];
  activeSection: SettingsSectionId;
  onSectionChange: (section: SettingsSectionId) => void;
};

export const SettingsTabs = ({ sections, activeSection, onSectionChange }: SettingsTabsProps) => {
  return (
    <div className="w-full relative py-2">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-4 px-1">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          const Icon = section.icon;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSectionChange(section.id)}
              className={`flex-shrink-0 flex items-center gap-2.5 px-6 py-3 rounded-full font-bold text-sm transition-all duration-200 whitespace-nowrap shadow-sm border ${isActive
                  ? 'bg-opex-teal text-white border-opex-teal shadow-xl shadow-teal-900/10'
                  : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
              {section.label}
            </button>
          );
        })}
        <div className="flex-shrink-0 w-8 h-full"></div>
      </div>
    </div>
  );
};
