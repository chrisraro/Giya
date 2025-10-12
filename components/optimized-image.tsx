import React from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}

export const OptimizedImage = React.memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
}: OptimizedImageProps) {
  // Handle cases where src might be null or undefined
  if (!src) {
    return (
      <div 
        className={className} 
        style={{ width, height }}
      />
    );
  }

  return (
    <div className={className} style={{ width, height }}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="object-cover w-full h-full"
      />
    </div>
  );
});