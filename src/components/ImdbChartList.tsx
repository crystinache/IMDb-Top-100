import React from 'react';
import {
  Info,
  ArrowUpDown,
  LayoutList,
  LayoutGrid,
} from 'lucide-react';
import { Person, SortMode, StickerOverride, ViewMode } from '../types';
import { PersonAvatar } from './PersonAvatar';

interface ImdbChartListProps {
  people: Person[];
  overrides: Record<number, StickerOverride>;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  sortMode: SortMode;
  setSortMode: (s: SortMode) => void;
  dataSource: 'imdb-live' | 'curated';
  onSelectPerson: (person: Person) => void;
}

export const ImdbChartList: React.FC<ImdbChartListProps> = ({
  people,
  overrides,
  viewMode,
  setViewMode,
  sortMode,
  setSortMode,
  dataSource,
  onSelectPerson,
}) => {
  return (
    <main className="w-full max-w-[1040px] mx-auto px-3 sm:px-6 pt-4 sm:pt-6 pb-20">
      {/* IMDb Charts Section Header */}
      <section className="pb-4 sm:pb-5 border-b border-neutral-200">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
          IMDb Charts
        </p>

        <div className="min-w-0">
          <div className="flex items-center gap-3 sm:gap-3.5">
            <span className="w-1.5 sm:w-2 h-9 sm:h-12 bg-[#F5C518] rounded-[2px] shrink-0" aria-hidden="true" />
            <h1 className="font-display text-[30px] sm:text-[48px] font-bold tracking-tight text-neutral-900 leading-tight">
              Trending people
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1.5">
            As determined by IMDbPro STARmeter
          </p>
        </div>

        {/* Metadata & Sort/View Toolbar */}
        <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 text-xs text-neutral-600">
          <div className="flex items-center gap-2 tabular-nums">
            <span className="font-semibold text-neutral-900">{people.length} Celebs</span>
            <span aria-hidden="true">·</span>
            <span>{dataSource === 'imdb-live' ? 'Live IMDb STARmeter' : 'IMDb STARmeter Chart'}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <label className="inline-flex items-center gap-1.5 text-neutral-700 font-medium">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Sort by</span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                aria-label="Sort by"
                className="bg-white border border-neutral-300 rounded-md px-2 sm:px-2.5 py-1.5 text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900"
              >
                <option value="ranking">Ranking</option>
                <option value="movers">Biggest Movers</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </label>

            <div className="inline-flex items-center bg-neutral-100 p-0.5 rounded-md border border-neutral-200">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Chart Results */}
      {people.length === 0 ? (
        <div className="py-16 text-center text-neutral-500 text-sm">
          Nessuna celebrità trovata per questa ricerca.
        </div>
      ) : viewMode === 'list' ? (
        <ul className="divide-y divide-neutral-200 border-b border-neutral-200">
          {people.map((person) => {
            const override = overrides[person.rank];
            const displayName = override ? override.customName : person.name;
            const displayImage = override ? override.customImageUrl : person.imageUrl;
            const displayProfession = override ? override.customProfession : person.profession;
            const displayKnownFor = override
              ? override.customKnownFor
              : person.knownFor.slice(0, 2).join(' · ');
            const isPhysicalSticker = override?.visualStyle === 'physical-sticker';

            return (
              <li
                key={person.rank}
                data-rank={person.rank}
                className={`py-3 sm:py-3.5 px-1 sm:px-3 flex items-center gap-3 sm:gap-5 transition-colors w-full ${
                  isPhysicalSticker
                    ? 'bg-amber-50/60'
                    : 'hover:bg-neutral-50/90'
                }`}
              >
                {/* Round Portrait Thumbnail */}
                <button
                  type="button"
                  onClick={() => onSelectPerson(person)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden shrink-0 bg-neutral-900 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E63BE] ${
                    isPhysicalSticker
                      ? 'ring-2 ring-white shadow-[0_6px_18px_rgba(0,0,0,0.22)] -rotate-2'
                      : 'border border-neutral-200'
                  }`}
                >
                  <PersonAvatar name={displayName} imageUrl={displayImage} rank={person.rank} />
                  {isPhysicalSticker && override.badgeLabel && (
                    <span className="absolute bottom-0 inset-x-0 bg-[#F5C518] text-black text-[8px] font-bold px-1 py-0.5 text-center uppercase tracking-wide truncate">
                      {override.badgeLabel}
                    </span>
                  )}
                </button>

                {/* Celebrity Info */}
                <div className="flex-1 min-w-0">
                  <div className="mb-1">
                    <span className="inline-flex items-center justify-center bg-[#0E63BE] text-white font-mono tabular-nums font-bold text-xs px-2 py-0.5 rounded-[3px] leading-tight">
                      #{person.rank}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => onSelectPerson(person)}
                      className="text-left font-display font-bold text-[15px] sm:text-[17px] text-neutral-900 hover:text-[#0E63BE] transition-colors truncate max-w-full cursor-pointer"
                    >
                      {displayName}
                    </button>
                    {isPhysicalSticker && (
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-[3px] shrink-0">
                        Sticker
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-[13px] text-neutral-600 truncate mt-0.5">
                    {displayProfession}
                  </p>

                  {displayKnownFor && (
                    <p className="text-[11px] sm:text-[12px] text-neutral-500 truncate mt-0.5 sm:mt-1">
                      Known for: <span className="text-[#0E63BE]">{displayKnownFor}</span>
                    </p>
                  )}
                </div>

                {/* Right Info Button */}
                <div className="flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectPerson(person)}
                    aria-label={`Details for ${displayName}`}
                    className="min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center text-[#0E63BE] hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 pt-5">
          {people.map((person) => {
            const override = overrides[person.rank];
            const displayName = override ? override.customName : person.name;
            const displayImage = override ? override.customImageUrl : person.imageUrl;
            const displayProfession = override ? override.customProfession : person.profession;
            const isPhysicalSticker = override?.visualStyle === 'physical-sticker';

            return (
              <div
                key={person.rank}
                data-rank={person.rank}
                className={`rounded-xl border overflow-hidden flex flex-col items-center text-center bg-white p-3 sm:p-4 transition-shadow hover:shadow-md ${
                  isPhysicalSticker
                    ? 'border-amber-400 ring-2 ring-amber-200 -rotate-1'
                    : 'border-neutral-200'
                }`}
              >
                <div className="w-full flex justify-start mb-2">
                  <span className="inline-flex items-center justify-center bg-[#0E63BE] text-white font-mono tabular-nums font-bold text-xs px-2 py-0.5 rounded-[3px] leading-tight">
                    #{person.rank}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPerson(person)}
                  className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-neutral-900 overflow-hidden cursor-pointer shrink-0 ${
                    isPhysicalSticker
                      ? 'ring-2 ring-white shadow-md'
                      : 'border border-neutral-200'
                  }`}
                >
                  <PersonAvatar name={displayName} imageUrl={displayImage} rank={person.rank} />
                  {isPhysicalSticker && override.badgeLabel && (
                    <span className="absolute bottom-0 inset-x-0 bg-[#F5C518] text-black text-[9px] font-bold px-1 py-0.5 text-center uppercase truncate">
                      {override.badgeLabel}
                    </span>
                  )}
                </button>

                <div className="mt-3 w-full flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <button
                      type="button"
                      onClick={() => onSelectPerson(person)}
                      className="font-display font-bold text-sm text-neutral-900 hover:text-[#0E63BE] truncate w-full cursor-pointer"
                    >
                      {displayName}
                    </button>
                    <p className="text-xs text-neutral-500 truncate mt-0.5">{displayProfession}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Authentic IMDb Footer */}
      <footer className="mt-12 pt-8 border-t border-neutral-200 text-center text-xs text-neutral-500 space-y-2">
        <p className="font-semibold text-neutral-700">IMDbPro STARmeter Top 100</p>
        <p>Ranking data updated continuously based on worldwide search and page activity.</p>
      </footer>
    </main>
  );
};
