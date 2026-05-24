"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type SelectionContextValue = {
  selectionMode: boolean;
  selectedIds: Set<string>;
  count: number;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  enter: () => void;
  exit: () => void;
};

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function useJournalSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useJournalSelection must be used within JournalSelectionProvider");
  return ctx;
}

export function JournalSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const enter = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(true);
  }, []);

  const exit = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const value = useMemo<SelectionContextValue>(
    () => ({
      selectionMode,
      selectedIds,
      count: selectedIds.size,
      isSelected: (id) => selectedIds.has(id),
      toggle,
      enter,
      exit,
    }),
    [selectionMode, selectedIds, toggle, enter, exit]
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}
