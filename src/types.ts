export interface Person {
  id: number;
  rank: number;
  imdbId?: string;
  name: string;
  profession: string;
  imageUrl: string;
  starmeterChange: number;
  rating: number;
  bio: string;
  knownFor: string[];
  trendingReason: string;
}

export type StickerVisualStyle = 'imdb-seamless' | 'physical-sticker';
export type ReplaceBehavior = 'overwrite' | 'swap';
export type CueMode = 'none' | 'vibrate' | 'micro-dot';

export interface StickerPreset {
  id: string;
  label: string;
  customName: string;
  customProfession: string;
  customImageUrl: string;
  customKnownFor: string;
  badgeLabel: string;
}

export interface StickerConfig {
  mode: 'preset-or-custom' | 'existing-star';
  sourceRank: number;
  customName: string;
  customProfession: string;
  customImageUrl: string;
  customKnownFor: string;
  customBio: string;
  badgeLabel: string;
  visualStyle: StickerVisualStyle;
}

export interface PerformanceConfig {
  holdSeconds: number;
  targetOffset: number;
  replaceBehavior: ReplaceBehavior;
  cueMode: CueMode;
  showPracticeHud: boolean;
}

export interface StickerOverride {
  rank: number;
  customName: string;
  customProfession: string;
  customImageUrl: string;
  customKnownFor: string;
  customNote: string;
  badgeLabel: string;
  visualStyle: StickerVisualStyle;
  createdAt: string;
}

export type ViewMode = 'list' | 'grid';
export type SortMode = 'ranking' | 'movers' | 'alpha';
