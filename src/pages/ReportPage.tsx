import { Printer } from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { buildSchedule, type LoanInput } from "@/lib/calc";
import {
	formatDate,
	formatMonthYear,
	formatRubPrecise,
	formatTerm,
} from "@/lib/format";
import { decodeLoanInput } from "@/lib/url";
import { useLoanStore } from "@/store/loan";

/** Печатный отчёт: фиксированная светлая палитра, все строки графика. */
export default function ReportPage() {
	const storeInput = useLoanStore((s) => s.input);
	const location = useLocation();

	// Приоритет: параметры из ссылки (?s=…), иначе — текущее состояние калькулятора.
	const input: LoanInput = useMemo(() => {
		const restored = decodeLoanInput(
			new URLSearchParams(location.search).get("s"),
		);
		return restored ?? storeInput;
	}, [location.search, storeInput]);

	const schedule = useMemo(() => buildSchedule(input), [input]);

	return (
		<div className="mx-auto max-w-4xl bg-white text-slate-900">
			<div className="mb-6 flex items-center justify-between print:hidden">
				<h1 className="text-xl font-semibold">Отчёт для печати</h1>
				<Button onClick={() => globalThis.print()}>
					<Printer /> Печать / Сохранить в PDF
				</Button>
			</div>

			<header className="mb-4 hidden print:block">
				<p className="text-lg font-bold">
					График платежей по ипотечному кредиту
				</p>
				<p className="text-xs text-slate-500">
					Сформировано ипотечным калькулятором ·{" "}
					{formatDate(new Date().toISOString().slice(0, 10))}
				</p>
			</header>

			<section className="mb-4 grid grid-cols-2 gap-x-8 gap-y-1 rounded-lg border border-slate-200 p-4 text-sm sm:grid-cols-3">
				<ReportMetric
					label="Сумма кредита"
					value={formatRubPrecise(schedule.loanAmount)}
				/>
				<ReportMetric
					label="Стоимость жилья"
					value={formatRubPrecise(input.propertyPrice * 100)}
				/>
				<ReportMetric
					label="Первоначальный взнос"
					value={formatRubPrecise(input.downPayment * 100)}
				/>
				<ReportMetric label="Ставка" value={`${input.annualRate} % годовых`} />
				<ReportMetric
					label="Тип платежей"
					value={
						input.paymentType === "annuity"
							? "Аннуитетные"
							: "Дифференцированные"
					}
				/>
				<ReportMetric
					label="Первый платёж"
					value={formatMonthYear(input.startDate)}
				/>
				<ReportMetric
					label="Ежемесячный платёж"
					value={formatRubPrecise(schedule.currentPayment)}
					bold
				/>
				<ReportMetric
					label="Переплата (проценты)"
					value={formatRubPrecise(schedule.totalInterest)}
				/>
				<ReportMetric
					label="Общая выплата"
					value={formatRubPrecise(schedule.totalPaid)}
				/>
				<ReportMetric
					label="Срок по графику"
					value={formatTerm(schedule.effectiveTermMonths)}
				/>
				<ReportMetric
					label="Досрочные платежи"
					value={
						schedule.totalExtraPaid > 0
							? formatRubPrecise(schedule.totalExtraPaid)
							: "нет"
					}
				/>
				<ReportMetric
					label="Досрочек в графике"
					value={
						schedule.rows.filter((r) => r.extraPaid > 0).length > 0
							? `${schedule.rows.filter((r) => r.extraPaid > 0).length} мес.`
							: "—"
					}
				/>
			</section>

			<div className="overflow-x-auto rounded-lg border border-slate-200">
				<Table className="bg-white text-xs text-slate-900">
					<TableHeader>
						<TableRow className="border-slate-300">
							<TableHead className="text-slate-600">№</TableHead>
							<TableHead className="text-slate-600">Дата</TableHead>
							<TableHead className="text-right text-slate-600">
								Платёж, ₽
							</TableHead>
							<TableHead className="text-right text-slate-600">
								Проценты, ₽
							</TableHead>
							<TableHead className="text-right text-slate-600">
								Тело, ₽
							</TableHead>
							<TableHead className="text-right text-slate-600">
								Досрочно, ₽
							</TableHead>
							<TableHead className="text-right text-slate-600">
								Остаток, ₽
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{schedule.rows.map((row) => (
							<TableRow
								key={row.monthIndex}
								className={row.extraPaid > 0 ? "bg-emerald-50" : undefined}
							>
								<TableCell className="tabular-nums">{row.monthIndex}</TableCell>
								<TableCell className="whitespace-nowrap tabular-nums">
									{formatDate(row.date)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatRubPrecise(row.payment)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatRubPrecise(row.interest)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatRubPrecise(row.principal)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{row.extraPaid > 0 ? formatRubPrecise(row.extraPaid) : ""}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatRubPrecise(row.remaining)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
					{schedule.rows.length > 0 && (
						<TableFooter>
							<TableRow>
								<TableCell colSpan={2}>Итого</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatRubPrecise(
										schedule.totalPaid - schedule.totalExtraPaid,
									)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatRubPrecise(schedule.totalInterest)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatRubPrecise(
										schedule.loanAmount - schedule.totalExtraPaid,
									)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{schedule.totalExtraPaid > 0
										? formatRubPrecise(schedule.totalExtraPaid)
										: ""}
								</TableCell>
								<TableCell />
							</TableRow>
						</TableFooter>
					)}
				</Table>
			</div>

			{schedule.rows.length === 0 && (
				<p className="py-8 text-center text-sm text-slate-500">
					Нет данных: сумма кредита равна нулю.
				</p>
			)}

			<p className="mt-4 text-xs text-slate-500">
				Расчёт предварительный и не является офертой. Точные условия уточняйте в
				банке.
			</p>
		</div>
	);
}

function ReportMetric({
	label,
	value,
	bold = false,
}: {
	label: string;
	value: string;
	bold?: boolean;
}) {
	return (
		<div>
			<p className="text-xs text-slate-500">{label}</p>
			<p
				className={
					bold ? "text-base font-bold tabular-nums" : "font-medium tabular-nums"
				}
			>
				{value}
			</p>
		</div>
	);
}
