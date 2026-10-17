import { Printer } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { buildSchedule, validateLoanInput } from "@/lib/calc";
import {
	formatDate,
	formatMonthYear,
	formatRate,
	formatRubPrecise,
	formatTerm,
	localISODate,
} from "@/lib/format";
import { decodeLoanInput } from "@/lib/url";
import { useLoanStore } from "@/store/loan";

/** Печатный отчёт: фиксированная светлая палитра, все строки графика. */
export default function ReportPage() {
	const storeInput = useLoanStore((s) => s.input);
	const patch = useLoanStore((s) => s.patch);
	const location = useLocation();

	// Приоритет: параметры из ссылки (?s=…), иначе — текущее состояние калькулятора.
	const { restored, invalidLink } = useMemo(() => {
		const params = new URLSearchParams(location.search);
		const restored = decodeLoanInput(params.get("s"));
		return {
			restored,
			invalidLink: params.has("s") && restored === null,
		};
	}, [location.search]);
	const input = restored ?? storeInput;

	// Переход из открытого по ссылке отчёта в калькулятор сохраняет этот расчёт.
	useEffect(() => {
		if (restored) patch(restored);
	}, [restored, patch]);

	const issues = useMemo(() => validateLoanInput(input), [input]);
	const schedule = useMemo(
		() => (invalidLink || issues.length > 0 ? null : buildSchedule(input)),
		[input, invalidLink, issues.length],
	);
	const toolbar = (
		<div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
			<h1 className="text-xl font-semibold">Отчёт для печати</h1>
			<Button
				className="h-11"
				disabled={schedule === null}
				onClick={() => globalThis.print()}
			>
				<Printer data-icon="inline-start" /> Печать / Сохранить в PDF
			</Button>
		</div>
	);

	if (schedule === null) {
		return (
			<div className="mx-auto max-w-4xl">
				{toolbar}
				<Alert variant="destructive">
					<AlertTitle>Не удалось сформировать отчёт</AlertTitle>
					<AlertDescription>
						{invalidLink ? (
							<p>
								Ссылка расчёта повреждена или содержит неподдерживаемые
								параметры.
							</p>
						) : (
							<ul className="list-inside list-disc">
								{issues.map((issue) => (
									<li key={`${issue.field}-${issue.message}`}>
										{issue.message}
									</li>
								))}
							</ul>
						)}
						<p>
							<Link to="/calculator">Открыть калькулятор</Link> и проверить
							параметры.
						</p>
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-4xl bg-white text-slate-900">
			{toolbar}

			<header className="mb-4 hidden print:block">
				<p className="text-lg font-bold">
					График платежей по ипотечному кредиту
				</p>
				<p className="text-xs text-slate-500">
					Сформировано ипотечным калькулятором · {formatDate(localISODate())}
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
				<ReportMetric
					label="Ставка"
					value={`${formatRate(input.annualRate)} годовых`}
				/>
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
					label="Первый плановый платёж"
					value={formatRubPrecise(schedule.initialPayment)}
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
