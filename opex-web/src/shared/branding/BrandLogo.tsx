import type { ImgHTMLAttributes } from 'react';
import { getBrandLogoSrc, type BrandLogoVariant } from './assets';
import { useAppTheme } from '../../theme';

type BrandLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  variant?: BrandLogoVariant;
};

export const BrandLogo = ({
  variant = 'large',
  alt = 'Opex',
  ...imageProps
}: BrandLogoProps) => {
  const { theme } = useAppTheme();

  return <img src={getBrandLogoSrc(variant, theme)} alt={alt} {...imageProps} />;
};
