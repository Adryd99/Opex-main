import opesLargeDarkLogo from '../assets/Opes_large_dark.png';
import opesLargeLightLogo from '../assets/Opes_large_light.png';
import type { AppTheme } from '../../theme';

export type BrandLogoVariant = 'large';

const BRAND_LOGO_SOURCES: Record<BrandLogoVariant, { light: string; dark: string }> = {
  large: {
    light: opesLargeDarkLogo,
    dark: opesLargeLightLogo
  }
};

export const getBrandLogoSrc = (variant: BrandLogoVariant, theme: AppTheme) =>
  BRAND_LOGO_SOURCES[variant][theme];

export const getBrandLogoPublicPath = (variant: BrandLogoVariant, theme: AppTheme) =>
  theme === 'dark'
    ? `/Opes_${variant}_light.png`
    : `/Opes_${variant}_dark.png`;
