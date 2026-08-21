import { useState } from 'react';

/**
 * Mantém o índice da aba ativa de um TabView salvo no sessionStorage,
 * para que um reload (F5) da página continue na mesma aba em vez de
 * voltar sempre para a primeira.
 *
 * @param storageKey chave única por tela (ex: 'tab-index-agenda')
 */
export function usePersistedTabIndex(storageKey: string) {
  const [activeIndex, setActiveIndexState] = useState<number>(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      const parsed = stored !== null ? Number(stored) : 0;
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    } catch {
      return 0;
    }
  });

  const setActiveIndex = (index: number) => {
    setActiveIndexState(index);
    try {
      sessionStorage.setItem(storageKey, String(index));
    } catch {
      // sessionStorage indisponível (ex: modo privado) — ignora
    }
  };

  return { activeIndex, setActiveIndex };
}
