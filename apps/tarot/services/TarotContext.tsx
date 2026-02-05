import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TarotCardData, DrawResult } from '../types';
import { MAJOR_ARCANA } from '../constants';

interface TarotContextType {
  deck: TarotCardData[];
  history: DrawResult[];
  currentCard: DrawResult | null;
  viewingCard: DrawResult | null;
  drawCard: () => DrawResult | null;
  confirmCard: () => void;
  resetDeck: () => void;
  viewHistoryCard: (card: DrawResult) => void;
  clearViewingCard: () => void;
}

const TarotContext = createContext<TarotContextType | undefined>(undefined);

export const TarotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [deck, setDeck] = useState<TarotCardData[]>([...MAJOR_ARCANA]);
  const [history, setHistory] = useState<DrawResult[]>([]);
  const [currentCard, setCurrentCard] = useState<DrawResult | null>(null);
  const [viewingCard, setViewingCard] = useState<DrawResult | null>(null);

  const drawCard = () => {
    if (deck.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * deck.length);
    const card = deck[randomIndex];
    const isReversed = Math.random() < 0.5;

    const result: DrawResult = {
      card,
      isReversed,
      timestamp: Date.now(),
    };

    setCurrentCard(result);
    setViewingCard(null);
    return result;
  };

  const confirmCard = () => {
    if (!currentCard) return;

    setHistory(prev => [currentCard, ...prev]);
    setDeck(prev => prev.filter(c => c.id !== currentCard.card.id));
    setCurrentCard(null);
  };

  const resetDeck = () => {
    setDeck([...MAJOR_ARCANA]);
    setHistory([]);
    setCurrentCard(null);
    setViewingCard(null);
  };

  const viewHistoryCard = (card: DrawResult) => {
    setViewingCard(card);
    setCurrentCard(null);
  };

  const clearViewingCard = () => {
    setViewingCard(null);
  };

  return (
    <TarotContext.Provider value={{
      deck,
      history,
      currentCard,
      viewingCard,
      drawCard,
      confirmCard,
      resetDeck,
      viewHistoryCard,
      clearViewingCard
    }}>
      {children}
    </TarotContext.Provider>
  );
};

export const useTarot = () => {
  const context = useContext(TarotContext);
  if (!context) {
    throw new Error('useTarot must be used within a TarotProvider');
  }
  return context;
};
