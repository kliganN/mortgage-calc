import { buildSchedule } from "@/lib/calc";
import { DEFAULT_LOAN } from "@/store/loan";

/** Фиксированный пример не читает и не меняет личный расчёт посетителя. */
export const LANDING_LOAN = { ...DEFAULT_LOAN };
export const LANDING_SCHEDULE = buildSchedule(LANDING_LOAN);
export const LANDING_EXTRA_LOAN = {
	...LANDING_LOAN,
	recurringExtra: {
		amount: 20_000,
		strategy: "reduceTerm" as const,
		startMonthIndex: 1,
	},
};
export const LANDING_EXTRA_SCHEDULE = buildSchedule(LANDING_EXTRA_LOAN);
