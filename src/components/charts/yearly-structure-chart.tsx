import { useMemo } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import type { ScheduleResult } from "@/lib/calc";
import { formatRub } from "@/lib/format";

interface YearlyStructureChartProps {
	schedule: ScheduleResult;
}

/** Состав платежей по календарным годам: тело (+ досрочные) и проценты. */
export function YearlyStructureChart({ schedule }: YearlyStructureChartProps) {
	const data = useMemo(() => {
		const byYear = new Map<string, { Тело: number; Проценты: number }>();
		for (const row of schedule.rows) {
			const year = row.date.slice(0, 4);
			const acc = byYear.get(year) ?? { Тело: 0, Проценты: 0 };
			acc.Тело += (row.principal + row.extraPaid) / 100;
			acc.Проценты += row.interest / 100;
			byYear.set(year, acc);
		}
		return [...byYear.entries()].map(([year, v]) => ({ year, ...v }));
	}, [schedule.rows]);

	if (data.length === 0) return null;

	return (
		<ChartCard
			title="Состав платежей по годам"
			description="Тело кредита (включая досрочные) и проценты"
		>
			<div className="h-72">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart
						data={data}
						margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
					>
						<CartesianGrid
							stroke="var(--border)"
							strokeDasharray="4 4"
							vertical={false}
						/>
						<XAxis dataKey="year" tick={{ fontSize: 11 }} tickLine={false} />
						<YAxis
							tick={{ fontSize: 11 }}
							tickLine={false}
							axisLine={false}
							tickFormatter={(v: number) =>
								v >= 1_000_000
									? `${Math.round(v / 100_000) / 10} млн`
									: `${Math.round(v / 1000)} тыс.`
							}
							width={56}
						/>
						<Tooltip
							formatter={(value) => formatRub(Number(value) * 100)}
							contentStyle={{
								background: "var(--popover)",
								border: "1px solid var(--border)",
								borderRadius: 8,
								color: "var(--popover-foreground)",
							}}
						/>
						<Legend />
						<Bar
							dataKey="Тело"
							stackId="a"
							fill="var(--chart-2)"
							radius={[0, 0, 0, 0]}
						/>
						<Bar
							dataKey="Проценты"
							stackId="a"
							fill="var(--chart-1)"
							radius={[4, 4, 0, 0]}
						/>
					</BarChart>
				</ResponsiveContainer>
			</div>
		</ChartCard>
	);
}
