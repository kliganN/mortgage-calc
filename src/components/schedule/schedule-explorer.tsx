import { useId, useMemo, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { ScheduleResult } from "@/lib/calc";
import { formatDate, formatMonthYear, formatRubPrecise } from "@/lib/format";

/** Таблица фильтруется независимо от обзорной диаграммы. На телефоне — карточки месяцев. */
export function ScheduleExplorer({ schedule }: { schedule: ScheduleResult }) {
	const [year, setYear] = useState("");
	const [selected, setSelected] = useState<number | null>(null);
	const selectId = useId();
	const years = [...new Set(schedule.rows.map((row) => row.date.slice(0, 4)))];
	// Если прежний год исчез после досрочки, показываем первый доступный год.
	const activeYear =
		year === "all" ? "all" : years.includes(year) ? year : years[0];
	const visible = useMemo(
		() =>
			schedule.rows.filter(
				(row) => activeYear === "all" || row.date.startsWith(activeYear ?? ""),
			),
		[schedule.rows, activeYear],
	);
	const chosen = visible.find((row) => row.monthIndex === selected);
	const totals = visible.reduce(
		(acc, row) => ({
			payment: acc.payment + row.payment,
			interest: acc.interest + row.interest,
			principal: acc.principal + row.principal,
			extra: acc.extra + row.extraPaid,
		}),
		{ payment: 0, interest: 0, principal: 0, extra: 0 },
	);
	return (
		<Card>
			<CardHeader className="flex flex-wrap items-start justify-between gap-4 sm:flex-row">
				<div className="flex flex-col gap-1">
					<CardTitle>График платежей</CardTitle>
					<CardDescription>
						{schedule.rows.length} платежей · суммы с точностью до копейки
					</CardDescription>
				</div>
				<div className="flex items-center gap-3">
					<label htmlFor={selectId} className="text-sm text-muted-foreground">
						Период
					</label>
					<select
						id={selectId}
						className="h-11 rounded-lg border bg-card px-3 text-sm"
						value={activeYear ?? ""}
						onChange={(e) => {
							setYear(e.target.value);
							setSelected(null);
						}}
					>
						<option value="all">Весь срок</option>
						{years.map((value) => (
							<option key={value} value={value}>
								{value} год
							</option>
						))}
					</select>
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{chosen && (
					<p
						role="status"
						className="rounded-xl bg-secondary p-4 text-sm leading-relaxed text-secondary-foreground"
					>
						{formatMonthYear(chosen.date)}:{" "}
						{formatRubPrecise(chosen.payment + chosen.extraPaid)}, из них
						проценты — {formatRubPrecise(chosen.interest)}, погашение долга —{" "}
						{formatRubPrecise(chosen.principal + chosen.extraPaid)}.
					</p>
				)}
				<div className="hidden overflow-x-auto rounded-xl border sm:block">
					<Table className="text-sm">
						<TableHeader>
							<TableRow>
								<TableHead>Месяц</TableHead>
								<TableHead>Дата платежа</TableHead>
								<TableHead className="text-right">Платёж</TableHead>
								<TableHead className="text-right">Проценты</TableHead>
								<TableHead className="text-right">Основной долг</TableHead>
								<TableHead className="text-right">Досрочно</TableHead>
								<TableHead className="text-right">Остаток</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{visible.map((row) => (
								<TableRow
									key={row.monthIndex}
									className={row.extraPaid > 0 ? "bg-chart-4/5" : undefined}
								>
									<TableCell>
										<button
											type="button"
											className="min-h-11 min-w-11 rounded-lg px-2 text-primary hover:bg-secondary"
											aria-label={`Состав платежа за ${formatMonthYear(row.date)}`}
											aria-pressed={selected === row.monthIndex}
											onClick={() =>
												setSelected(
													selected === row.monthIndex ? null : row.monthIndex,
												)
											}
										>
											{row.monthIndex}
										</button>
									</TableCell>
									<TableCell className="whitespace-nowrap">
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
										{row.extraPaid > 0 ? formatRubPrecise(row.extraPaid) : "—"}
									</TableCell>
									<TableCell className="text-right font-medium tabular-nums">
										{formatRubPrecise(row.remaining)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
						<TableFooter>
							<TableRow>
								<TableCell colSpan={2}>
									{activeYear === "all"
										? "Итого по кредиту"
										: `Итого за ${activeYear}`}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatRubPrecise(totals.payment)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatRubPrecise(totals.interest)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatRubPrecise(totals.principal)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatRubPrecise(totals.extra)}
								</TableCell>
								<TableCell />
							</TableRow>
						</TableFooter>
					</Table>
				</div>
				<div className="flex flex-col gap-3 sm:hidden">
					{visible.map((row) => (
						<article key={row.monthIndex} className="rounded-xl border p-4">
							<p className="flex justify-between gap-2 text-sm">
								<span className="font-medium">{formatMonthYear(row.date)}</span>
								<span className="text-muted-foreground">
									№ {row.monthIndex}
								</span>
							</p>
							<p className="mt-2 text-lg font-semibold tabular-nums">
								{formatRubPrecise(row.payment + row.extraPaid)}
							</p>
							<dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
								<div>
									<dt className="text-muted-foreground">Основной долг</dt>
									<dd className="mt-1 tabular-nums">
										{formatRubPrecise(row.principal)}
									</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">Проценты</dt>
									<dd className="mt-1 tabular-nums">
										{formatRubPrecise(row.interest)}
									</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">Досрочно</dt>
									<dd className="mt-1 tabular-nums">
										{formatRubPrecise(row.extraPaid)}
									</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">Остаток долга</dt>
									<dd className="mt-1 tabular-nums">
										{formatRubPrecise(row.remaining)}
									</dd>
								</div>
							</dl>
						</article>
					))}
				</div>
				<p className="text-xs leading-relaxed text-muted-foreground">
					Плановый платёж не включает досрочное погашение — оно показано
					отдельно.{" "}
					{activeYear !== "all" &&
						`За выбранный год с досрочными: ${formatRubPrecise(totals.payment + totals.extra)}.`}
				</p>
			</CardContent>
		</Card>
	);
}
