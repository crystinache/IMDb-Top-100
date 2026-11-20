import React, { useRef } from 'react';
import { Menu, Search, X } from 'lucide-react';

interface ImdbHeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  performanceMode: boolean;
  onOpenSetup: () => void;
  onSecretTrigger: () => void;
}

export const ImdbHeader: React.FC<ImdbHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  performanceMode,
  onOpenSetup,
  onSecretTrigger,
}) => {
  const tapTimesRef = useRef<number[]>([]);
  const longPressTimerRef = useRef<number | null>(null);

  const handleLogoTap = () => {
    const now = Date.now();
    const recent = tapTimesRef.current.filter((t) => now - t < 900);
    recent.push(now);
    tapTimesRef.current = recent;
    if (recent.length >= 3) {
      tapTimesRef.current = [];
      onSecretTrigger();
    }
  };

  const handleLogoPointerDown = () => {
    longPressTimerRef.current = window.setTimeout(() => {
      onSecretTrigger();
    }, 1100);
  };

  const clearLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#121212] text-white border-b border-neutral-800">
      <div className="w-full max-w-[1200px] mx-auto px-2.5 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-5">
        {/* Left: Static 3-line white hamburger menu + IMDb Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center text-white p-1 select-none"
          >
            <Menu className="w-5 h-5 stroke-[2.25]" />
          </span>

          <button
            type="button"
            onClick={handleLogoTap}
            onPointerDown={handleLogoPointerDown}
            onPointerUp={clearLongPress}
            onPointerLeave={clearLongPress}
            onPointerCancel={clearLongPress}
            aria-label="IMDb"
            className="bg-[#F5C518] text-black font-display font-extrabold px-2 py-0.5 rounded-[4px] text-base sm:text-lg tracking-tight leading-none select-none min-h-[32px] flex items-center cursor-pointer"
          >
            IMDb
          </button>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 min-w-0 max-w-xl">
          <div className="bg-white rounded-[4px] flex items-center h-9 overflow-hidden focus-within:ring-2 focus-within:ring-[#F5C518]">
            <span className="hidden md:inline-flex items-center px-3 text-xs font-semibold text-neutral-700 border-r border-neutral-200 h-full whitespace-nowrap select-none">
              Celebs
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search IMDb"
              aria-label="Search IMDb"
              className="flex-1 px-2.5 sm:px-3 text-sm text-neutral-900 placeholder-neutral-500 bg-transparent focus:outline-none min-w-0"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="px-2 text-neutral-500 hover:text-neutral-900 h-full flex items-center shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <span className="px-2 sm:px-2.5 text-neutral-500 flex items-center shrink-0" aria-hidden="true">
                <Search className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>

        {/* Right: White "Sign in" + Yellow oval "Use app" */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          <span className="text-white text-xs sm:text-sm font-semibold whitespace-nowrap select-none">
            Sign in
          </span>

          <button
            type="button"
            onClick={performanceMode ? undefined : onOpenSetup}
            className="inline-flex items-center justify-center bg-[#F5C518] hover:bg-[#e3b512] text-black font-bold text-xs px-3.5 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[34px]"
          >
            Use app
          </button>
        </div>
      </div>
    </header>
  );
};
