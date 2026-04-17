import React from 'react';
import { Image, Lock, Trash2, Upload } from 'lucide-react';
import { Button, Card } from '../../../shared/ui';
import { UserProfile } from '../../../shared/types';

type SettingsBrandingSectionProps = {
  userProfile: UserProfile;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
};

export const SettingsBrandingSection = ({
  userProfile,
  onLogoUpload,
  onRemoveLogo
}: SettingsBrandingSectionProps) => {
  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-3xl pointer-events-auto select-none">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Lock size={24} className="text-gray-400" />
          </div>
          <div>
            <p className="text-base font-black text-gray-700 tracking-tight">Coming Soon</p>
            <p className="text-sm text-gray-400 font-medium mt-1 max-w-xs">Custom branding will be available in a future update.</p>
          </div>
        </div>
      </div>

      <div className="space-y-8 pointer-events-none select-none" style={{ filter: 'blur(3px)', opacity: 0.45 }}>
        <Card title="Workspace Branding" description="Reserved for upcoming document and export experiences.">
          <div className="space-y-8 py-4">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="relative group">
                <div className="w-48 h-48 rounded-[2rem] bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-opex-teal/30">
                  {userProfile.logo ? (
                    <img src={userProfile.logo} alt="Company Logo" className="w-full h-full object-contain p-4" />
                  ) : (
                    <div className="text-center space-y-2">
                      <Image size={40} className="mx-auto text-gray-300" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Logo</p>
                    </div>
                  )}
                </div>
                {userProfile.logo && (
                  <button
                    type="button"
                    onClick={onRemoveLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Company Logo</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Recommended size: 400x400px. Supported formats: PNG, JPG, SVG.
                    Maximum file size: 2MB.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <label className="cursor-pointer">
                    <div className="bg-opex-teal text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-opex-teal/90 transition-all shadow-lg shadow-opex-teal/20 active:scale-95 flex items-center gap-2">
                      <Upload size={16} />
                      {userProfile.logo ? 'Replace Logo' : 'Upload Logo'}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
                  </label>
                  {userProfile.logo && (
                    <Button variant="outline" onClick={onRemoveLogo}>Remove</Button>
                  )}
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100 w-full"></div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preview Fallback</h4>
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-opex-teal/10 text-opex-teal flex items-center justify-center font-black text-lg">
                  {userProfile.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">{userProfile.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fallback display if no logo is present</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
