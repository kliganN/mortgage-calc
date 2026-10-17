import { ArrowDownRight, CalendarCheck, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LoanInput, ScheduleResult } from "@/lib/calc";
import {
	formatMonthYear,
	formatRub,
	formatRubPrecise,
	formatTerm,
} from "@/lib/format";

interface SummaryCardsProps {
	schedule: ScheduleResult;
	input: LoanInput;
	baseline: ScheduleResult;
}

/** Ключевой результат отделён от итоговой суммы; первый платёж не выдаётся за будущий. */
export function SummaryCards({ schedule, input, baseline }: SummaryCardsProps) {
	const noLoan = schedule.loanAmount <= 0;
	const hasExtra = schedule.totalExtraPaid > 0;
	const last = schedule.rows.at(-1);
	const saved = baseline.totalInterest - schedule.totalInterest;
	const monthsSaved =
		baseline.effectiveTermMonths - schedule.effectiveTermMonths;
	const changing =
		input.paymentType === "differentiated" ||
		schedule.initialPayment !== schedule.currentPayment;
	return (
		<Card className="overflow-hidden border-primary/20 bg-card shadow-sm">
			<CardHeader className="gap-2 pb-0">
				<CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
					<Wallet className="size-4" aria-hidden />
					{changing ? "Первый платёж" : "Ежемесячный платёж"}
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-5">
				<div role="status" aria-label="Результат расчёта">
					<p
						className="text-4xl font-semibold tracking-tight text-primary tabular-nums sm:text-5xl"
						title={formatRubPrecise(schedule.initialPayment)}
					>
						{noLoan ? "Без кредита" : formatRub(schedule.initialPayment)}
						<span className="ml-2 text-sm font-normal text-muted-foreground">
							{!noLoan && "/ месяц"}
						</span>
					</p>
					{changing && !noLoan && (
						<p className="mt-2 text-sm text-muted-foreground">
							{input.paymentType === "differentiated"
								? `Снижается до ${formatRub(schedule.finalPayment)} к последнему месяцу`
								: `Плановый платёж к концу графика — ${formatRub(schedule.currentPayment)} / месяц`}
						</p>
					)}
					{input.recurringExtra && input.recurringExtra.amount > 0 && (
						<p className="mt-2 text-sm text-muted-foreground">
							Дополнительно {formatRub(input.recurringExtra.amount * 100)} с
							месяца {input.recurringExtra.startMonthIndex}
						</p>
					)}
				</div>
				<dl className="grid grid-cols-2 gap-x-4 gap-y-5 border-t pt-5 sm:grid-cols-3">
					<Metric
						label="Сумма кредита"
						value={formatRub(schedule.loanAmount)}
					/>
					<Metric
						label="Переплата процентами"
						value={formatRub(schedule.totalInterest)}
					/>
					<Metric label="Всего банку" value={formatRub(schedule.totalPaid)} />
				</dl>
				{last && (
					<p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
						<CalendarCheck className="size-4" aria-hidden />
						Погашение —{" "}
						<span className="font-medium text-foreground">
							{formatMonthYear(last.date)}
						</span>
						<span>· {formatTerm(schedule.effectiveTermMonths)}</span>
					</p>
				)}
				{hasExtra && (
					<div className="rounded-xl bg-secondary p-4 text-secondary-foreground">
						<p className="flex items-center gap-2 font-medium">
							<ArrowDownRight className="size-4" aria-hidden />
							Экономия от досрочных — {formatRub(saved)}
						</p>
						<p className="mt-1 text-sm">
							{monthsSaved > 0
								? `Кредит закроется на ${formatTerm(monthsSaved)} раньше.`
								: "Снижается ежемесячная нагрузка."}{" "}
							По сравнению с тем же кредитом без досрочных.
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<dt className="text-xs leading-relaxed text-muted-foreground">{label}</dt>
			<dd className="mt-1 text-base font-semibold tabular-nums sm:text-lg">
				{value}
			</dd>
		</div>
	);
}
