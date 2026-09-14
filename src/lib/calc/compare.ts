import type { ScheduleResult } from "./types";

/** Результат сравнения двух сценариев. Все суммы — копейки. */
export interface ScheduleComparison {
	/** Сколько процентов экономим относительно базового сценария (≥ 0 — экономия). */
	interestSaved: number;
	/** На сколько месяцев короче срок. */
	monthsSaved: number;
	/** Разница полной выплаты (база − сценарий). */
	totalPaidDiff: number;
	/** Экономия и в месяцах, и в деньгах (удобно для сводки). */
	hasAdvantage: boolean;
}

/** Сравнивает сценарий с базовым (например, кредит без досрочных). */
export function compareSchedules(
	baseline: ScheduleResult,
	scenario: ScheduleResult,
): ScheduleComparison {
	const interestSaved = baseline.totalInterest - scenario.totalInterest;
	const monthsSaved =
		baseline.effectiveTermMonths - scenario.effectiveTermMonths;
	const totalPaidDiff = baseline.totalPaid - scenario.totalPaid;
	return {
		interestSaved,
		monthsSaved,
		totalPaidDiff,
		hasAdvantage: interestSaved > 0 || monthsSaved > 0,
	};
}
