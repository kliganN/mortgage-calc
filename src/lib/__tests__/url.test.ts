import { compressToEncodedURIComponent } from "lz-string";
import { describe, expect, it } from "vitest";
import { buildSchedule } from "@/lib/calc";
import { decodeLoanInput, encodeLoanInput } from "@/lib/url";
import { DEFAULT_LOAN } from "@/store/loan";

function encoded(payload: unknown): string {
	return compressToEncodedURIComponent(JSON.stringify(payload));
}

describe("ссылки расчёта", () => {
	it("сохраняет параметры и досрочки при обмене ссылкой", () => {
		const input = {
			...DEFAULT_LOAN,
			earlyPayments: [
				{
					id: "e1",
					monthIndex: 12,
					amount: 50_000,
					strategy: "reduceTerm" as const,
				},
			],
			recurringExtra: {
				amount: 1000,
				startMonthIndex: 2,
				strategy: "reducePayment" as const,
			},
		};
		const restored = decodeLoanInput(encodeLoanInput(input));
		expect(restored).toEqual(input);
		expect(buildSchedule(restored!).loanAmount).toBe(1_000_000_000);
	});

	it("читает старые ссылки без версии и дополняет отсутствующие поля", () => {
		expect(
			decodeLoanInput(
				encoded({ propertyPrice: 12_000_000, termMonths: 240, annualRate: 22 }),
			),
		).toEqual(DEFAULT_LOAN);
	});

	it("дополняет старые досрочки идентификатором и началом регулярной надбавки", () => {
		const restored = decodeLoanInput(
			encoded({
				...DEFAULT_LOAN,
				earlyPayments: [
					{ monthIndex: 1, amount: 1000, strategy: "reduceTerm" },
				],
				recurringExtra: { amount: 1000, strategy: "reducePayment" },
			}),
		);
		expect(restored?.earlyPayments[0]?.id).toEqual(expect.any(String));
		expect(restored?.recurringExtra?.startMonthIndex).toBe(1);
		expect(buildSchedule(restored!).rows[0]?.extraPaid).toBe(200_000);
	});

	it.each([
		["пустой список досрочек вместо массива", { earlyPayments: null }],
		["досрочка вместо массива", { earlyPayments: {} }],
		["пустой элемент досрочек", { earlyPayments: [null] }],
		["неизвестный тип платежа", { paymentType: "wrong" }],
		["пустой взнос", { downPayment: null }],
		["строковая стоимость", { propertyPrice: "12000000" }],
		["небезопасная сумма", { propertyPrice: Number.MAX_SAFE_INTEGER }],
		["отрицательный взнос", { downPayment: -1 }],
		["ставка вне диапазона", { annualRate: 101 }],
		["дробный срок", { termMonths: 12.5 }],
		["слишком большой срок", { termMonths: 601 }],
		["несуществующая дата", { startDate: "2026-02-30" }],
		["неверная дата", { startDate: "bad" }],
		[
			"неверная сумма досрочки",
			{
				earlyPayments: [
					{ id: "e1", monthIndex: 1, amount: "1000", strategy: "reduceTerm" },
				],
			},
		],
		[
			"неверная стратегия досрочки",
			{
				earlyPayments: [
					{ id: "e1", monthIndex: 1, amount: 1000, strategy: "wrong" },
				],
			},
		],
		[
			"досрочка вне срока",
			{
				earlyPayments: [
					{ id: "e1", monthIndex: 241, amount: 1000, strategy: "reduceTerm" },
				],
			},
		],
		[
			"неверный идентификатор",
			{
				earlyPayments: [
					{ id: 1, monthIndex: 1, amount: 1000, strategy: "reduceTerm" },
				],
			},
		],
		[
			"дублирующиеся идентификаторы",
			{
				earlyPayments: [
					{ id: "e1", monthIndex: 1, amount: 1000, strategy: "reduceTerm" },
					{ id: "e1", monthIndex: 2, amount: 1000, strategy: "reduceTerm" },
				],
			},
		],
		["регулярная надбавка вместо объекта", { recurringExtra: [] }],
		[
			"неверная стратегия надбавки",
			{
				recurringExtra: { amount: 1000, startMonthIndex: 1, strategy: "wrong" },
			},
		],
		[
			"неверная сумма надбавки",
			{
				recurringExtra: {
					amount: -1000,
					startMonthIndex: 1,
					strategy: "reduceTerm",
				},
			},
		],
		[
			"начало надбавки вне срока",
			{
				recurringExtra: {
					amount: 1000,
					startMonthIndex: 241,
					strategy: "reduceTerm",
				},
			},
		],
		["неизвестная версия", { version: 2 }],
		["версия неверного типа", { version: "1" }],
	])("отклоняет повреждённые данные: %s", (_name, patch) => {
		expect(decodeLoanInput(encoded({ ...DEFAULT_LOAN, ...patch }))).toBeNull();
	});

	it("отклоняет бесконечные числа из JSON", () => {
		const json = JSON.stringify(DEFAULT_LOAN).replace(
			'"propertyPrice":12000000',
			'"propertyPrice":1e309',
		);
		expect(decodeLoanInput(compressToEncodedURIComponent(json))).toBeNull();
	});

	it.each([null, "", "bad", encoded(null), encoded([])])(
		"безопасно отклоняет неразбираемую ссылку %s",
		(value) => {
			expect(decodeLoanInput(value)).toBeNull();
		},
	);
});
