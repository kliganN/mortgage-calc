import type {
	Content,
	ContentTable,
	TableCell,
	TDocumentDefinitions,
} from "pdfmake/interfaces";
import { describe, expect, it } from "vitest";
import { buildSchedule } from "@/lib/calc";
import { buildReportPdfDocument } from "@/lib/export/pdf";
import { formatDate, formatRubPrecise } from "@/lib/format";
import { DEFAULT_LOAN } from "@/store/loan";

function scheduleTable(
	document: TDocumentDefinitions,
): ContentTable | undefined {
	const content: Content[] = Array.isArray(document.content)
		? document.content
		: [document.content];
	return content.find(
		(node): node is ContentTable =>
			typeof node === "object" && node !== null && "table" in node,
	);
}

function cellText(cell: TableCell): string {
	return typeof cell === "object" && cell !== null && "text" in cell
		? String(cell.text)
		: String(cell);
}

function visibleTexts(value: unknown): string[] {
	if (Array.isArray(value)) return value.flatMap(visibleTexts);
	if (typeof value !== "object" || value === null) return [];
	return Object.entries(value).flatMap(([key, entry]) =>
		key === "text" && typeof entry === "string" ? [entry] : visibleTexts(entry),
	);
}

describe("PDF-отчёт", () => {
	it("включает все платежи, последний остаток и отдельные итоговые суммы", () => {
		const schedule = buildSchedule(DEFAULT_LOAN);
		const document = buildReportPdfDocument(
			DEFAULT_LOAN,
			schedule,
			"2026-11-01",
		);
		const table = scheduleTable(document);
		expect(table?.table.headerRows).toBe(1);
		expect(table?.table.dontBreakRows).toBe(true);
		expect(table?.table.body).toHaveLength(schedule.rows.length + 2);
		const last = schedule.rows.at(-1)!;
		expect(table?.table.body.at(-2)?.map(cellText)).toEqual([
			String(last.monthIndex),
			formatDate(last.date),
			formatRubPrecise(last.payment),
			formatRubPrecise(last.interest),
			formatRubPrecise(last.principal),
			"",
			formatRubPrecise(0),
		]);
		expect(table?.table.body.at(-1)?.map(cellText)).toEqual([
			"Итого",
			"",
			formatRubPrecise(schedule.totalPaid),
			formatRubPrecise(schedule.totalInterest),
			formatRubPrecise(schedule.loanAmount),
			"",
			"",
		]);
		expect(visibleTexts(document)).toContain("01.11.2026");
	});

	it("указывает первый плановый платёж дифференцированного кредита", () => {
		const input = {
			...DEFAULT_LOAN,
			propertyPrice: 1_200_000,
			downPayment: 0,
			annualRate: 10,
			termMonths: 12,
			paymentType: "differentiated" as const,
		};
		const document = buildReportPdfDocument(input, buildSchedule(input));
		const texts = visibleTexts(document);
		expect(texts[texts.indexOf("Первый плановый платёж") + 1]).toBe(
			"110\u00a0000,00\u00a0₽",
		);
	});

	it("не подменяет первый платёж суммой после уменьшения досрочкой", () => {
		const input = {
			...DEFAULT_LOAN,
			propertyPrice: 1_200_000,
			downPayment: 0,
			annualRate: 0,
			termMonths: 12,
			earlyPayments: [
				{
					id: "extra",
					monthIndex: 1,
					amount: 100_000,
					strategy: "reducePayment" as const,
				},
			],
		};
		const texts = visibleTexts(
			buildReportPdfDocument(input, buildSchedule(input)),
		);
		expect(texts[texts.indexOf("Первый плановый платёж") + 1]).toBe(
			"100\u00a0000,00\u00a0₽",
		);
	});

	it("экспортирует фактический сокращённый график и отделяет досрочные от плановых", () => {
		const input = {
			...DEFAULT_LOAN,
			propertyPrice: 1_200_000,
			downPayment: 0,
			annualRate: 0,
			termMonths: 12,
			recurringExtra: {
				amount: 100_000,
				startMonthIndex: 1,
				strategy: "reduceTerm" as const,
			},
		};
		const schedule = buildSchedule(input);
		const body = scheduleTable(buildReportPdfDocument(input, schedule))?.table
			.body;
		expect(schedule.effectiveTermMonths).toBe(6);
		expect(body).toHaveLength(8);
		expect(body?.at(-1)?.map(cellText)).toEqual([
			"Итого",
			"",
			formatRubPrecise(60_000_000),
			formatRubPrecise(0),
			formatRubPrecise(60_000_000),
			formatRubPrecise(60_000_000),
			"",
		]);
	});

	it("показывает понятное сообщение вместо пустой таблицы при отсутствии кредита", () => {
		const input = { ...DEFAULT_LOAN, downPayment: DEFAULT_LOAN.propertyPrice };
		const document = buildReportPdfDocument(input, buildSchedule(input));
		expect(scheduleTable(document)).toBeUndefined();
		expect(visibleTexts(document)).toContain(
			"Нет данных: сумма кредита равна нулю.",
		);
	});
});
