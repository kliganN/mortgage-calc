import { useState } from "react";
import {
	Cell,
	Legend,
	Pie,
	PieChart,
	type PieSectorDataItem,
	ResponsiveContainer,
	Sector,
	Tooltip,
} from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import type { ScheduleResult } from "@/lib/calc";
import { formatRub } from "@/lib/format";

interface PayoutPieChartProps {
	schedule: ScheduleResult;
}

interface Segment {
	name: string;
	value: number;
	fill: string;
}

/** Активный сектор: чуть больше радиусом и с обводкой. */
function activeSector(props: PieSectorDataItem) {
	return (
		<Sector
			{...props}
			outerRadius={(Number(props.outerRadius) || 100) + 8}
			stroke="var(--background)"
			strokeWidth={3}
		/>
	);
}

/** Структура выплат: интерактивный донат, в центре — выбранный сегмент или итог. */
export function PayoutPieChart({ schedule }: PayoutPieChartProps) {
	const [hovered, setHovered] = useState<number | null>(null);

	const noLoan = schedule.loanAmount <= 0;
	const data: Segment[] = [
		{
			name: "Тело кредита",
			value: schedule.loanAmount / 100,
			fill: "var(--chart-1)",
		},
		{
			name: "Проценты",
			value: schedule.totalInterest / 100,
			fill: "var(--chart-2)",
		},
	];

	if (noLoan) return null;

	const total = schedule.loanAmount + schedule.totalInterest;
	const active = hovered !== null ? data[hovered] : null;
	const centerTitle = active ? active.name : "Всего выплачено";
	const centerValue = active ? active.value : total / 100;
	const centerShare = active
		? `${Math.round((active.value / (total / 100)) * 100)} %`
		: "";

	return (
		<ChartCard
			title="Структура выплат"
			description="Наведите на сектор или подпись, чтобы увидеть долю"
		>
			<div className="relative h-72">
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Pie
							data={data}
							dataKey="value"
							nameKey="name"
							innerRadius={68}
							outerRadius={100}
							paddingAngle={2}
							stroke="var(--background)"
							strokeWidth={2}
							activeShape={activeSector}
							onMouseEnter={(_, i) => setHovered(i)}
							onMouseLeave={() => setHovered(null)}
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
							formatter={(value) => (
								<span className="text-sm">{String(value)}</span>
							)}
						/>
					</PieChart>
				</ResponsiveContainer>
				<div className="pointer-events-none absolute inset-x-0 top-[38%] -translate-y-1/2 text-center">
					<p className="text-xs text-muted-foreground">{centerTitle}</p>
					<p className="text-xl font-bold tabular-nums tracking-tight">
						{formatRub(centerValue * 100)}
					</p>
					{centerShare && (
						<p className="text-xs text-muted-foreground">
							{centerShare} от выплат
						</p>
					)}
				</div>
			</div>
		</ChartCard>
	);
}
