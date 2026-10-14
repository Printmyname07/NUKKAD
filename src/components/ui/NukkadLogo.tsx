import React from 'react';

interface NukkadLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const NukkadLogo: React.FC<NukkadLogoProps> = ({ className = '', size = 36, showText = false }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Custom Vector Logo representing Nukkad: Shop, Pin, People & Street in Green & Navy */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Left Street / Shop base */}
        <path d="M10 75L45 92V75L15 62Z" fill="#102B49" />
        {/* Right Street base */}
        <path d="M90 75L55 92V75L85 62Z" fill="#102B49" />
        {/* Store Structure */}
        <path d="M20 60V42C20 38 23 35 27 35H43C47 35 50 38 50 42V60H20Z" fill="#102B49" />
        {/* Awning in green */}
        <path d="M16 35C16 33 18 31 21 31H49C52 31 54 33 54 35V38H16V35Z" fill="#08A85A" />
        {/* Store person silhouette */}
        <circle cx="35" cy="48" r="4" fill="#08A85A" />
        <path d="M29 58C29 55 31 54 35 54C39 54 41 55 41 58" stroke="#08A85A" strokeWidth="3" strokeLinecap="round" />

        {/* People on right */}
        <circle cx="70" cy="50" r="5" fill="#102B49" />
        <path d="M62 62C62 58 65 57 70 57C75 57 78 58 78 62" stroke="#102B49" strokeWidth="3.5" strokeLinecap="round" />

        <circle cx="85" cy="55" r="3.5" fill="#102B49" />
        <path d="M80 64C80 61 82 60 85 60C88 60 90 61 90 64" stroke="#102B49" strokeWidth="2.5" strokeLinecap="round" />

        {/* Central Map Pin in Green */}
        <path
          d="M50 12C38 12 28 22 28 34C28 50 50 78 50 78C50 78 72 50 72 34C72 22 62 12 50 12Z"
          fill="#08A85A"
        />
        <circle cx="50" cy="34" r="8" fill="white" />

        {/* Sparkles / rays on top right in green */}
        <rect x="78" y="20" width="10" height="3.5" rx="1.75" transform="rotate(30 78 20)" fill="#08A85A" />
        <rect x="83" y="32" width="12" height="3.5" rx="1.75" fill="#08A85A" />
        <rect x="76" y="40" width="10" height="3.5" rx="1.75" transform="rotate(-30 76 40)" fill="#08A85A" />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-black tracking-tight text-slate-900 leading-tight">
            NUKKAD
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#08A85A] leading-none">
            LOCAL. LIVE. HUMAN. CONNECTED.
          </span>
        </div>
      )}
    </div>
  );
};
