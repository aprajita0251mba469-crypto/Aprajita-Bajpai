import { useState } from 'react';
import { Droplets } from 'lucide-react';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function ProductImage({ src, alt, className = '', fallbackLabel }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#DDF3E4] via-[#EEF7F1] to-[#F3F5F2] text-[#176B45] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Droplets className="w-8 h-8 mb-2 opacity-80" strokeWidth={1.75} />
        <span className="text-xs font-medium tracking-tight text-[#176B45]/80">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
