import type { LoanInput } from "@/lib/calc";
import { formatTerm } from "@/lib/format";

/** Автоимя сценария: «22 % • 20 лет • 10 млн». */
export function scenarioLabel(input: LoanInput): string {
	const млн = new Intl.NumberFormat("ru-RU", {
		maximumFractionDigits: 1,
	}).format(Math.max(0, input.propertyPrice - input.downPayment) / 1_000_000);
	const ставка = new Intl.NumberFormat("ru-RU", {
		maximumFractionDigits: 2,
	}).format(input.annualRate);
	return `${ставка} % • ${formatTerm(input.termMonths)} • ${млн} млн`;
}
