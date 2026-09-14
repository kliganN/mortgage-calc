import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ScheduleResult } from "@/lib/calc";
import { formatRub, formatTerm } from "@/lib/format";

interface SummaryCardsProps {
	schedule: ScheduleResult;
}

/** Ключевые цифры кредита: платёж, переплата, общая выплата, срок. */
export function SummaryCards({ schedule }: SummaryCardsProps) {
	const noLoan = schedule.loanAmount <= 0;

	return (
		<div className="space-y-3">
			<Card className="border-primary/25 bg-primary/5">
				<CardContent className="space-y-1">
					<p className="text-sm text-muted-foreground">
						{schedule.effectiveTermMonths > 0 ? "Ежемесячный платёж" : "—"}
					</p>
					<p className="text-3xl font-bold tabular-nums tracking-tight">
						{noLoan ? "— " : formatRub(schedule.currentPayment)}
					</p>
					<p className="text-xs text-muted-foreground">
						{!noLoan && schedule.initialPayment !== schedule.currentPayment
							? `первый платёж — ${formatRub(schedule.initialPayment)}`
							: " \u00A0"}
					</p>
				</CardContent>
			</Card>

			<div className="grid grid-cols-2 gap-3">
				<MetricCard
					label="Переплата (проценты)"
					value={noLoan ? "—" : formatRub(schedule.totalInterest)}
					sub={
						noLoan
							? " "
							: `${Math.round((schedule.totalInterest / schedule.loanAmount) * 100)} % от суммы кредита`
					}
				/>
				<MetricCard
					label="Общая выплата"
					value={noLoan ? "—" : formatRub(schedule.totalPaid)}
					sub={noLoan ? " " : `кредит ${formatRub(schedule.loanAmount)}`}
				/>
				<MetricCard
					label="Срок с учётом досрочных"
					value={noLoan ? "—" : formatTerm(schedule.effectiveTermMonths)}
					sub={noLoan ? " " : `${schedule.effectiveTermMonths} платежей`}
				/>
				<MetricCard
					label="Досрочные платежи"
					value={
						noLoan
							? "—"
							: schedule.totalExtraPaid > 0
								? formatRub(schedule.totalExtraPaid)
								: "нет"
					}
					sub={
						noLoan
							? " "
							: schedule.totalExtraPaid > 0
								? "включены в график"
								: " \u00A0"
					}
				/>
			</div>
			<Separator />
		</div>
	);
}

function MetricCard({
	label,
	value,
	sub,
}: {
	label: string;
	value: string;
	sub: string;
}) {
	return (
		<Card>
			<CardContent className="space-y-1">
				<p className="text-xs text-muted-foreground">{label}</p>
				<p className="text-lg font-semibold tabular-nums tracking-tight">
					{value}
				</p>
				<p className="text-xs text-muted-foreground">{sub}</p>
			</CardContent>
		</Card>
	);
}
