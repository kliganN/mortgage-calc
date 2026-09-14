import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Пресет льготной/базовой программы: имя и ставка. Ставки редактируются вручную. */
export interface RatePreset {
	id: string;
	name: string;
	/** Ставка, % годовых. */
	rate: number;
}

const DEFAULT_PRESETS: RatePreset[] = [
	{ id: "family", name: "Семейная", rate: 6 },
	{ id: "it", name: "IT", rate: 6 },
	{ id: "far-east", name: "Дальневосточная", rate: 2 },
	{ id: "defence", name: "Военная", rate: 6 },
	{ id: "market", name: "Рыночная", rate: 22 },
];

interface RatePresetsState {
	presets: RatePreset[];
	/** Обновить ставку пресета. */
	updateRate: (id: string, rate: number) => void;
	/** Вернуть стандартные пресеты. */
	reset: () => void;
}

/** Хранится в localStorage — пользователь может поправить ставки под свои условия. */
export const useRatePresetsStore = create<RatePresetsState>()(
	persist(
		(set) => ({
			presets: DEFAULT_PRESETS,
			updateRate: (id, rate) =>
				set((s) => ({
					presets: s.presets.map((p) => (p.id === id ? { ...p, rate } : p)),
				})),
			reset: () => set({ presets: DEFAULT_PRESETS }),
		}),
		{ name: "mortgage-calc.rate-presets" },
	),
);
