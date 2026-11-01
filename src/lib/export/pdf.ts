import type {
	Content,
	ContentText,
	TableCell,
	TDocumentDefinitions,
} from "pdfmake/interfaces";
import type { LoanInput, ScheduleResult } from "@/lib/calc";
import {
	formatDate,
	formatMonthYear,
	formatRate,
	formatRubPrecise,
	formatTerm,
	localISODate,
} from "@/lib/format";

const COLORS = {
	ink: "#0f1f17",
	muted: "#5f7268",
	primary: "#047857",
	line: "#dde8e2",
	soft: "#e7f2ec",
};

/** Самостоятельный PDF использует те же суммы и полный график, что и печатный отчёт. */
export function buildReportPdfDocument(
	input: LoanInput,
	schedule: ScheduleResult,
	generatedOn = localISODate(),
): TDocumentDefinitions {
	const earlyMonths = schedule.rows.filter((row) => row.extraPaid > 0).length;
	const metrics: [string, string][] = [
		["Сумма кредита", formatRubPrecise(schedule.loanAmount)],
		["Стоимость жилья", formatRubPrecise(input.propertyPrice * 100)],
		["Первоначальный взнос", formatRubPrecise(input.downPayment * 100)],
		["Ставка", `${formatRate(input.annualRate)} годовых`],
		[
			"Тип платежей",
			input.paymentType === "annuity" ? "Аннуитетные" : "Дифференцированные",
		],
		["Первый платёж", formatMonthYear(input.startDate)],
		["Первый плановый платёж", formatRubPrecise(schedule.initialPayment)],
		["Переплата (проценты)", formatRubPrecise(schedule.totalInterest)],
		["Общая выплата", formatRubPrecise(schedule.totalPaid)],
		["Срок по графику", formatTerm(schedule.effectiveTermMonths)],
		[
			"Досрочные платежи",
			schedule.totalExtraPaid > 0
				? formatRubPrecise(schedule.totalExtraPaid)
				: "нет",
		],
		["Досрочек в графике", earlyMonths > 0 ? `${earlyMonths} мес.` : "—"],
	];
	const summary: Content = {
		columns: [0, 1, 2].map((column) => ({
			width: "*",
			stack: metrics
				.filter((_, index) => index % 3 === column)
				.map(([label, value]) => ({
					stack: [
						{
							text: label,
							color: COLORS.muted,
							fontSize: 9,
							margin: [0, 0, 0, 3],
						},
						{
							text: value,
							fontSize: 11,
							bold: label === "Первый плановый платёж",
						},
					],
					margin: [0, 0, 0, 12],
				})),
		})),
		columnGap: 22,
		margin: [0, 20, 0, 12],
	};
	const content: Content[] = [
		{
			text: "Ипотека — прозрачно",
			color: COLORS.primary,
			fontSize: 10,
			bold: true,
		},
		{
			text: "График платежей по ипотечному кредиту",
			fontSize: 21,
			bold: true,
			margin: [0, 8, 0, 6],
		},
		{
			columns: [
				{
					text: "Дата формирования",
					color: COLORS.muted,
					fontSize: 9,
					width: "auto",
				},
				{ text: formatDate(generatedOn), fontSize: 9 },
			],
			columnGap: 8,
		},
		summary,
	];
	if (schedule.rows.length > 0) {
		const cell = (text: string, money = false): ContentText => ({
			text,
			alignment: money ? "right" : "left",
			noWrap: true,
		});
		const body: TableCell[][] = [
			[
				"№",
				"Дата",
				"Платёж, ₽",
				"Проценты, ₽",
				"Тело, ₽",
				"Досрочно, ₽",
				"Остаток, ₽",
			].map((text, index) => ({
				text,
				bold: true,
				color: COLORS.ink,
				fillColor: COLORS.soft,
				alignment: index > 1 ? "right" : "left",
			})),
			...schedule.rows.map((row) => [
				cell(String(row.monthIndex)),
				cell(formatDate(row.date)),
				cell(formatRubPrecise(row.payment), true),
				cell(formatRubPrecise(row.interest), true),
				cell(formatRubPrecise(row.principal), true),
				cell(row.extraPaid > 0 ? formatRubPrecise(row.extraPaid) : "", true),
				cell(formatRubPrecise(row.remaining), true),
			]),
			[
				"Итого",
				"",
				formatRubPrecise(schedule.totalPaid - schedule.totalExtraPaid),
				formatRubPrecise(schedule.totalInterest),
				formatRubPrecise(schedule.loanAmount - schedule.totalExtraPaid),
				schedule.totalExtraPaid > 0
					? formatRubPrecise(schedule.totalExtraPaid)
					: "",
				"",
			].map((text, index) => ({
				...cell(text, index > 1),
				bold: true,
				fillColor: COLORS.soft,
			})),
		];
		content.push({
			fontSize: 9,
			table: {
				headerRows: 1,
				keepWithHeaderRows: 1,
				dontBreakRows: true,
				widths: [24, 64, "*", "*", "*", "*", "*"],
				body,
			},
			layout: {
				hLineWidth: () => 0.5,
				vLineWidth: () => 0,
				hLineColor: () => COLORS.line,
				paddingTop: () => 5,
				paddingBottom: () => 5,
				paddingLeft: () => 7,
				paddingRight: () => 7,
			},
		});
	} else {
		content.push({
			text: "Нет данных: сумма кредита равна нулю.",
			color: COLORS.muted,
			margin: [0, 16, 0, 16],
		});
	}
	content.push({
		text: "Расчёт предварительный и не является офертой. Точные условия уточняйте в банке.",
		fontSize: 8,
		color: COLORS.muted,
		margin: [0, 14, 0, 0],
	});
	return {
		pageSize: "A4",
		pageOrientation: "landscape",
		pageMargins: [32, 30, 32, 40],
		defaultStyle: { font: "Roboto", fontSize: 10, color: COLORS.ink },
		info: {
			title: "График платежей по ипотеке",
			author: "Ипотека — прозрачно",
		},
		content,
		footer: (currentPage, pageCount) => ({
			text: `Страница ${currentPage} из ${pageCount}`,
			alignment: "right",
			fontSize: 8,
			color: COLORS.muted,
			margin: [32, 12, 32, 0],
		}),
	};
}

/** Библиотека и встроенные кириллические шрифты загружаются только при скачивании. */
export async function exportScheduleToPdf(
	input: LoanInput,
	schedule: ScheduleResult,
): Promise<void> {
	const [{ default: pdfMake }, { default: pdfFonts }] = await Promise.all([
		import("pdfmake/build/pdfmake"),
		import("pdfmake/build/vfs_fonts"),
	]);
	pdfMake.addVirtualFileSystem(pdfFonts);
	const generatedOn = localISODate();
	await pdfMake
		.createPdf(buildReportPdfDocument(input, schedule, generatedOn))
		.download(`ipoteka-${generatedOn}.pdf`);
}
