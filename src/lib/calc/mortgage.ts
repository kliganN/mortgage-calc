import { addMonthsISO, isValidPaymentDate } from "./dates";
import {
	annuityPaymentCalculator,
	MAX_MONEY_RUBLES,
	monthlyInterestCalculator,
	toKopecks,
} from "./money";
import type {
	EarlyPayment,
	LoanInput,
	LoanIssue,
	PaymentType,
	ScheduleResult,
	ScheduleRow,
} from "./types";
import { MAX_EARLY_PAYMENT_ID_LENGTH, MAX_EARLY_PAYMENTS } from "./types";

/**
 * Аннуитетный платёж.
 *
 * Формула: P = S · i · (1+i)^n / ((1+i)^n − 1),
 * где S — остаток долга (копейки), i = годовая ставка/12/100, n — оставшееся
 * число месяцев. Это стандартная формула аннуитета, применяемая банками РФ
 * Источник: https://www.vtb.ru/articles/kak-rasschityvaetsya-ipoteka/
 * Результат округляется до копейки, как в банковских графиках.
 */
export function annuityPaymentKopecks(
	balanceKop: number,
	monthlyRate: number,
	months: number,
): number {
	return annuityPaymentCalculator(monthlyRate, 1)(balanceKop, months);
}

function isSafeMoney(value: number): boolean {
	return (
		Number.isFinite(value) &&
		value >= 0 &&
		value <= MAX_MONEY_RUBLES &&
		Number.isSafeInteger(toKopecks(value))
	);
}

function isStrategy(value: string): boolean {
	return value === "reduceTerm" || value === "reducePayment";
}

/** Валидация параметров. Возвращает список замечаний; пустой список — всё корректно. */
export function validateLoanInput(input: LoanInput): LoanIssue[] {
	const issues: LoanIssue[] = [];
	if (!isSafeMoney(input.propertyPrice) || !(input.propertyPrice > 0)) {
		issues.push({
			field: "propertyPrice",
			message: "Стоимость жилья должна быть больше нуля и не больше 1 трлн ₽",
		});
	}
	if (!isSafeMoney(input.downPayment)) {
		issues.push({
			field: "downPayment",
			message: "Взнос — конечная сумма от 0 до 1 трлн ₽",
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
	if (
		!Number.isFinite(input.annualRate) ||
		input.annualRate < 0 ||
		input.annualRate > 100
	) {
		issues.push({
			field: "annualRate",
			message: "Ставка — от 0 до 100 % годовых",
		});
	}
	if (!isValidPaymentDate(input.startDate, input.termMonths)) {
		issues.push({
			field: "startDate",
			message:
				"Укажите корректную дату: весь график должен быть в годах 0100–9999",
		});
	}
	if (
		input.paymentType !== "annuity" &&
		input.paymentType !== "differentiated"
	) {
		issues.push({ field: "paymentType", message: "Неизвестный тип платежа" });
	}
	if (input.earlyPayments.length > MAX_EARLY_PAYMENTS) {
		issues.push({
			field: "earlyPayments",
			message: `Не больше ${MAX_EARLY_PAYMENTS} разовых досрочных платежей`,
		});
		return issues;
	}
	for (const p of input.earlyPayments) {
		if (!p.id || p.id.length > MAX_EARLY_PAYMENT_ID_LENGTH) {
			issues.push({
				field: "earlyPayments",
				message: "Некорректный идентификатор досрочного платежа",
			});
		}
		if (!isSafeMoney(p.amount) || !(p.amount > 0)) {
			issues.push({
				field: "earlyPayments",
				message:
					"Досрочный платёж — конечная сумма от 0 до 1 трлн ₽, больше нуля",
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
		if (!isStrategy(p.strategy)) {
			issues.push({
				field: "earlyPayments",
				message: "Неизвестная стратегия досрочного погашения",
			});
		}
	}
	if (input.recurringExtra) {
		const recurring = input.recurringExtra;
		if (!isSafeMoney(recurring.amount) || !(recurring.amount > 0)) {
			issues.push({
				field: "recurringExtra",
				message: "Надбавка — конечная сумма от 0 до 1 трлн ₽, больше нуля",
			});
		}
		if (
			!Number.isInteger(recurring.startMonthIndex) ||
			recurring.startMonthIndex < 1 ||
			recurring.startMonthIndex > input.termMonths
		) {
			issues.push({
				field: "recurringExtra",
				message: "Месяц начала надбавки вне срока кредита",
			});
		}
		if (!isStrategy(recurring.strategy)) {
			issues.push({
				field: "recurringExtra",
				message: "Неизвестная стратегия досрочного погашения",
			});
		}
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

	const interestFor = monthlyInterestCalculator(input.annualRate);
	const annuityFor = annuityPaymentCalculator(input.annualRate);
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
		annuity = annuityFor(loanKop, input.termMonths);
	} else {
		diffPrincipal = Math.ceil(loanKop / input.termMonths);
	}

	const rows: ScheduleRow[] = [];
	let balance = loanKop;
	let totalInterest = 0;
	let totalExtra = 0;
	let plannedEndMonth = input.termMonths;
	// Актуальный плановый уровень платежа (без «добора» последнего месяца):
	// то, что платёжщик считает своим ежемесячным платежом.
	let levelPayment =
		paymentType === "annuity"
			? annuity
			: Math.min(diffPrincipal, loanKop) + interestFor(loanKop);

	for (let m = 1; m <= plannedEndMonth && balance > 0; m++) {
		const interest = interestFor(balance);
		// В последний месяц графика платёж добирает остаток долга целиком:
		// округление аннуитета до копейки иначе оставляет хвост в несколько копеек.
		const isFinalMonth = m === plannedEndMonth;

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
		const extras = [...(oneOffs.get(m) ?? [])];
		if (recurring && m >= recurringStart) {
			extras.push({ ...recurring, id: "recurring", monthIndex: m });
		}
		for (const early of extras) {
			const paid = Math.min(toKopecks(early.amount), balance);
			if (paid <= 0) continue;
			extra += paid;
			balance -= paid;
			if (balance <= 0) continue;
			const remainingMonths = plannedEndMonth - m;
			if (early.strategy === "reducePayment" && remainingMonths > 0) {
				if (paymentType === "annuity") {
					annuity = annuityFor(balance, remainingMonths);
				} else {
					diffPrincipal = Math.ceil(balance / remainingMonths);
				}
				levelPayment =
					paymentType === "annuity"
						? annuity
						: Math.min(diffPrincipal, balance) + interestFor(balance);
			} else if (early.strategy === "reduceTerm") {
				// Моделируем только плановые платежи: будущие досрочки ещё не внесены.
				// Текущую дату окончания сохраняем для последующих reducePayment.
				let projectedBalance = balance;
				for (let n = 1; n <= remainingMonths; n++) {
					const projectedPrincipal =
						paymentType === "annuity"
							? Math.max(0, annuity - interestFor(projectedBalance))
							: diffPrincipal;
					projectedBalance -= Math.min(projectedBalance, projectedPrincipal);
					if (projectedBalance <= 0) {
						plannedEndMonth = m + n;
						break;
					}
				}
			}
		}
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
