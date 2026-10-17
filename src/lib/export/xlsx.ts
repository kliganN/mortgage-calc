import type { LoanInput, ScheduleResult } from "@/lib/calc";
import { toRubles } from "@/lib/calc";
import { formatDate, localISODate } from "@/lib/format";

const MONEY = "#,##0.00";

const PAYMENT_TYPE_LABELS = {
	annuity: "Аннуитетные",
	differentiated: "Дифференцированные",
} as const;

/**
 * Экспорт графика платежей в XLSX: лист «Параметры» и лист «График платежей»
 * с числовым форматом и итогами. exceljs загружается динамически — только в момент экспорта.
 */
export async function exportScheduleToXlsx(
	input: LoanInput,
	schedule: ScheduleResult,
): Promise<void> {
	const ExcelJS = await import("exceljs");
	const wb = new ExcelJS.Workbook();
	wb.creator = "Ипотечный калькулятор";
	wb.created = new Date();

	// ── Лист «Параметры» ──
	const params = wb.addWorksheet("Параметры");
	params.columns = [{ width: 34 }, { width: 28 }];
	const titleRow = params.addRow(["Параметры кредита"]);
	titleRow.font = { bold: true, size: 13 };
	params.addRow([]);
	const rows: [string, string | number][] = [
		["Стоимость жилья, ₽", input.propertyPrice],
		["Первоначальный взнос, ₽", input.downPayment],
		["Сумма кредита, ₽", toRubles(schedule.loanAmount)],
		["Срок, месяцев", input.termMonths],
		["Срок, лет", Math.round((input.termMonths / 12) * 10) / 10],
		["Ставка, % годовых", input.annualRate],
		["Тип платежей", PAYMENT_TYPE_LABELS[input.paymentType]],
		["Дата первого платежа", formatDate(input.startDate)],
		["Первый плановый платёж, ₽", toRubles(schedule.initialPayment)],
		["Переплата (проценты), ₽", toRubles(schedule.totalInterest)],
		["Общая выплата, ₽", toRubles(schedule.totalPaid)],
		["Фактический срок, месяцев", schedule.effectiveTermMonths],
	];
	if (input.paymentType === "differentiated") {
		rows.push(["Последний платёж, ₽", toRubles(schedule.finalPayment)]);
	} else if (schedule.currentPayment !== schedule.initialPayment) {
		rows.push(["Платёж после досрочных, ₽", toRubles(schedule.currentPayment)]);
	}
	for (const [label, value] of rows) {
		const row = params.addRow([label, value]);
		if (typeof value === "number") {
			row.getCell(2).numFmt = MONEY;
		}
	}
	if (input.earlyPayments.length > 0) {
		params.addRow([]);
		const earlyTitle = params.addRow(["Досрочные платежи"]);
		earlyTitle.font = { bold: true };
		for (const p of input.earlyPayments) {
			params.addRow([
				`Месяц ${p.monthIndex} · ${p.strategy === "reduceTerm" ? "уменьшение срока" : "уменьшение платежа"}`,
				p.amount,
			]);
		}
	}
	if (input.recurringExtra && input.recurringExtra.amount > 0) {
		params.addRow([
			`Регулярная надбавка с месяца ${input.recurringExtra.startMonthIndex} · ${input.recurringExtra.strategy === "reduceTerm" ? "уменьшение срока" : "уменьшение платежа"}`,
			input.recurringExtra.amount,
		]);
	}

	// ── Лист «График платежей» ──
	const ws = wb.addWorksheet("График платежей");
	ws.columns = [
		{ header: "№", key: "n", width: 6 },
		{ header: "Дата", key: "date", width: 13 },
		{ header: "Платёж, ₽", key: "payment", width: 16 },
		{ header: "Проценты, ₽", key: "interest", width: 16 },
		{ header: "Тело, ₽", key: "principal", width: 16 },
		{ header: "Досрочно, ₽", key: "extra", width: 16 },
		{ header: "Остаток, ₽", key: "remaining", width: 18 },
	];
	const header = ws.getRow(1);
	header.font = { bold: true };
	header.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFE8ECF4" },
	};

	for (const r of schedule.rows) {
		const row = ws.addRow({
			n: r.monthIndex,
			date: formatDate(r.date),
			payment: toRubles(r.payment),
			interest: toRubles(r.interest),
			principal: toRubles(r.principal),
			extra: r.extraPaid > 0 ? toRubles(r.extraPaid) : undefined,
			remaining: toRubles(r.remaining),
		});
		for (const col of [
			"payment",
			"interest",
			"principal",
			"extra",
			"remaining",
		] as const) {
			row.getCell(col).numFmt = MONEY;
		}
	}
	const totals = ws.addRow({
		n: "",
		date: "Итого",
		payment: toRubles(schedule.totalPaid - schedule.totalExtraPaid),
		interest: toRubles(schedule.totalInterest),
		principal: toRubles(schedule.loanAmount - schedule.totalExtraPaid),
		extra:
			schedule.totalExtraPaid > 0
				? toRubles(schedule.totalExtraPaid)
				: undefined,
		remaining: "",
	});
	totals.font = { bold: true };
	for (const col of ["payment", "interest", "principal", "extra"] as const) {
		totals.getCell(col).numFmt = MONEY;
	}
	ws.views = [{ state: "frozen", ySplit: 1 }];

	// ── Скачивание ──
	const buffer = await wb.xlsx.writeBuffer();
	const blob = new Blob([buffer], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	const stamp = localISODate();
	a.href = url;
	a.download = `ipoteka-grafik-${stamp}.xlsx`;
	a.click();
	URL.revokeObjectURL(url);
}
