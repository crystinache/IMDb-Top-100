import React, { useRef, useState } from 'react';
import {
  X,
  Upload,
  Play,
  RotateCcw,
  RefreshCw,
  Github,
  Check,
  Clock,
  ArrowLeftRight,
  Eye,
} from 'lucide-react';
import {
  CueMode,
  PerformanceConfig,
  Person,
  ReplaceBehavior,
  StickerConfig,
  StickerVisualStyle,
} from '../types';
import { STICKER_PRESETS } from '../data/trending100';
import { PersonAvatar } from './PersonAvatar';
import { compressImageFile } from '../utils/imageUpload';

interface PerformanceSetupDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  stickerConfig: StickerConfig;
  setStickerConfig: React.Dispatch<React.SetStateAction<StickerConfig>>;
  perfConfig: PerformanceConfig;
  setPerfConfig: React.Dispatch<React.SetStateAction<PerformanceConfig>>;
  performanceMode: boolean;
  hasTriggered: boolean;
  triggeredInfo: { bottomRank: number; targetRank: number } | null;
  onStartPerformance: () => void;
  onStopPerformance: () => void;
  onResetAll: () => void;
  onRefreshLive: () => Promise<void>;
  isRefreshingLive: boolean;
  dataSource: 'imdb-live' | 'curated';
  onOpenDeployModal: () => void;
}

export const PerformanceSetupDrawer: React.FC<PerformanceSetupDrawerProps> = ({
  isOpen,
  onClose,
  people,
  stickerConfig,
  setStickerConfig,
  perfConfig,
  setPerfConfig,
  performanceMode,
  hasTriggered,
  triggeredInfo,
  onStartPerformance,
  onStopPerformance,
  onResetAll,
  onRefreshLive,
  isRefreshingLive,
  dataSource,
  onOpenDeployModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    try {
      const dataUrl = await compressImageFile(file);
      setStickerConfig((prev) => ({
        ...prev,
        mode: 'preset-or-custom',
        customImageUrl: dataUrl,
      }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Errore caricamento immagine');
    }
  };

  const selectedSourcePerson = people.find((p) => p.rank === stickerConfig.sourceRank);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white text-neutral-900 w-full max-w-lg h-full flex flex-col shadow-2xl border-l border-neutral-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-[#121212] text-white shrink-0">
          <div>
            <h2 className="font-display font-bold text-base">
              Configurazione Sticker & Performance
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Prepara lo sticker prima di iniziare · Triplo tap su IMDb per riaprire
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi pannello"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-md text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Status Summary if Performance Active or Triggered */}
          {(performanceMode || hasTriggered) && (
            <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-neutral-900">
                  {hasTriggered
                    ? `Sostituzione completata: #${triggeredInfo?.bottomRank} in basso → #${triggeredInfo?.targetRank} sostituito`
                    : 'Modalità Performance attiva (UI nascosta)'}
                </span>
                {performanceMode && (
                  <button
                    type="button"
                    onClick={onStopPerformance}
                    className="text-[#0E63BE] hover:underline cursor-pointer"
                  >
                    Esci da Performance
                  </button>
                )}
              </div>
              <p className="text-xs text-neutral-600">
                {hasTriggered
                  ? 'La pagina ora scorre normalmente mantenendo lo sticker nella nuova posizione.'
                  : `Fermati per ${perfConfig.holdSeconds}s su una posizione: sostituirà la posizione +${perfConfig.targetOffset} sotto l'ultima visibile.`}
              </p>
            </div>
          )}

          {/* 1. Sticker Selection */}
          <section className="space-y-3">
            <h3 className="font-display font-bold text-sm text-neutral-900">
              01. Scegli lo Sticker da inserire
            </h3>

            {/* Mode Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-100 rounded-lg border border-neutral-200">
              <button
                type="button"
                onClick={() =>
                  setStickerConfig((prev) => ({ ...prev, mode: 'preset-or-custom' }))
                }
                className={`py-2 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  stickerConfig.mode === 'preset-or-custom'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Sticker / Foto Custom
              </button>
              <button
                type="button"
                onClick={() =>
                  setStickerConfig((prev) => ({ ...prev, mode: 'existing-star' }))
                }
                className={`py-2 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  stickerConfig.mode === 'existing-star'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Celebrità della Top 100
              </button>
            </div>

            {stickerConfig.mode === 'preset-or-custom' ? (
              <div className="space-y-4">
                {/* Preset Thumbnails */}
                <div>
                  <span className="block text-xs font-medium text-neutral-600 mb-2">
                    Preset rapidi o carica la tua foto:
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {STICKER_PRESETS.map((preset) => {
                      const isSelected = stickerConfig.customImageUrl === preset.customImageUrl;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            setStickerConfig((prev) => ({
                              ...prev,
                              customName: preset.customName,
                              customProfession: preset.customProfession,
                              customImageUrl: preset.customImageUrl,
                              customKnownFor: preset.customKnownFor,
                              badgeLabel: preset.badgeLabel,
                            }))
                          }
                          title={preset.label}
                          className={`relative aspect-[3/4] rounded-lg overflow-hidden border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#F5C518] ring-2 ring-[#F5C518]'
                              : 'border-neutral-200 hover:border-neutral-400'
                          }`}
                        >
                          <img
                            src={preset.customImageUrl}
                            alt={preset.label}
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <span className="absolute top-1 right-1 bg-[#F5C518] text-black rounded-full p-0.5">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Upload Custom Photo */}
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold text-neutral-800 cursor-pointer min-h-[40px]"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Carica foto dal dispositivo</span>
                  </button>
                  <div className="w-10 h-12 rounded overflow-hidden border border-neutral-200 shrink-0 bg-neutral-900">
                    <PersonAvatar
                      name={stickerConfig.customName || 'Sticker'}
                      imageUrl={stickerConfig.customImageUrl}
                    />
                  </div>
                </div>
                {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}

                {/* Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Nome visualizzato
                    </label>
                    <input
                      type="text"
                      value={stickerConfig.customName}
                      onChange={(e) =>
                        setStickerConfig((prev) => ({ ...prev, customName: e.target.value }))
                      }
                      placeholder="Es. Marco Bellini"
                      className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Professione / Ruolo
                    </label>
                    <input
                      type="text"
                      value={stickerConfig.customProfession}
                      onChange={(e) =>
                        setStickerConfig((prev) => ({
                          ...prev,
                          customProfession: e.target.value,
                        }))
                      }
                      placeholder="Es. Actor · Producer"
                      className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Conosciuto/a per (Film/Serie)
                    </label>
                    <input
                      type="text"
                      value={stickerConfig.customKnownFor}
                      onChange={(e) =>
                        setStickerConfig((prev) => ({ ...prev, customKnownFor: e.target.value }))
                      }
                      placeholder="Es. The Midnight Premiere"
                      className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Etichetta Sticker (se visibile)
                    </label>
                    <input
                      type="text"
                      value={stickerConfig.badgeLabel}
                      onChange={(e) =>
                        setStickerConfig((prev) => ({ ...prev, badgeLabel: e.target.value }))
                      }
                      placeholder="Es. MY STICKER"
                      className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Seleziona una persona dalla Top 100 da spostare/inserire:
                  </label>
                  <select
                    value={stickerConfig.sourceRank}
                    onChange={(e) =>
                      setStickerConfig((prev) => ({
                        ...prev,
                        sourceRank: Number(e.target.value),
                      }))
                    }
                    className="w-full border border-neutral-300 rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-neutral-900"
                  >
                    {people.map((p) => (
                      <option key={p.rank} value={p.rank}>
                        #{p.rank} · {p.name} ({p.profession})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSourcePerson && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 bg-neutral-50">
                    <div className="w-11 h-14 rounded overflow-hidden shrink-0 bg-neutral-900">
                      <PersonAvatar
                        name={selectedSourcePerson.name}
                        imageUrl={selectedSourcePerson.imageUrl}
                        rank={selectedSourcePerson.rank}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-neutral-900 truncate">
                        #{selectedSourcePerson.rank} {selectedSourcePerson.name}
                      </p>
                      <p className="text-xs text-neutral-600 truncate">
                        {selectedSourcePerson.profession}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <span className="block text-xs font-medium text-neutral-700 mb-1.5">
                    Comportamento sostituzione:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'swap', label: 'Scambia / Inverti (#6 ↔ #11)' },
                        { id: 'overwrite', label: 'Sostituisci solo target' },
                      ] as { id: ReplaceBehavior; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setPerfConfig((prev) => ({ ...prev, replaceBehavior: opt.id }))
                        }
                        className={`px-3 py-2 rounded-md text-xs font-medium border text-left cursor-pointer ${
                          perfConfig.replaceBehavior === opt.id
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Visual Style */}
            <div>
              <span className="block text-xs font-medium text-neutral-700 mb-1.5">
                Aspetto dello Sticker nella classifica:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      id: 'imdb-seamless',
                      label: 'IMDb Reale (Invisibile)',
                      desc: 'Identico alle altre righe IMDb',
                    },
                    {
                      id: 'physical-sticker',
                      label: 'Sticker Adesivo',
                      desc: 'Bordo bianco inclinato con badge',
                    },
                  ] as { id: StickerVisualStyle; label: string; desc: string }[]
                ).map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() =>
                      setStickerConfig((prev) => ({ ...prev, visualStyle: style.id }))
                    }
                    className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      stickerConfig.visualStyle === style.id
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50'
                    }`}
                  >
                    <span className="block text-xs font-semibold">{style.label}</span>
                    <span
                      className={`block text-[11px] mt-0.5 ${
                        stickerConfig.visualStyle === style.id
                          ? 'text-neutral-300'
                          : 'text-neutral-500'
                      }`}
                    >
                      {style.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <hr className="border-neutral-200" />

          {/* 2. 7-Second Trigger Configuration */}
          <section className="space-y-3">
            <h3 className="font-display font-bold text-sm text-neutral-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-700" />
              <span>02. Trigger Sosta in Basso (7 Secondi)</span>
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Quando lo spettatore si ferma per più di{' '}
              <strong className="text-neutral-900">{perfConfig.holdSeconds} secondi</strong> in un
              punto dove l&apos;ultima persona visibile in basso è il numero <em>N</em> (es. #10),
              l&apos;app sostituisce silenziosamente la posizione{' '}
              <strong className="text-neutral-900">
                N{perfConfig.targetOffset > 0 ? `+${perfConfig.targetOffset}` : ''}
              </strong>{' '}
              (es. #11). Poi lo scroll continua normalmente.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Secondi di sosta ({perfConfig.holdSeconds}s)
                </label>
                <input
                  type="range"
                  min={3}
                  max={15}
                  step={1}
                  value={perfConfig.holdSeconds}
                  onChange={(e) =>
                    setPerfConfig((prev) => ({
                      ...prev,
                      holdSeconds: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Posizione da sostituire
                </label>
                <select
                  value={perfConfig.targetOffset}
                  onChange={(e) =>
                    setPerfConfig((prev) => ({
                      ...prev,
                      targetOffset: Number(e.target.value),
                    }))
                  }
                  className="w-full border border-neutral-300 rounded-md px-2.5 py-2 text-xs font-medium bg-white"
                >
                  <option value={1}>+1 (Successiva sotto al #N, es. #10 → #11)</option>
                  <option value={0}>0 (L&apos;ultima visibile in basso #N)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Segnale discreto al trigger
                </label>
                <select
                  value={perfConfig.cueMode}
                  onChange={(e) =>
                    setPerfConfig((prev) => ({
                      ...prev,
                      cueMode: e.target.value as CueMode,
                    }))
                  }
                  className="w-full border border-neutral-300 rounded-md px-2.5 py-2 text-xs font-medium bg-white"
                >
                  <option value="vibrate">Vibrazione discreta (40ms)</option>
                  <option value="micro-dot">Micro-punto in angolo</option>
                  <option value="none">Nessun segnale</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 text-xs font-medium text-neutral-800 border border-neutral-200 rounded-md px-3 py-2 w-full cursor-pointer hover:bg-neutral-50">
                  <input
                    type="checkbox"
                    checked={perfConfig.showPracticeHud}
                    onChange={(e) =>
                      setPerfConfig((prev) => ({
                        ...prev,
                        showPracticeHud: e.target.checked,
                      }))
                    }
                    className="accent-neutral-900"
                  />
                  <Eye className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Mostra timer di prova</span>
                </label>
              </div>
            </div>
          </section>

          <hr className="border-neutral-200" />

          {/* 3. Utility & Deploy Actions */}
          <section className="space-y-2.5">
            <h3 className="font-display font-bold text-sm text-neutral-900">
              03. Dati IMDb & Deploy GitHub / Vercel
            </h3>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void onRefreshLive()}
                disabled={isRefreshingLive}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-800 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingLive ? 'animate-spin' : ''}`} />
                <span>
                  {isRefreshingLive
                    ? 'Sincronizzazione...'
                    : `Aggiorna IMDb (${dataSource === 'imdb-live' ? 'Live' : 'Curated'})`}
                </span>
              </button>

              <button
                type="button"
                onClick={onResetAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-800 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ripristina 1–100</span>
              </button>

              <button
                type="button"
                onClick={onOpenDeployModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-800 cursor-pointer"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub & Vercel</span>
              </button>
            </div>
          </section>
        </div>

        {/* Footer Primary CTA */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 shrink-0 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-md text-xs font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Chiudi
          </button>

          <button
            type="button"
            onClick={onStartPerformance}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#F5C518] hover:bg-[#e3b512] text-black font-bold text-sm px-5 py-2.5 rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>Avvia Performance (Nascondi tutto)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
