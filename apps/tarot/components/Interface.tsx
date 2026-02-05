import React, { useEffect, useRef } from 'react';
import { useTarot } from '../services/TarotContext';
import { InputMode, GestureType } from '../types';

interface InterfaceProps {
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
  gesture: GestureType;
  isCameraReady: boolean;
  handPosition?: { x: number; y: number };
}

const Interface: React.FC<InterfaceProps> = ({ inputMode, setInputMode, gesture, isCameraReady, handPosition }) => {
  const { history, deck, resetDeck, currentCard, viewingCard, viewHistoryCard, clearViewingCard } = useTarot();
  const historyRef = useRef<HTMLDivElement>(null);

  const displayCard = currentCard || viewingCard;

  useEffect(() => {
    if (inputMode === InputMode.HAND && gesture === GestureType.PINCH && handPosition) {
      const screenX = ((handPosition.x + 1) / 2) * window.innerWidth;
      const screenY = ((1 - handPosition.y) / 2) * window.innerHeight;
      const element = document.elementFromPoint(screenX, screenY);

      if (element) {
        const historyItem = element.closest('[data-history-id]');
        if (historyItem) {
          const timestamp = Number(historyItem.getAttribute('data-history-id'));
          const card = history.find(c => c.timestamp === timestamp);
          if (card && (!viewingCard || viewingCard.timestamp !== card.timestamp)) {
            viewHistoryCard(card);
          }
        }
      }
    }

    if (inputMode === InputMode.HAND && gesture === GestureType.OPEN && viewingCard) {
      clearViewingCard();
    }
  }, [inputMode, gesture, handPosition, history, viewHistoryCard, clearViewingCard, viewingCard]);

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 select-none pointer-events-none">
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start">
        <div className="glass-panel p-4 rounded-xl text-amber-100 pointer-events-auto">
          <h1 className="text-3xl font-bold tracking-wider mb-2">Mystic Hand</h1>
          <div className="text-sm opacity-80">
            <p>Cards Left: {deck.length}</p>
            <p className="mt-1">Mode: <span className="text-amber-400">{inputMode}</span></p>
            {inputMode === InputMode.HAND && (
              <p>Gesture: <span className={`font-mono font-bold ${
                gesture === GestureType.FIST ? 'text-red-400' : 
                gesture === GestureType.PINCH ? 'text-yellow-400' : 'text-green-400'
              }`}>{gesture}</span></p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-4 pointer-events-auto">
          <div className="flex gap-2">
            <button
              onClick={() => setInputMode(inputMode === InputMode.MOUSE ? InputMode.HAND : InputMode.MOUSE)}
              className="glass-panel px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm font-semibold text-amber-100"
            >
              {inputMode === InputMode.MOUSE ? 'Enable Camera' : 'Switch to Mouse'}
            </button>
            <button
              onClick={resetDeck}
              className="glass-panel px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm font-semibold text-red-300"
            >
              Reset
            </button>
          </div>

          <div className="flex flex-col gap-2" ref={historyRef}>
            <h3 className="text-right text-xs text-amber-100/50 uppercase tracking-widest">History</h3>
            <div className="flex flex-row-reverse gap-2 overflow-x-auto max-w-md pb-2 min-h-[5rem]">
              {history.map((draw) => (
                <div
                  key={draw.timestamp}
                  data-history-id={draw.timestamp}
                  onClick={() => {
                    if (viewingCard?.timestamp === draw.timestamp) {
                      clearViewingCard();
                    } else {
                      viewHistoryCard(draw);
                    }
                  }}
                  className={`w-12 h-20 flex-shrink-0 rounded border overflow-hidden shadow-lg relative group transition-all duration-300 cursor-pointer pointer-events-auto
                    ${viewingCard?.timestamp === draw.timestamp ? 'border-amber-400 scale-110 ring-2 ring-amber-400/50' : 'border-amber-500/30 opacity-90 hover:scale-110'}
                  `}
                >
                  <img
                    src={draw.card.image_url}
                    alt={draw.card.name}
                    className={`w-full h-full object-cover ${draw.isReversed ? 'rotate-180' : ''}`}
                    style={{ pointerEvents: 'none' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {displayCard && (
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 pointer-events-none">
          <div
            className="glass-panel p-6 rounded-2xl text-center text-amber-50 animate-in fade-in slide-in-from-bottom-10 duration-1000 backdrop-blur-xl bg-black/40 cursor-pointer pointer-events-auto"
            onClick={() => {
              if (viewingCard) clearViewingCard();
            }}
          >
            <h2 className="text-3xl font-bold mb-1 font-serif text-amber-200 drop-shadow-md">
              {displayCard.card.name}
            </h2>
            <p className="text-sm italic opacity-75 mb-4 text-amber-100/70">
              {displayCard.isReversed ? "♦ Reversed ♦" : "♦ Upright ♦"}
            </p>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mb-4" />
            <p className="text-lg leading-relaxed font-light font-sans text-shadow-sm">
              {displayCard.isReversed ? displayCard.card.meaning_rev : displayCard.card.meaning_up}
            </p>
            <div className="mt-4 text-xs uppercase tracking-widest text-white/30">
              {viewingCard
                ? (inputMode === InputMode.HAND ? "Open Hand to Close" : "Click to Close")
                : (inputMode === InputMode.HAND ? "Open Hand to Continue" : "Click Card to Continue")
              }
            </div>
          </div>
        </div>
      )}

      {inputMode === InputMode.HAND && !isCameraReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 pointer-events-auto">
          <div className="text-2xl text-amber-400 animate-pulse font-serif">Initializing Sight...</div>
        </div>
      )}

      {inputMode === InputMode.HAND && isCameraReady && deck.length > 0 && !displayCard && (
        <div className="absolute bottom-4 left-6 text-xs text-white/50 max-w-xs space-y-1 font-mono pointer-events-none">
          <p><span className="text-green-400 font-bold">OPEN</span>  : Browse / Reset</p>
          <p><span className="text-yellow-400 font-bold">PINCH</span> : Pull Card / View History</p>
          <p><span className="text-red-400 font-bold">FIST</span>  : Reveal & Lock</p>
        </div>
      )}
    </div>
  );
};

export default Interface;
