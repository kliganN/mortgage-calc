import {
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import type { ScheduleResult } from "@/lib/calc";
import { formatRub } from "@/lib/format";

interface PayoutPieChartProps {
	schedule: ScheduleResult;
}

/** Структура выплат: тело кредита и проценты. */
export function PayoutPieChart({ schedule }: PayoutPieChartProps) {
	const noLoan = schedule.loanAmount <= 0;
	const data = [
		{
			name: "Тело кредита",
			value: schedule.loanAmount / 100,
			fill: "var(--chart-2)",
		},
		{
			name: "Проценты",
			value: schedule.totalInterest / 100,
			fill: "var(--chart-1)",
		},
	];

	if (noLoan) return null;

	return (
		<ChartCard
			title="Структура выплат"
			description="Доля процентов в общей сумме выплат"
		>
			<div className="h-72">
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Pie
							data={data}
							dataKey="value"
							nameKey="name"
							innerRadius={60}
							outerRadius={95}
							stroke="var(--background)"
							strokeWidth={2}
						>
							{data.map((entry) => (
								<Cell key={entry.name} fill={entry.fill} />
							))}
						</Pie>
						<Tooltip
							formatter={(value) => formatRub(Number(value) * 100)}
							contentStyle={{
								background: "var(--popover)",
								border: "1px solid var(--border)",
								borderRadius: 8,
								color: "var(--popover-foreground)",
							}}
						/>
						<Legend
							formatter={(value) => <span className="text-sm">{value}</span>}
						/>
					</PieChart>
				</ResponsiveContainer>
			</div>
		</ChartCard>
	);
}
