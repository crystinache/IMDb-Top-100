import React, { useState } from 'react';
import { X, Github, Download, Copy, Check } from 'lucide-react';
import { StickerOverride } from '../types';

interface ExportModalProps {
  overrides: Record<number, StickerOverride>;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ overrides, onClose }) => {
  const [copied, setCopied] = useState(false);
  const stickerCount = Object.keys(overrides).length;

  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(overrides, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'imdb-top100-stickers.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyCommands = () => {
    const commands = `git init
git add .
git commit -m "IMDb Top 100 Sticker Performance App"
git branch -M main
git remote add origin https://github.com/<tuo-utente>/<tuo-repo>.git
git push -u origin main`;
    void navigator.clipboard.writeText(commands);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-neutral-200 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl text-neutral-900">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-[#121212] text-white">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-[#F5C518]" />
            <h3 className="font-display font-bold text-base">Salva su GitHub & Deploy su Vercel</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="text-neutral-300 hover:text-white p-1.5 rounded-md hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2">
            <h4 className="font-display font-bold text-sm text-neutral-900">
              Progetto già pronto per GitHub + Vercel
            </h4>
            <ol className="text-xs text-neutral-700 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>
                Scarica o esporta il codice del progetto e caricalo in un repository su{' '}
                <strong className="text-neutral-900">GitHub</strong>.
              </li>
              <li>
                Il file <code className="bg-neutral-200 px-1 py-0.5 rounded">vercel.json</code> e
                la funzione serverless{' '}
                <code className="bg-neutral-200 px-1 py-0.5 rounded">/api/starmeter.ts</code> sono
                già configurati per Vercel.
              </li>
              <li>
                Su <strong className="text-neutral-900">Vercel.com</strong> clicca{' '}
                <em>Add New Project</em>, seleziona il tuo repo GitHub e premi <em>Deploy</em>{' '}
                (build command <code className="bg-neutral-200 px-1 py-0.5 rounded">npm run build</code>,
                output <code className="bg-neutral-200 px-1 py-0.5 rounded">dist</code>).
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-700">Comandi Git rapidi</span>
              <button
                type="button"
                onClick={handleCopyCommands}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E63BE] hover:underline cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiati!' : 'Copia comandi Git'}</span>
              </button>
            </div>
            <pre className="bg-[#121212] text-neutral-100 text-[11px] font-mono p-3.5 rounded-lg overflow-x-auto leading-relaxed">
{`git init
git add .
git commit -m "IMDb Top 100 Sticker Performance App"
git branch -M main
git remote add origin https://github.com/<tuo-utente>/<tuo-repo>.git
git push -u origin main`}
            </pre>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={handleExportJSON}
              className="inline-flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-semibold px-3.5 py-2 rounded-md border border-neutral-300 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Esporta Sticker ({stickerCount}) JSON</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs font-semibold cursor-pointer"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
