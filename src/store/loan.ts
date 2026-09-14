import { create } from "zustand";
import type { EarlyPayment, LoanInput, RecurringExtra } from "@/lib/calc";

/** Параметры по умолчанию — типовая российская ипотека (всё редактируется в форме). */
export const DEFAULT_LOAN: LoanInput = {
	propertyPrice: 12_000_000,
	downPayment: 2_000_000,
	termMonths: 240,
	annualRate: 22,
	paymentType: "annuity",
	startDate: "2026-10-01",
	earlyPayments: [],
	recurringExtra: null,
};

interface LoanState {
	input: LoanInput;
	/** Частичное обновление простых полей формы. */
	patch: (patch: Partial<LoanInput>) => void;
	setEarlyPayments: (list: EarlyPayment[]) => void;
	setRecurringExtra: (extra: RecurringExtra | null) => void;
	reset: () => void;
}

export const useLoanStore = create<LoanState>()((set) => ({
	input: DEFAULT_LOAN,
	patch: (patch) => set((s) => ({ input: { ...s.input, ...patch } })),
	setEarlyPayments: (list) =>
		set((s) => ({ input: { ...s.input, earlyPayments: list } })),
	setRecurringExtra: (extra) =>
		set((s) => ({ input: { ...s.input, recurringExtra: extra } })),
	reset: () => set({ input: DEFAULT_LOAN }),
}));
