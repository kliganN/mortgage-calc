import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LoanInput } from "@/lib/calc";

/** Запись в истории расчётов. */
export interface HistoryEntry {
	id: string;
	/** Автоимя вида «22 % • 20 лет • 10 млн». */
	label: string;
	savedAt: string;
	input: LoanInput;
}

const MAX_ENTRIES = 30;

interface HistoryState {
	entries: HistoryEntry[];
	save: (label: string, input: LoanInput) => void;
	remove: (id: string) => void;
	clear: () => void;
}

/** История расчётов в localStorage — последние 30 сценариев. */
export const useHistoryStore = create<HistoryState>()(
	persist(
		(set) => ({
			entries: [],
			save: (label, input) =>
				set((s) => ({
					entries: [
						{
							id: crypto.randomUUID(),
							label,
							savedAt: new Date().toISOString(),
							input,
						},
						...s.entries,
					].slice(0, MAX_ENTRIES),
				})),
			remove: (id) =>
				set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
			clear: () => set({ entries: [] }),
		}),
		{ name: "mortgage-calc.history" },
	),
);
