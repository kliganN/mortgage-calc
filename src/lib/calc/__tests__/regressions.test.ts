import { describe, expect, it } from "vitest";
import { toKopecks } from "../money";
import { buildSchedule, validateLoanInput } from "../mortgage";
import type { LoanInput, PaymentType } from "../types";

function input(overrides: Partial<LoanInput> = {}): LoanInput {
	return {
		propertyPrice: 1_200_000,
		downPayment: 0,
		termMonths: 12,
		annualRate: 0,
		paymentType: "annuity",
		startDate: "2026-10-01",
		earlyPayments: [],
		recurringExtra: null,
		...overrides,
	};
}

describe("регрессии досрочного погашения", () => {
	for (const paymentType of ["annuity", "differentiated"] as PaymentType[]) {
		it(`${paymentType}: уменьшение платежа сохраняет уже сокращённый срок`, () => {
			const r = buildSchedule(
				input({
					paymentType,
					earlyPayments: [
						{
							id: "term",
							monthIndex: 1,
							amount: 600_000,
							strategy: "reduceTerm",
						},
						{
							id: "payment",
							monthIndex: 2,
							amount: 10_000,
							strategy: "reducePayment",
						},
					],
				}),
			);
			expect(r.effectiveTermMonths).toBe(6);
			expect(r.rows[2].payment).toBe(9_750_000);
			expect(r.totalPaid).toBe(120_000_000);
		});

		it(`${paymentType}: пересчёт платежа не учитывает будущую досрочку`, () => {
			const r = buildSchedule(
				input({
					paymentType,
					earlyPayments: [
						{
							id: "payment",
							monthIndex: 1,
							amount: 100_000,
							strategy: "reducePayment",
						},
						{
							id: "future",
							monthIndex: 6,
							amount: 500_000,
							strategy: "reduceTerm",
						},
					],
				}),
			);
			// После месяца 1 долг 1 млн, ещё 11 плановых месяцев.
			expect(r.rows[1].principal).toBe(
				paymentType === "annuity" ? 9_090_909 : 9_090_910,
			);
		});
	}
});

describe("копеечная точность", () => {
	it("длинный аннуитет не начисляет сложный процент на ошибку округления", () => {
		const r = buildSchedule(
			input({ propertyPrice: 61_350_620, annualRate: 81.3, termMonths: 579 }),
		);
		expect(r.initialPayment).toBe(415_650_451);
		expect(r.finalPayment).toBe(6_550_712_451);
		expect(r.totalPaid).toBe(246_796_673_129);
		expect(
			r.rows.every(
				(row) => row.principal >= 0 && row.remaining <= r.loanAmount,
			),
		).toBe(true);
		expect(Number.isSafeInteger(r.totalPaid)).toBe(true);
	});

	it("округляет аннуитет большого кредита по точной десятичной ставке", () => {
		const r = buildSchedule(
			input({
				propertyPrice: 955_283_667_566.25,
				annualRate: 97,
				termMonths: 63,
			}),
		);
		expect(r.initialPayment).toBe(7_779_976_602_625);
	});

	it("сохраняет целые безопасные суммы на максимальных цене, ставке и сроке", () => {
		const i = input({
			propertyPrice: 1_000_000_000_000,
			annualRate: 100,
			termMonths: 600,
		});
		expect(validateLoanInput(i)).toEqual([]);
		const r = buildSchedule(i);
		expect(
			r.rows.every(
				(row) => row.principal >= 0 && row.remaining <= r.loanAmount,
			),
		).toBe(true);
		expect(r.totalPaid).toBe(r.loanAmount + r.totalInterest);
		expect(Number.isSafeInteger(r.totalPaid)).toBe(true);
		expect(r.rows.at(-1)?.remaining).toBe(0);
	});
	it.each([
		[1_002_660, 4.1, 342_576],
		[1_000_050, 5.8, 483_358],
	])(
		"округляет проценты на половине копейки: %s ₽, %s %%",
		(propertyPrice, annualRate, expected) => {
			const r = buildSchedule(input({ propertyPrice, annualRate }));
			expect(r.rows[0].interest).toBe(expected);
		},
	);

	it("округляет входную десятичную сумму до копейки", () => {
		expect(toKopecks(1.005)).toBe(101);
	});

	it("малая положительная ставка не создаёт бесконечный платёж", () => {
		const r = buildSchedule(input({ annualRate: 1e-14 }));
		expect(r.effectiveTermMonths).toBe(12);
		expect(r.currentPayment).toBe(10_000_000);
		expect(r.totalInterest).toBe(0);
		expect(r.rows.at(-1)?.remaining).toBe(0);
	});
});

describe("валидация границ расчёта", () => {
	it("отклоняет неизвестный тип платежа", () => {
		const invalid = input();
		Reflect.set(invalid, "paymentType", "unknown");
		expect(
			validateLoanInput(invalid).some((issue) => issue.field === "paymentType"),
		).toBe(true);
	});

	it("отклоняет неизвестные стратегии досрочки и надбавки", () => {
		const invalid = input({
			earlyPayments: [
				{ id: "e", monthIndex: 1, amount: 1_000, strategy: "reduceTerm" },
			],
			recurringExtra: {
				amount: 1_000,
				startMonthIndex: 1,
				strategy: "reduceTerm",
			},
		});
		Reflect.set(invalid.earlyPayments[0], "strategy", "unknown");
		Reflect.set(invalid.recurringExtra!, "strategy", "unknown");
		const issues = validateLoanInput(invalid);
		expect(issues.some((issue) => issue.field === "earlyPayments")).toBe(true);
		expect(issues.some((issue) => issue.field === "recurringExtra")).toBe(true);
	});
	it.each([
		{ propertyPrice: Infinity },
		{ propertyPrice: 1e14 },
		{ downPayment: NaN },
		{ downPayment: Infinity },
		{ annualRate: NaN },
		{ annualRate: Infinity },
		{ termMonths: Infinity },
	])("отклоняет небезопасные числовые параметры %j", (overrides) => {
		expect(validateLoanInput(input(overrides)).length).toBeGreaterThan(0);
	});

	it.each([Infinity, NaN, 1e14])(
		"отклоняет небезопасную сумму досрочки %s",
		(amount) => {
			expect(
				validateLoanInput(
					input({
						earlyPayments: [
							{ id: "e", monthIndex: 1, amount, strategy: "reduceTerm" },
						],
					}),
				).length,
			).toBeGreaterThan(0);
		},
	);

	it.each([0, 1.5, 13, Infinity, NaN])(
		"отклоняет месяц начала надбавки %s",
		(startMonthIndex) => {
			expect(
				validateLoanInput(
					input({
						recurringExtra: {
							amount: 1_000,
							strategy: "reduceTerm",
							startMonthIndex,
						},
					}),
				).some((issue) => issue.field === "recurringExtra"),
			).toBe(true);
		},
	);

	it.each(["2026-02-31", "2026-02-29", "0099-01-01", "9999-12-01"])(
		"отклоняет некорректный календарный диапазон %s",
		(startDate) => {
			expect(
				validateLoanInput(input({ startDate })).some(
					(issue) => issue.field === "startDate",
				),
			).toBe(true);
		},
	);

	it("принимает високосную дату и сохраняет день после короткого месяца", () => {
		const i = input({ startDate: "2028-01-31", termMonths: 3 });
		expect(validateLoanInput(i)).toEqual([]);
		expect(buildSchedule(i).rows.map((row) => row.date)).toEqual([
			"2028-01-31",
			"2028-02-29",
			"2028-03-31",
		]);
	});
});
