import { useEffect, useRef, useState } from 'react';

interface UseBottomDwellTriggerOptions {
  armed: boolean;
  hasTriggered: boolean;
  holdSeconds: number;
  targetOffset: number;
  maxRank: number;
  resetKey?: number;
  onTrigger: (bottomRank: number, targetRank: number) => void;
}

export interface BottomDwellState {
  bottomRank: number | null;
  predictedTargetRank: number | null;
  dwellMs: number;
}

export function detectBottomMostVisibleRank(): number | null {
  const nodes = document.querySelectorAll<HTMLElement>('[data-rank]');
  if (nodes.length === 0) return null;

  const viewportHeight = window.innerHeight;
  const headerClearance = 64;
  const minVisibleEdge = 34;

  let bestRank: number | null = null;
  let maxBottom = -Infinity;

  nodes.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const isVisible = rect.top < viewportHeight - minVisibleEdge && rect.bottom > headerClearance;
    if (!isVisible) return;

    const rankAttr = Number(el.dataset.rank);
    if (!Number.isFinite(rankAttr)) return;

    if (rect.bottom > maxBottom || (Math.abs(rect.bottom - maxBottom) < 8 && rankAttr > (bestRank ?? 0))) {
      maxBottom = rect.bottom;
      bestRank = rankAttr;
    }
  });

  return bestRank;
}

export function useBottomDwellTrigger({
  armed,
  hasTriggered,
  holdSeconds,
  targetOffset,
  maxRank,
  resetKey = 0,
  onTrigger,
}: UseBottomDwellTriggerOptions): BottomDwellState {
  const [bottomRank, setBottomRank] = useState<number | null>(null);
  const [dwellMs, setDwellMs] = useState(0);

  const lastScrollYRef = useRef<number>(typeof window !== 'undefined' ? window.scrollY : 0);
  const stableRankRef = useRef<number | null>(null);
  const settleStartRef = useRef<number | null>(null);
  const isScrollingRef = useRef(false);
  const scrollIdleTimerRef = useRef<number | null>(null);
  const onTriggerRef = useRef(onTrigger);

  onTriggerRef.current = onTrigger;

  useEffect(() => {
    setDwellMs(0);
    settleStartRef.current = null;
    stableRankRef.current = null;
  }, [resetKey]);

  useEffect(() => {
    if (!armed) {
      setDwellMs(0);
      settleStartRef.current = null;
      return;
    }

    const updateRankAndResetIfMoved = () => {
      const detected = detectBottomMostVisibleRank();
      setBottomRank(detected);
      if (detected !== stableRankRef.current) {
        stableRankRef.current = detected;
        settleStartRef.current = detected !== null ? performance.now() : null;
        setDwellMs(0);
      }
    };

    updateRankAndResetIfMoved();

    const handleScroll = () => {
      const delta = Math.abs(window.scrollY - lastScrollYRef.current);
      lastScrollYRef.current = window.scrollY;

      if (delta > 5) {
        isScrollingRef.current = true;
        settleStartRef.current = null;
        setDwellMs(0);

        if (scrollIdleTimerRef.current !== null) {
          window.clearTimeout(scrollIdleTimerRef.current);
        }

        scrollIdleTimerRef.current = window.setTimeout(() => {
          isScrollingRef.current = false;
          const detected = detectBottomMostVisibleRank();
          stableRankRef.current = detected;
          setBottomRank(detected);
          settleStartRef.current = detected !== null ? performance.now() : null;
          setDwellMs(0);
        }, 140);
      }
    };

    const handleResize = () => {
      updateRankAndResetIfMoved();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    const intervalId = window.setInterval(() => {
      if (hasTriggered || isScrollingRef.current) return;

      const currentDetected = detectBottomMostVisibleRank();
      if (currentDetected !== stableRankRef.current) {
        stableRankRef.current = currentDetected;
        setBottomRank(currentDetected);
        settleStartRef.current = currentDetected !== null ? performance.now() : null;
        setDwellMs(0);
        return;
      }

      if (currentDetected === null) return;

      if (settleStartRef.current === null) {
        settleStartRef.current = performance.now();
      }

      const elapsed = performance.now() - settleStartRef.current;
      const thresholdMs = Math.max(1000, holdSeconds * 1000);
      setDwellMs(Math.min(elapsed, thresholdMs));

      if (elapsed >= thresholdMs) {
        const targetRank = Math.min(maxRank, Math.max(1, currentDetected + targetOffset));
        onTriggerRef.current(currentDetected, targetRank);
      }
    }, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.clearInterval(intervalId);
      if (scrollIdleTimerRef.current !== null) {
        window.clearTimeout(scrollIdleTimerRef.current);
      }
    };
  }, [armed, hasTriggered, holdSeconds, targetOffset, maxRank]);

  const predictedTargetRank =
    bottomRank !== null ? Math.min(maxRank, Math.max(1, bottomRank + targetOffset)) : null;

  return {
    bottomRank,
    predictedTargetRank,
    dwellMs,
  };
}
