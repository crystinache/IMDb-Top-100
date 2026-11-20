import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { INITIAL_TRENDING_PEOPLE, STICKER_PRESETS } from './data/trending100';
import { CELEB_IMAGES } from './data/celebImages';
import {
  PerformanceConfig,
  Person,
  SortMode,
  StickerConfig,
  StickerOverride,
  ViewMode,
} from './types';
import { ImdbHeader } from './components/ImdbHeader';
import { ImdbChartList } from './components/ImdbChartList';
import { PerformanceSetupDrawer } from './components/PerformanceSetupDrawer';
import { StarDetailModal } from './components/StarDetailModal';
import { ExportModal } from './components/ExportModal';
import {
  detectBottomMostVisibleRank,
  useBottomDwellTrigger,
} from './hooks/useBottomDwellTrigger';

const STORAGE_OVERRIDES = 'imdb_sticker_overrides_v1';
const STORAGE_STICKER_CFG = 'imdb_sticker_config_v2';
const STORAGE_PERF_CFG = 'imdb_perf_config_v1';

const DEFAULT_STICKER_CONFIG: StickerConfig = {
  mode: 'preset-or-custom',
  sourceRank: 6,
  customName: STICKER_PRESETS[0].customName,
  customProfession: STICKER_PRESETS[0].customProfession,
  customImageUrl: STICKER_PRESETS[0].customImageUrl,
  customKnownFor: STICKER_PRESETS[0].customKnownFor,
  customBio:
    'Academy Award-winning actor and producer renowned for Titanic, Inception, and Killers of the Flower Moon.',
  badgeLabel: STICKER_PRESETS[0].badgeLabel,
  visualStyle: 'imdb-seamless',
};

const DEFAULT_PERF_CONFIG: PerformanceConfig = {
  holdSeconds: 7,
  targetOffset: 1,
  replaceBehavior: 'swap',
  cueMode: 'vibrate',
  showPracticeHud: false,
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function isLeonardoName(name: string): boolean {
  const normalized = name.toLowerCase().replace(/\s+/g, '');
  return normalized === 'leonardodicaprio';
}

function getRealImdbUrl(name: string, imdbId?: string): string {
  if (isLeonardoName(name)) {
    return 'https://www.imdb.com/name/nm0000138/';
  }
  if (imdbId) {
    return `https://www.imdb.com/name/${imdbId}/`;
  }
  return `https://www.imdb.com/find/?q=${encodeURIComponent(name)}&s=nm`;
}

export default function App() {
  const basePeopleRef = useRef<Person[]>(INITIAL_TRENDING_PEOPLE);
  const hasScrolledAwayRef = useRef(false);

  const [people, setPeople] = useState<Person[]>(INITIAL_TRENDING_PEOPLE);
  const [dataSource, setDataSource] = useState<'imdb-live' | 'curated'>('curated');
  const [isRefreshingLive, setIsRefreshingLive] = useState(false);

  const [overrides, setOverrides] = useState<Record<number, StickerOverride>>(() =>
    readStorage(STORAGE_OVERRIDES, {})
  );
  const [stickerConfig, setStickerConfig] = useState<StickerConfig>(() =>
    readStorage(STORAGE_STICKER_CFG, DEFAULT_STICKER_CONFIG)
  );
  const [perfConfig, setPerfConfig] = useState<PerformanceConfig>(() =>
    readStorage(STORAGE_PERF_CFG, DEFAULT_PERF_CONFIG)
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortMode, setSortMode] = useState<SortMode>('ranking');

  const [scrollArmed, setScrollArmed] = useState(false);
  const [manualPerformanceMode, setManualPerformanceMode] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [triggeredInfo, setTriggeredInfo] = useState<{
    bottomRank: number;
    targetRank: number;
  } | null>(null);
  const [timerResetKey, setTimerResetKey] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const [setupOpen, setSetupOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [deployModalOpen, setDeployModalOpen] = useState(false);

  const performanceMode = scrollArmed || manualPerformanceMode;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_OVERRIDES, JSON.stringify(overrides));
    } catch {
      // Ignore storage quota errors
    }
  }, [overrides]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_STICKER_CFG, JSON.stringify(stickerConfig));
    } catch {
      // Ignore storage quota errors
    }
  }, [stickerConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PERF_CFG, JSON.stringify(perfConfig));
    } catch {
      // Ignore storage quota errors
    }
  }, [perfConfig]);

  const fetchLiveStarmeter = useCallback(async () => {
    setIsRefreshingLive(true);
    try {
      const res = await fetch('/api/starmeter');
      if (!res.ok) return;
      const payload = (await res.json()) as {
        source?: string;
        people?: Array<{
          id: number;
          rank: number;
          imdbId?: string;
          name: string;
          profession: string;
          imageUrl: string;
          starmeterChange: number;
          knownFor: string[];
          bio: string;
        }>;
      };

      if (payload.source === 'imdb-live' && Array.isArray(payload.people) && payload.people.length >= 20) {
        const deduped = payload.people.filter((p) => !isLeonardoName(p.name));
        const mapped: Person[] = deduped.map((p, idx) => ({
          id: p.id || idx + 1,
          rank: idx + 1,
          imdbId: p.imdbId,
          name: p.name,
          profession: p.profession || 'Actor',
          imageUrl: p.imageUrl || CELEB_IMAGES[p.name] || '',
          starmeterChange: p.starmeterChange || 0,
          rating: Number((9.9 - idx * 0.024).toFixed(1)),
          bio: p.bio || `${p.name} on IMDbPro STARmeter.`,
          knownFor: p.knownFor || [],
          trendingReason: `Ranked #${idx + 1} on IMDbPro STARmeter.`,
        }));
        basePeopleRef.current = mapped;
        setPeople(mapped);
        setDataSource('imdb-live');
      }
    } catch {
      // Keep curated Top 100 silently
    } finally {
      setIsRefreshingLive(false);
    }
  }, []);

  useEffect(() => {
    void fetchLiveStarmeter();
  }, [fetchLiveStarmeter]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        setSetupOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const resetPerformanceState = useCallback(() => {
    setPeople(basePeopleRef.current);
    setOverrides({});
    setHasTriggered(false);
    setTriggeredInfo(null);
    setScrollArmed(false);
    setManualPerformanceMode(false);
    setTimerResetKey((k) => k + 1);
    localStorage.removeItem(STORAGE_OVERRIDES);
  }, []);

  const handleSwapPositions = useCallback((rankA: number, rankB: number) => {
    if (rankA === rankB) return;

    setPeople((prev) => {
      const next = [...prev];
      const idxA = next.findIndex((p) => p.rank === rankA);
      const idxB = next.findIndex((p) => p.rank === rankB);
      if (idxA === -1 || idxB === -1) return prev;

      const personA = { ...next[idxA] };
      const personB = { ...next[idxB] };

      next[idxA] = { ...personB, rank: rankA };
      next[idxB] = { ...personA, rank: rankB };
      return next;
    });

    setOverrides((prev) => {
      const next = { ...prev };
      const ovA = next[rankA];
      const ovB = next[rankB];
      if (ovA && ovB) {
        next[rankA] = { ...ovB, rank: rankA };
        next[rankB] = { ...ovA, rank: rankB };
      } else if (ovA) {
        next[rankB] = { ...ovA, rank: rankB };
        delete next[rankA];
      } else if (ovB) {
        next[rankA] = { ...ovB, rank: rankA };
        delete next[rankB];
      }
      return next;
    });
  }, []);

  const handleDwellTrigger = useCallback(
    (bottomRank: number, targetRank: number) => {
      if (hasTriggered) return;

      if (stickerConfig.mode === 'existing-star') {
        const sourceRank = stickerConfig.sourceRank;
        const sourcePerson = people.find((p) => p.rank === sourceRank);

        if (perfConfig.replaceBehavior === 'swap' && sourceRank !== targetRank) {
          handleSwapPositions(sourceRank, targetRank);
          if (stickerConfig.visualStyle === 'physical-sticker' && sourcePerson) {
            setOverrides((prev) => ({
              ...prev,
              [targetRank]: {
                rank: targetRank,
                customName: sourcePerson.name,
                customProfession: sourcePerson.profession,
                customImageUrl: sourcePerson.imageUrl,
                customKnownFor: sourcePerson.knownFor.slice(0, 2).join(' · '),
                customNote: sourcePerson.bio,
                badgeLabel: stickerConfig.badgeLabel || 'STICKER',
                visualStyle: 'physical-sticker',
                createdAt: new Date().toISOString(),
              },
            }));
          }
        } else if (sourcePerson) {
          setOverrides((prev) => ({
            ...prev,
            [targetRank]: {
              rank: targetRank,
              customName: sourcePerson.name,
              customProfession: sourcePerson.profession,
              customImageUrl: sourcePerson.imageUrl,
              customKnownFor: sourcePerson.knownFor.slice(0, 2).join(' · '),
              customNote: sourcePerson.bio,
              badgeLabel: stickerConfig.badgeLabel || 'STICKER',
              visualStyle: stickerConfig.visualStyle,
              createdAt: new Date().toISOString(),
            },
          }));
        }
      } else {
        setOverrides((prev) => ({
          ...prev,
          [targetRank]: {
            rank: targetRank,
            customName: stickerConfig.customName.trim() || 'Leonardo DiCaprio',
            customProfession: stickerConfig.customProfession.trim() || 'Actor · Producer',
            customImageUrl: stickerConfig.customImageUrl,
            customKnownFor: stickerConfig.customKnownFor.trim(),
            customNote: stickerConfig.customBio,
            badgeLabel: stickerConfig.badgeLabel || 'STICKER',
            visualStyle: stickerConfig.visualStyle,
            createdAt: new Date().toISOString(),
          },
        }));
      }

      setHasTriggered(true);
      setTriggeredInfo({ bottomRank, targetRank });

      if (perfConfig.cueMode === 'vibrate' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(40);
      }
    },
    [hasTriggered, stickerConfig, people, perfConfig, handleSwapPositions]
  );

  const dwellState = useBottomDwellTrigger({
    armed: performanceMode && !hasTriggered && !setupOpen,
    hasTriggered,
    holdSeconds: perfConfig.holdSeconds,
    targetOffset: perfConfig.targetOffset,
    maxRank: people.length,
    resetKey: timerResetKey,
    onTrigger: handleDwellTrigger,
  });

  const handleStartPerformance = () => {
    setHasTriggered(false);
    setTriggeredInfo(null);
    setManualPerformanceMode(true);
    setSetupOpen(false);
  };

  const handleStopPerformance = () => {
    setManualPerformanceMode(false);
    setScrollArmed(false);
  };

  const handleBackToTop = () => {
    hasScrolledAwayRef.current = false;
    resetPerformanceState();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPerson = useCallback(
    (person: Person) => {
      const ov = overrides[person.rank];
      const isStickerApplied =
        Boolean(ov) || (hasTriggered && triggeredInfo?.targetRank === person.rank);

      if (isStickerApplied) {
        const targetName = ov ? ov.customName : person.name;
        const realImdbUrl = getRealImdbUrl(targetName, person.imdbId);
        try {
          localStorage.removeItem(STORAGE_OVERRIDES);
        } catch {
          // Ignore storage errors
        }
        try {
          if (window.top && window.top !== window) {
            window.top.location.replace(realImdbUrl);
            return;
          }
        } catch {
          // Fallback to current window replace when cross-origin framed
        }
        window.location.replace(realImdbUrl);
        return;
      }

      setSelectedPerson(person);
    },
    [overrides, hasTriggered, triggeredInfo]
  );

  const filteredPeople = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let list = [...people];

    if (query) {
      const cleanNumber = query.replace('#', '');
      const numericRank = Number(cleanNumber);
      list = list.filter((p) => {
        const ov = overrides[p.rank];
        const name = (ov ? ov.customName : p.name).toLowerCase();
        const prof = (ov ? ov.customProfession : p.profession).toLowerCase();
        const known = (ov ? ov.customKnownFor : p.knownFor.join(' ')).toLowerCase();
        if (Number.isInteger(numericRank) && numericRank > 0 && p.rank === numericRank) {
          return true;
        }
        return name.includes(query) || prof.includes(query) || known.includes(query);
      });
    }

    if (sortMode === 'movers') {
      list.sort((a, b) => Math.abs(b.starmeterChange) - Math.abs(a.starmeterChange));
    } else if (sortMode === 'alpha') {
      list.sort((a, b) => {
        const nameA = overrides[a.rank]?.customName || a.name;
        const nameB = overrides[b.rank]?.customName || b.name;
        return nameA.localeCompare(nameB);
      });
    } else {
      list.sort((a, b) => a.rank - b.rank);
    }

    return list;
  }, [people, overrides, searchQuery, sortMode]);

  useEffect(() => {
    const handleScrollState = () => {
      const y = window.scrollY;

      if (y > 12) {
        hasScrolledAwayRef.current = true;
        if (!setupOpen) {
          setScrollArmed(true);
        }
      } else if (y <= 12 && hasScrolledAwayRef.current) {
        hasScrolledAwayRef.current = false;
        resetPerformanceState();
      }

      if (y < 80) {
        setShowBackToTop(false);
        return;
      }

      const el15 = document.querySelector<HTMLElement>('[data-rank="15"]');
      const bottomRank = detectBottomMostVisibleRank();

      if (bottomRank !== null && bottomRank > 15) {
        setShowBackToTop(true);
        return;
      }

      if (el15) {
        const rect15 = el15.getBoundingClientRect();
        setShowBackToTop(rect15.top < 64);
        return;
      }

      setShowBackToTop(y > 900);
    };

    handleScrollState();
    window.addEventListener('scroll', handleScrollState, { passive: true });
    window.addEventListener('resize', handleScrollState, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScrollState);
      window.removeEventListener('resize', handleScrollState);
    };
  }, [filteredPeople, viewMode, sortMode, setupOpen, resetPerformanceState]);

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <ImdbHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        performanceMode={performanceMode}
        onOpenSetup={() => setSetupOpen(true)}
        onSecretTrigger={() => setSetupOpen((prev) => !prev)}
      />

      {showBackToTop && (
        <button
          type="button"
          onClick={handleBackToTop}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm hover:bg-neutral-100 text-neutral-900 border border-neutral-300 shadow-md rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          <span>Back to top</span>
        </button>
      )}

      <ImdbChartList
        people={filteredPeople}
        overrides={overrides}
        viewMode={viewMode}
        setViewMode={setViewMode}
        sortMode={sortMode}
        setSortMode={setSortMode}
        dataSource={dataSource}
        onSelectPerson={handleSelectPerson}
      />

      {/* Practice HUD (visible ONLY if explicitly enabled for rehearsal) */}
      {performanceMode && perfConfig.showPracticeHud && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[#121212]/95 text-white px-4 py-2.5 rounded-xl border border-neutral-700 shadow-xl flex items-center gap-4 text-xs tabular-nums max-w-[92vw]">
          {hasTriggered && triggeredInfo ? (
            <span className="font-semibold text-[#F5C518]">
              Sostituito #{triggeredInfo.targetRank} (dopo sosta su #{triggeredInfo.bottomRank})
            </span>
          ) : (
            <>
              <span>
                Basso: <strong>#{dwellState.bottomRank ?? '—'}</strong>
              </span>
              <span>
                Target: <strong>#{dwellState.predictedTargetRank ?? '—'}</strong>
              </span>
              <span className="font-mono">
                {(dwellState.dwellMs / 1000).toFixed(1)}s / {perfConfig.holdSeconds}.0s
              </span>
            </>
          )}
        </div>
      )}

      {/* Discreet optional micro-dot cue after trigger fires */}
      {performanceMode &&
        perfConfig.cueMode === 'micro-dot' &&
        hasTriggered && (
          <span
            aria-hidden="true"
            className="fixed bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-neutral-400/60 pointer-events-none z-40"
          />
        )}

      <PerformanceSetupDrawer
        isOpen={setupOpen}
        onClose={() => setSetupOpen(false)}
        people={people}
        stickerConfig={stickerConfig}
        setStickerConfig={setStickerConfig}
        perfConfig={perfConfig}
        setPerfConfig={setPerfConfig}
        performanceMode={performanceMode}
        hasTriggered={hasTriggered}
        triggeredInfo={triggeredInfo}
        onStartPerformance={handleStartPerformance}
        onStopPerformance={handleStopPerformance}
        onResetAll={resetPerformanceState}
        onRefreshLive={fetchLiveStarmeter}
        isRefreshingLive={isRefreshingLive}
        dataSource={dataSource}
        onOpenDeployModal={() => {
          setSetupOpen(false);
          setDeployModalOpen(true);
        }}
      />

      {selectedPerson && (
        <StarDetailModal
          person={selectedPerson}
          override={overrides[selectedPerson.rank]}
          onClose={() => setSelectedPerson(null)}
        />
      )}

      {deployModalOpen && (
        <ExportModal
          overrides={overrides}
          onClose={() => setDeployModalOpen(false)}
        />
      )}
    </div>
  );
}
