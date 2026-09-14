import { addMonthsISO } from "./dates";
import { toKopecks } from "./money";
import type {
	EarlyPayment,
	LoanInput,
	LoanIssue,
	PaymentType,
	ScheduleResult,
	ScheduleRow,
} from "./types";

/**
 * Аннуитетный платёж.
 *
 * Формула: P = S · i · (1+i)^n / ((1+i)^n − 1),
 * где S — остаток долга (копейки), i = годовая ставка/12/100, n — оставшееся
 * число месяцев. Это стандартная формула аннуитета, применяемая банками РФ
 * (см. Википедия «Аннуитет», а также порядок расчёта в практике банков).
 * Результат округляется до копейки, как в банковских графиках.
 */
export function annuityPaymentKopecks(
	balanceKop: number,
	monthlyRate: number,
	months: number,
): number {
	if (months <= 0) return balanceKop;
	if (monthlyRate === 0) return Math.round(balanceKop / months);
	const factor = (1 + monthlyRate) ** months;
	return Math.round((balanceKop * monthlyRate * factor) / (factor - 1));
}

/** Валидация параметров. Возвращает список замечаний; пустой список — всё корректно. */
export function validateLoanInput(input: LoanInput): LoanIssue[] {
	const issues: LoanIssue[] = [];
	if (!(input.propertyPrice > 0)) {
		issues.push({
			field: "propertyPrice",
			message: "Стоимость жилья должна быть больше нуля",
		});
	}
	if (input.downPayment < 0) {
		issues.push({
			field: "downPayment",
			message: "Первоначальный взнос не может быть отрицательным",
		});
	}
	if (input.downPayment > input.propertyPrice) {
		issues.push({
			field: "downPayment",
			message: "Взнос не может превышать стоимость жилья",
		});
	}
	if (
		!Number.isInteger(input.termMonths) ||
		input.termMonths < 1 ||
		input.termMonths > 600
	) {
		issues.push({
			field: "termMonths",
			message: "Срок — целое число месяцев от 1 до 600",
		});
	}
	if (!(input.annualRate >= 0) || input.annualRate > 100) {
		issues.push({
			field: "annualRate",
			message: "Ставка — от 0 до 100 % годовых",
		});
	}
	if (
		!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate) ||
		Number.isNaN(Date.parse(input.startDate))
	) {
		issues.push({
			field: "startDate",
			message: "Укажите корректную дату первого платежа",
		});
	}
	for (const p of input.earlyPayments) {
		if (!(p.amount > 0)) {
			issues.push({
				field: "earlyPayments",
				message: "Сумма досрочного платежа должна быть больше нуля",
			});
		}
		if (
			!Number.isInteger(p.monthIndex) ||
			p.monthIndex < 1 ||
			p.monthIndex > input.termMonths
		) {
			issues.push({
				field: "earlyPayments",
				message: "Месяц досрочного платежа вне срока кредита",
			});
		}
	}
	if (input.recurringExtra && !(input.recurringExtra.amount > 0)) {
		issues.push({
			field: "recurringExtra",
			message: "Сумма регулярной надбавки должна быть больше нуля",
		});
	}
	return issues;
}

function emptyResult(loanKop: number): ScheduleResult {
	return {
		rows: [],
		loanAmount: loanKop,
		totalPaid: 0,
		totalInterest: 0,
		totalExtraPaid: 0,
		effectiveTermMonths: 0,
		initialPayment: 0,
		finalPayment: 0,
		currentPayment: 0,
	};
}

/** Сгруппированные разовые досрочки: месяц → список платежей. */
function groupOneOffs(
	earlyPayments: EarlyPayment[],
): Map<number, EarlyPayment[]> {
	const byMonth = new Map<number, EarlyPayment[]>();
	for (const p of [...earlyPayments].sort(
		(a, b) => a.monthIndex - b.monthIndex,
	)) {
		const list = byMonth.get(p.monthIndex);
		if (list) list.push(p);
		else byMonth.set(p.monthIndex, [p]);
	}
	return byMonth;
}

/**
 * Строит график платежей по всем правилам из PLAN.md:
 * - суммы — целые копейки, округление каждого платежа до копейки;
 * - последний платёж корректируется добором остатка;
 * - досрочные платежи не больше остатка долга;
 * - стратегия reduceTerm не меняет плановый платёж (срок сокращается сама),
 *   reducePayment пересчитывает платёж на оставшийся срок.
 */
export function buildSchedule(input: LoanInput): ScheduleResult {
	const loanKop = toKopecks(input.propertyPrice) - toKopecks(input.downPayment);
	if (loanKop <= 0 || input.termMonths < 1)
		return emptyResult(Math.max(0, loanKop));

	const monthlyRate = input.annualRate / 100 / 12;
	const paymentType: PaymentType = input.paymentType;
	const oneOffs = groupOneOffs(input.earlyPayments);
	const recurring = input.recurringExtra;
	const recurringStart = recurring
		? Math.max(1, recurring.startMonthIndex || 1)
		: 1;

	// Плановая составляющая: для аннуитета — платёж, для дифференцированных — тело.
	// Дифференцированные: тело месяца = кредит/срок, с округлением вверх,
	// чтобы срок не «затягивался» из-за округления (последний месяц добирает остаток).
	let annuity = 0;
	let diffPrincipal = 0;
	if (paymentType === "annuity") {
		annuity = annuityPaymentKopecks(loanKop, monthlyRate, input.termMonths);
	} else {
		diffPrincipal = Math.ceil(loanKop / input.termMonths);
	}

	const rows: ScheduleRow[] = [];
	let balance = loanKop;
	let totalInterest = 0;
	let totalExtra = 0;
	// Актуальный плановый уровень платежа (без «добора» последнего месяца):
	// то, что платёжщик считает своим ежемесячным платежом.
	let levelPayment =
		paymentType === "annuity"
			? annuity
			: Math.min(diffPrincipal, loanKop) + Math.round(loanKop * monthlyRate);

	for (let m = 1; m <= input.termMonths && balance > 0; m++) {
		const interest = Math.round(balance * monthlyRate);
		// В последний месяц графика платёж добирает остаток долга целиком:
		// округление аннуитета до копейки иначе оставляет хвост в несколько копеек.
		const isFinalMonth = m === input.termMonths;

		// 1. Плановый платёж месяца.
		let payment: number;
		let principal: number;
		if (paymentType === "annuity") {
			payment = isFinalMonth
				? balance + interest
				: Math.min(annuity, balance + interest); // досрочное полное погашение — добором
			principal = payment - interest;
		} else {
			principal = isFinalMonth ? balance : Math.min(diffPrincipal, balance);
			payment = principal + interest;
		}
		balance -= principal;

		// 2. Досрочные платежи месяца (после планового), с капом по остатку.
		let extra = 0;
		for (const p of oneOffs.get(m) ?? []) {
			extra += Math.min(toKopecks(p.amount), balance - extra);
		}
		if (recurring && m >= recurringStart) {
			extra += Math.min(toKopecks(recurring.amount), balance - extra);
		}
		extra = Math.max(0, extra);
		balance -= extra;
		totalExtra += extra;
		totalInterest += interest;

		rows.push({
			monthIndex: m,
			date: addMonthsISO(input.startDate, m - 1),
			payment,
			interest,
			principal,
			extraPaid: extra,
			remaining: balance,
		});

		// 3. Пересчёт плановой составляющей после досрочек со стратегией reducePayment.
		const hasReducePayment = (oneOffs.get(m) ?? []).some(
			(p) => p.strategy === "reducePayment",
		);
		const recurringReducePayment =
			recurring &&
			m >= recurringStart &&
			recurring.strategy === "reducePayment";
		if (balance > 0 && (hasReducePayment || recurringReducePayment)) {
			const remainingMonths = input.termMonths - m;
			if (remainingMonths > 0) {
				if (paymentType === "annuity") {
					annuity = annuityPaymentKopecks(
						balance,
						monthlyRate,
						remainingMonths,
					);
				} else {
					diffPrincipal = Math.ceil(balance / remainingMonths);
				}
				levelPayment =
					paymentType === "annuity"
						? annuity
						: Math.min(diffPrincipal, balance) +
							Math.round(balance * monthlyRate);
			}
		}
	}

	const first = rows[0];
	const last = rows[rows.length - 1];

	return {
		rows,
		loanAmount: loanKop,
		totalPaid: rows.reduce((s, r) => s + r.payment + r.extraPaid, 0),
		totalInterest,
		totalExtraPaid: totalExtra,
		effectiveTermMonths: rows.length,
		initialPayment: first?.payment ?? 0,
		finalPayment: last?.payment ?? 0,
		// Актуальный плановый уровень платежа (для аннуитета с reducePayment — сниженный).
		currentPayment: rows.length > 0 ? levelPayment : 0,
	};
}
