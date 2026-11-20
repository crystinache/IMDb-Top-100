import React from 'react';
import { X, Film, Star } from 'lucide-react';
import { Person, StickerOverride } from '../types';
import { PersonAvatar } from './PersonAvatar';

interface StarDetailModalProps {
  person: Person;
  override?: StickerOverride;
  onClose: () => void;
}

export const StarDetailModal: React.FC<StarDetailModalProps> = ({
  person,
  override,
  onClose,
}) => {
  const name = override ? override.customName : person.name;
  const imageUrl = override ? override.customImageUrl : person.imageUrl;
  const profession = override ? override.customProfession : person.profession;
  const bio = override ? override.customNote || person.bio : person.bio;
  const knownFor = override?.customKnownFor
    ? [override.customKnownFor]
    : person.knownFor;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-neutral-200 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl text-neutral-900">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-[#121212] text-white">
          <div className="flex items-center gap-2.5">
            <span className="bg-[#0E63BE] text-white font-mono font-bold px-2 py-0.5 rounded-[3px] text-xs">
              #{person.rank}
            </span>
            <h3 className="font-display font-bold text-base">STARmeter Profile</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-neutral-300 hover:text-white p-1.5 rounded-md hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5 max-h-[80vh] overflow-y-auto">
          <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-neutral-900 shrink-0 border border-neutral-200 mx-auto sm:mx-0">
            <PersonAvatar name={name} imageUrl={imageUrl} rank={person.rank} />
          </div>

          <div className="flex-1 space-y-3.5 min-w-0">
            <div>
              <h2 className="font-display text-2xl font-bold text-neutral-900">{name}</h2>
              <p className="text-xs font-medium text-neutral-500 mt-0.5">{profession}</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-600 tabular-nums">
              <span className="inline-flex items-center gap-1 font-semibold text-neutral-900">
                <Star className="w-3.5 h-3.5 text-[#F5C518] fill-[#F5C518]" />
                STARmeter #{person.rank}
              </span>
              <span aria-hidden="true">·</span>
              <span>Score {person.rating}</span>
            </div>

            <p className="text-sm text-neutral-700 leading-relaxed">{bio}</p>

            {knownFor.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5" />
                  <span>Known For</span>
                </h4>
                <p className="text-sm font-medium text-[#0E63BE]">
                  {knownFor.join(' · ')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
