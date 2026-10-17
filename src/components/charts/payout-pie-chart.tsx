import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScheduleResult } from "@/lib/calc";
import { formatRub } from "@/lib/format";

/** Значения и доли доступны без наведения, в том числе с телефона и клавиатуры. */
export function PayoutPieChart({ schedule }: { schedule: ScheduleResult }) {
	if (schedule.loanAmount <= 0) return null;
	const data = [
		{ name: "Кредит", value: schedule.loanAmount, color: "var(--chart-1)" },
		{
			name: "Проценты",
			value: schedule.totalInterest,
			color: "var(--chart-2)",
		},
	];
	return (
		<Card>
			<CardHeader>
				<CardTitle>Из чего складываются выплаты</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-wrap items-center gap-5">
				<div className="h-36 w-36 shrink-0" aria-hidden>
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Pie
								data={data}
								dataKey="value"
								innerRadius={45}
								outerRadius={65}
								paddingAngle={2}
								stroke="var(--card)"
								isAnimationActive={false}
							>
								{data.map((part) => (
									<Cell key={part.name} fill={part.color} />
								))}
							</Pie>
						</PieChart>
					</ResponsiveContainer>
				</div>
				<dl className="flex min-w-40 flex-1 flex-col gap-4">
					{data.map((part) => (
						<div key={part.name}>
							<dt className="flex items-center gap-2 text-sm text-muted-foreground">
								<span
									className="size-2.5 rounded-full"
									style={{ background: part.color }}
								/>
								{part.name}
								<span className="ml-auto tabular-nums">
									{Math.round((part.value / schedule.totalPaid) * 100)} %
								</span>
							</dt>
							<dd className="mt-1 text-lg font-semibold wrap-break-word tabular-nums">
								{formatRub(part.value)}
							</dd>
						</div>
					))}
				</dl>
			</CardContent>
		</Card>
	);
}
