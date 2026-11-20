import React, { useEffect, useState } from 'react';

interface PersonAvatarProps {
  name: string;
  imageUrl?: string;
  rank?: number;
  className?: string;
}

const STUDIO_PALETTES = [
  'from-zinc-800 via-zinc-900 to-neutral-950 text-amber-200/90',
  'from-slate-800 via-slate-900 to-neutral-950 text-amber-100/90',
  'from-stone-800 via-stone-900 to-neutral-950 text-yellow-200/90',
  'from-neutral-800 via-neutral-900 to-black text-zinc-200',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export const PersonAvatar: React.FC<PersonAvatarProps> = ({
  name,
  imageUrl,
  rank = 1,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [imageUrl]);

  if (imageUrl && !hasError) {
    return (
      <img
        src={imageUrl}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover object-top ${className}`}
      />
    );
  }

  const palette = STUDIO_PALETTES[rank % STUDIO_PALETTES.length];
  const initials = getInitials(name);

  return (
    <div
      aria-label={name}
      className={`w-full h-full bg-gradient-to-b ${palette} relative flex flex-col items-center justify-center overflow-hidden select-none ${className}`}
    >
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full opacity-30"
        aria-hidden="true"
      >
        <circle cx="60" cy="44" r="22" fill="currentColor" />
        <path
          d="M20 120c0-22 17.9-40 40-40s40 18 40 40"
          fill="currentColor"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-sm sm:text-base font-bold tracking-wider opacity-85">
        {initials}
      </span>
    </div>
  );
};
