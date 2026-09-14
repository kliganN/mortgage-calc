import { create } from "zustand";
import type { LoanInput } from "@/lib/calc";

/** Сценарий в сравнении: снимок параметров кредита. */
export interface CompareScenario {
	id: string;
	label: string;
	input: LoanInput;
}

const MAX_SCENARIOS = 3;

interface CompareState {
	/** Текущий (живой) сценарий в первом слоте, добавленные — далее. */
	scenarios: CompareScenario[];
	add: (label: string, input: LoanInput) => void;
	remove: (id: string) => void;
	clear: () => void;
}

/** Сравнение в пределах сессии; для постоянного хранения есть история. */
export const useCompareStore = create<CompareState>()((set) => ({
	scenarios: [],
	add: (label, input) =>
		set((s) =>
			s.scenarios.length >= MAX_SCENARIOS
				? s
				: {
						scenarios: [
							...s.scenarios,
							{ id: crypto.randomUUID(), label, input },
						],
					},
		),
	remove: (id) =>
		set((s) => ({ scenarios: s.scenarios.filter((x) => x.id !== id) })),
	clear: () => set({ scenarios: [] }),
}));
