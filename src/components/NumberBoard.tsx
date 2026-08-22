import React, { useState } from 'react';
import { Hash, Sparkles, Filter, Grid } from 'lucide-react';
import { TAMBOLA_NICKNAMES } from '../utils/tambolaNicknames';
import { AppTemplateId, getAppTemplate } from '../utils/appThemes';

interface NumberBoardProps {
  calledNumbers: number[];
  currentNumber: number | null;
  onNumberClick?: (num: number) => void;
  templateId?: AppTemplateId;
}

export const NumberBoard: React.FC<NumberBoardProps> = ({
  calledNumbers,
  currentNumber,
  onNumberClick,
  templateId = 'royal_gold',
}) => {
  const [filter, setFilter] = useState<'all' | 'called' | 'uncalled'>('all');
  const calledSet = new Set(calledNumbers);
  const template = getAppTemplate(templateId);

  const numbers = Array.from({ length: 90 }, (_, i) => i + 1);

  return (
    <div className={`rounded-3xl p-3.5 sm:p-5 border-2 shadow-2xl ${template.numberBoardTheme.boardBg}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3.5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 shadow-md">
            <Grid className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-100 flex items-center gap-2">
              <span>मास्टर नंबर बोर्ड (1–90 Board)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 text-amber-300 font-bold border border-amber-400/30">
                अपना तंबोला
              </span>
            </h3>
            <p className="text-[11px] text-slate-300">
              Called: <strong className="text-amber-400 font-black">{calledNumbers.length}</strong> / 90 | Remaining: <strong className="text-slate-200">{90 - calledNumbers.length}</strong>
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              filter === 'all' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All (90)
          </button>
          <button
            onClick={() => setFilter('called')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              filter === 'called' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Called ({calledNumbers.length})
          </button>
          <button
            onClick={() => setFilter('uncalled')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              filter === 'uncalled' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Uncalled ({90 - calledNumbers.length})
          </button>
        </div>
      </div>

      {/* 1-90 Number Grid */}
      <div className="grid grid-cols-10 gap-1 sm:gap-1.5 select-none">
        {numbers.map((num) => {
          const isCalled = calledSet.has(num);
          const isCurrent = currentNumber === num;
          const nickname = TAMBOLA_NICKNAMES[num];

          if (filter === 'called' && !isCalled) return null;
          if (filter === 'uncalled' && isCalled) return null;

          return (
            <button
              key={num}
              id={`board-cell-${num}`}
              onClick={() => onNumberClick && onNumberClick(num)}
              title={`${num} - ${nickname || 'Tambola Number'}`}
              className={`relative h-7 sm:h-9 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center transition-all cursor-default group ${
                isCurrent
                  ? `${template.numberBoardTheme.currentBg} scale-110 z-20 animate-pulse shadow-xl`
                  : isCalled
                  ? `${template.numberBoardTheme.calledBg} ${template.numberBoardTheme.calledText} shadow-md border border-white/20`
                  : `${template.numberBoardTheme.uncalledBg} ${template.numberBoardTheme.uncalledText} hover:border-slate-600 hover:text-slate-200`
              }`}
            >
              <span>{num}</span>
              {isCurrent && (
                <span className="w-2 h-2 rounded-full bg-red-600 absolute -top-0.5 -right-0.5 animate-ping" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

