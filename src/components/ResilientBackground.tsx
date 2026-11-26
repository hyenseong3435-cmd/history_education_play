import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

interface ResilientBackgroundProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  overlayClassName?: string;
}

export function ResilientBackground({
  src,
  alt,
  className = '',
  imageClassName = '',
  overlayClassName = 'bg-gradient-to-t from-[#0E0F11] via-[#0E0F11]/25 to-[#0E0F11]/50',
}: ResilientBackgroundProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-[#191B1F] via-[#131518] to-[#0D0E10] ${className}`}
        role="img"
        aria-label={alt}
      >
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'radial-gradient(#9E9A90 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-[#8B8A84] p-6 text-center">
          <MapPin className="w-7 h-7 mb-2 opacity-60" />
          <p className="font-editorial text-sm">{alt}</p>
        </div>
        <div className={`absolute inset-0 ${overlayClassName}`} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#0E0F11] ${className}`}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`w-full h-full object-cover object-center pixel-art transition-opacity duration-300 ${imageClassName}`}
      />
      <div className={`absolute inset-0 pointer-events-none ${overlayClassName}`} />
    </div>
  );
}
