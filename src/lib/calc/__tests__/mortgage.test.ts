import { describe, expect, it } from "vitest";
import { compareSchedules } from "../compare";
import { addMonthsISO } from "../dates";
import { toKopecks, toRubles } from "../money";
import { buildSchedule, validateLoanInput } from "../mortgage";
import type { LoanInput } from "../types";

/** Базовый сценарий: 12 млн, взнос 2 млн (кредит 10 млн), 20 лет, 16 % годовых, аннуитет. */
function baseInput(overrides: Partial<LoanInput> = {}): LoanInput {
	return {
		propertyPrice: 12_000_000,
		downPayment: 2_000_000,
		termMonths: 240,
		annualRate: 16,
		paymentType: "annuity",
		startDate: "2026-10-01",
		earlyPayments: [],
		recurringExtra: null,
		...overrides,
	};
}

/** Тело погашено ровно на сумму кредита: сумма(principal) + сумма(extra) = кредит, до копейки. */
function expectPrincipalInvariant(r: ReturnType<typeof buildSchedule>) {
	const paidPrincipal = r.rows.reduce(
		(s, row) => s + row.principal + row.extraPaid,
		0,
	);
	expect(paidPrincipal).toBe(r.loanAmount);
}

/** Остаток долга никогда не отрицательный и не растёт. */
function expectRemainingInvariant(r: ReturnType<typeof buildSchedule>) {
	let prev = Number.POSITIVE_INFINITY;
	for (const row of r.rows) {
		expect(row.remaining).toBeGreaterThanOrEqual(0);
		expect(row.remaining).toBeLessThanOrEqual(prev);
		prev = row.remaining;
	}
	expect(r.rows[r.rows.length - 1]?.remaining).toBe(0);
}

describe("аннуитет", () => {
	it("совпадает с эталонным банковским расчётом (1 млн, 12 мес., 10 %)", () => {
		const r = buildSchedule(
			baseInput({
				propertyPrice: 1_000_000,
				downPayment: 0,
				termMonths: 12,
				annualRate: 10,
			}),
		);
		// Эталон: платёж 87 915,89 ₽, переплата 54 990,68 ₽ (округление в графиках банков даёт ±1–2 коп.).
		expect(toRubles(r.initialPayment)).toBeCloseTo(87915.89, 1);
		expect(toRubles(r.totalInterest)).toBeCloseTo(54990.68, 1);
		expect(r.effectiveTermMonths).toBe(12);
		expectPrincipalInvariant(r);
		expectRemainingInvariant(r);
	});

	it("при ставке 0 % платёж = кредит / срок, процентов нет", () => {
		const r = buildSchedule(baseInput({ annualRate: 0, termMonths: 24 }));
		// Кредит 10 млн на 24 мес. → 416 666,67 ₽.
		expect(toRubles(r.initialPayment)).toBeCloseTo(416666.67, 1);
		expect(r.totalInterest).toBe(0);
		expect(r.effectiveTermMonths).toBe(24);
		expectPrincipalInvariant(r);
	});

	it("последний платёж добирает остаток без переплаты по телу", () => {
		const r = buildSchedule(baseInput());
		const last = r.rows[r.rows.length - 1];
		expect(last?.remaining).toBe(0);
		// Последний платёж отличается от планового уровня лишь на хвост округления.
		expect(last!.payment).toBeGreaterThan(0);
		expect(last!.payment - r.currentPayment).toBeLessThan(toKopecks(100)); // < 1 ₽
		expectPrincipalInvariant(r);
	});
});

describe("дифференцированные платежи", () => {
	it("первый платёж = тело/срок + проценты на полный долг", () => {
		// 1,2 млн, 12 мес., 10 %: тело 100 000, проценты первого месяца 10 000 → 110 000 ₽.
		const r = buildSchedule(
			baseInput({
				propertyPrice: 1_200_000,
				downPayment: 0,
				termMonths: 12,
				annualRate: 10,
				paymentType: "differentiated",
			}),
		);
		expect(toRubles(r.initialPayment)).toBeCloseTo(110000, 1);
		// Замкнутая формула переплаты: кредит · i · (n+1)/2 = 65 000 ₽ ровно.
		expect(toRubles(r.totalInterest)).toBeCloseTo(65000, 0);
		expect(r.effectiveTermMonths).toBe(12);
		expectPrincipalInvariant(r);
	});

	it("платежи монотонно убывают", () => {
		const r = buildSchedule(baseInput({ paymentType: "differentiated" }));
		for (let i = 1; i < r.rows.length; i++) {
			expect(r.rows[i]!.payment).toBeLessThan(r.rows[i - 1]!.payment);
		}
	});
});

describe("разовые досрочные платежи", () => {
	it("reduceTerm сокращает срок и переплату", () => {
		const baseline = buildSchedule(baseInput());
		const withEarly = buildSchedule(
			baseInput({
				earlyPayments: [
					{ id: "e1", monthIndex: 12, amount: 500_000, strategy: "reduceTerm" },
				],
			}),
		);
		expect(withEarly.effectiveTermMonths).toBeLessThan(
			baseline.effectiveTermMonths,
		);
		expect(withEarly.totalInterest).toBeLessThan(baseline.totalInterest);
		expectPrincipalInvariant(withEarly);
		expectRemainingInvariant(withEarly);
	});

	it("reducePayment сохраняет срок и снижает платёж", () => {
		const baseline = buildSchedule(baseInput());
		const withEarly = buildSchedule(
			baseInput({
				earlyPayments: [
					{
						id: "e1",
						monthIndex: 12,
						amount: 500_000,
						strategy: "reducePayment",
					},
				],
			}),
		);
		expect(withEarly.effectiveTermMonths).toBe(baseline.effectiveTermMonths);
		const rowAfter = withEarly.rows[12]!; // первый месяц после досрочки
		expect(rowAfter.payment).toBeLessThan(baseline.rows[12]!.payment);
		expect(withEarly.totalInterest).toBeLessThan(baseline.totalInterest);
		expectPrincipalInvariant(withEarly);
		expectRemainingInvariant(withEarly);
	});

	it("досрочка больше остатка долга гасит кредит в этот месяц", () => {
		const r = buildSchedule(
			baseInput({
				earlyPayments: [
					{
						id: "e1",
						monthIndex: 3,
						amount: 100_000_000,
						strategy: "reduceTerm",
					},
				],
			}),
		);
		expect(r.effectiveTermMonths).toBe(3);
		expect(r.rows[2]!.extraPaid).toBeLessThanOrEqual(
			r.rows[2]!.remaining + r.rows[2]!.extraPaid,
		);
		expectPrincipalInvariant(r);
		expectRemainingInvariant(r);
	});
});

describe("регулярная надбавка", () => {
	it("ежемесячная надбавка с reduceTerm заметно сокращает срок", () => {
		const baseline = buildSchedule(baseInput());
		const r = buildSchedule(
			baseInput({
				recurringExtra: {
					amount: 10_000,
					strategy: "reduceTerm",
					startMonthIndex: 1,
				},
			}),
		);
		expect(r.effectiveTermMonths).toBeLessThan(baseline.effectiveTermMonths);
		expect(r.totalInterest).toBeLessThan(baseline.totalInterest);
		expectPrincipalInvariant(r);
		expectRemainingInvariant(r);
	});

	it("startMonthIndex откладывает начало надбавки", () => {
		const r = buildSchedule(
			baseInput({
				recurringExtra: {
					amount: 10_000,
					strategy: "reduceTerm",
					startMonthIndex: 24,
				},
			}),
		);
		// rows[i] — месяц i+1: в месяцах 1–23 надбавки нет, с месяца 24 — есть.
		expect(r.rows[0]!.extraPaid).toBe(0);
		expect(r.rows[22]!.extraPaid).toBe(0);
		expect(r.rows[23]!.extraPaid).toBe(toKopecks(10_000));
		// Тело за месяц 24 погашается больше, чем плановым платежом в месяце 1.
		expect(r.rows[23]!.principal + r.rows[23]!.extraPaid).toBeGreaterThan(
			r.rows[0]!.principal,
		);
	});
});

describe("крайние случаи", () => {
	it("кредита нет (взнос = стоимости) — пустой график без ошибок", () => {
		const r = buildSchedule(baseInput({ downPayment: 12_000_000 }));
		expect(r.rows).toHaveLength(0);
		expect(r.totalPaid).toBe(0);
		expect(r.loanAmount).toBe(0);
	});

	it("досрочка в последний месяц", () => {
		const r = buildSchedule(
			baseInput({
				earlyPayments: [
					{
						id: "e1",
						monthIndex: 240,
						amount: 100_000,
						strategy: "reduceTerm",
					},
				],
			}),
		);
		expect(r.effectiveTermMonths).toBeLessThanOrEqual(240);
		expectPrincipalInvariant(r);
		expectRemainingInvariant(r);
	});

	it("досрочка в первый месяц", () => {
		const r = buildSchedule(
			baseInput({
				earlyPayments: [
					{
						id: "e1",
						monthIndex: 1,
						amount: 250_000,
						strategy: "reducePayment",
					},
				],
			}),
		);
		expect(r.rows[0]!.extraPaid).toBe(toKopecks(250_000));
		expect(r.effectiveTermMonths).toBe(240);
		expectPrincipalInvariant(r);
	});
});

describe("даты", () => {
	it("первая строка — на дату старта, далее по месяцам", () => {
		const r = buildSchedule(baseInput({ startDate: "2026-10-01" }));
		expect(r.rows[0]!.date).toBe("2026-10-01");
		expect(r.rows[1]!.date).toBe("2026-11-01");
	});

	it("день прижимается к концу короткого месяца", () => {
		expect(addMonthsISO("2026-01-31", 1)).toBe("2026-02-28");
		expect(addMonthsISO("2028-01-31", 1)).toBe("2028-02-29"); // 2028 — високосный
	});
});

describe("инварианты на случайных входных данных (детерминированный ГПСЧ)", () => {
	// Простой LCG, чтобы прогон был воспроизводимым.
	function lcg(seed: number) {
		let s = seed;
		return () => {
			s = (s * 1_664_525 + 1_013_904_223) % 4_294_967_296;
			return s / 4_294_967_296;
		};
	}

	it("30 случайных сценариев: тело сходится, остаток корректен, срок в пределах", () => {
		const rnd = lcg(42);
		for (let i = 0; i < 30; i++) {
			const price = Math.round(1 + rnd() * 30) * 1_000_000;
			const input = baseInput({
				propertyPrice: price,
				downPayment: Math.round(rnd() * price * 0.8),
				termMonths: Math.max(1, Math.round(12 + rnd() * 348)),
				annualRate: Math.round(rnd() * 250) / 10,
				paymentType: rnd() > 0.5 ? "annuity" : "differentiated",
				earlyPayments: Array.from(
					{ length: Math.floor(rnd() * 4) },
					(_, k) => ({
						id: `e${k}`,
						monthIndex: Math.max(1, Math.round(1 + rnd() * 300)),
						amount: Math.round(rnd() * 300) * 10_000,
						strategy: rnd() > 0.5 ? "reduceTerm" : "reducePayment",
					}),
				),
				recurringExtra:
					rnd() > 0.5
						? {
								amount: Math.round(rnd() * 50) * 1_000,
								strategy: "reduceTerm" as const,
								startMonthIndex: 1,
							}
						: null,
			});
			if (validateLoanInput(input).length > 0) continue;
			const r = buildSchedule(input);
			expect(r.effectiveTermMonths).toBeLessThanOrEqual(input.termMonths);
			expectPrincipalInvariant(r);
			expectRemainingInvariant(r);
		}
	});
});

describe("сравнение сценариев", () => {
	it("экономия от досрочек = разница переплат и сроков", () => {
		const baseline = buildSchedule(baseInput());
		const scenario = buildSchedule(
			baseInput({
				recurringExtra: {
					amount: 15_000,
					strategy: "reduceTerm",
					startMonthIndex: 1,
				},
			}),
		);
		const cmp = compareSchedules(baseline, scenario);
		expect(cmp.interestSaved).toBe(
			baseline.totalInterest - scenario.totalInterest,
		);
		expect(cmp.monthsSaved).toBe(
			baseline.effectiveTermMonths - scenario.effectiveTermMonths,
		);
		expect(cmp.hasAdvantage).toBe(true);
		expect(cmp.interestSaved).toBeGreaterThan(0);
	});
});

describe("валидация", () => {
	it("корректный ввод — без замечаний", () => {
		expect(validateLoanInput(baseInput())).toHaveLength(0);
	});

	it("отрицательный взнос, ставка > 100 %, досрочка вне срока — замечания", () => {
		const issues = validateLoanInput(
			baseInput({
				downPayment: -5,
				annualRate: 120,
				earlyPayments: [
					{ id: "e1", monthIndex: 999, amount: 1000, strategy: "reduceTerm" },
				],
			}),
		);
		const fields = issues.map((i) => i.field);
		expect(fields).toContain("downPayment");
		expect(fields).toContain("annualRate");
		expect(fields).toContain("earlyPayments");
	});
});
