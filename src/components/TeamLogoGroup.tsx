import React from 'react';
import { FaShieldAlt } from 'react-icons/fa';
import { Department } from '@/shared/models/tournamentTypes';

export function getDepartmentImages(dept?: Department | null | string): string[] {
  if (!dept) return [];
  if (typeof dept === 'string') {
    return dept.split(',').map(u => u.trim()).filter(Boolean);
  }
  if (!dept.image_url) return [];
  return dept.image_url.split(',').map(u => u.trim()).filter(Boolean);
}

interface TeamLogoGroupProps {
  images: string[];
  size?: number;
  className?: string;
  fallbackIconSize?: number;
}

export default function TeamLogoGroup({ images, size = 40, className = '', fallbackIconSize = 20 }: TeamLogoGroupProps) {
  if (images.length === 0) {
    return (
      <div 
        className={`rounded-full bg-gray-100 dark:bg-[#1c1c1e] flex items-center justify-center shrink-0 shadow-sm ${className}`}
        style={{ width: size, height: size }}
      >
        <FaShieldAlt style={{ fontSize: fallbackIconSize }} className="text-gray-300 dark:text-white/20" />
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <img 
        src={images[0]} 
        alt="Team Logo" 
        className={`object-contain shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // Calculate overlap negative margin (roughly 25% of the size)
  const overlapMargin = -(size * 0.25);

  return (
    <div className="flex items-center">
      {images.slice(0, 3).map((url, index) => (
        <img 
          key={`${url}-${index}`}
          src={url} 
          alt={`Team Logo ${index + 1}`} 
          className={`object-contain relative shrink-0 ${className}`}
          style={{ 
            width: size, 
            height: size,
            marginLeft: index === 0 ? 0 : overlapMargin,
            zIndex: images.length - index
          }}
        />
      ))}
      {images.length > 3 && (
        <div 
          className="rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-white/60 relative shrink-0"
          style={{ width: size, height: size, marginLeft: overlapMargin, zIndex: 0 }}
        >
          +{images.length - 3}
        </div>
      )}
    </div>
  );
}
