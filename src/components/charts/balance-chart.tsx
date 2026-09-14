import { useMemo } from "react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import type { ScheduleResult } from "@/lib/calc";
import { formatRub } from "@/lib/format";

interface BalanceChartProps {
	schedule: ScheduleResult;
}

/** Линейный график остатка долга; точки-отметки в месяцах с досрочными платежами. */
export function BalanceChart({ schedule }: BalanceChartProps) {
	const data = useMemo(
		() =>
			schedule.rows.map((row) => ({
				label: row.date.slice(0, 7),
				Остаток: row.remaining / 100,
				// Отдельная серия: значение только в месяцы с досрочными — рисуется точками.
				Досрочные: row.extraPaid > 0 ? row.remaining / 100 : null,
			})),
		[schedule.rows],
	);

	if (data.length === 0) return null;

	return (
		<ChartCard
			title="Остаток долга"
			description="Как снижается долг; точки — месяцы с досрочными платежами"
		>
			<div className="h-72">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart
						data={data}
						margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
					>
						<CartesianGrid
							stroke="var(--border)"
							strokeDasharray="4 4"
							vertical={false}
						/>
						<XAxis
							dataKey="label"
							interval={Math.max(1, Math.ceil(data.length / 10))}
							tickFormatter={(v: string) => {
								// «2026-10» → «10.26»: компактная подпись, читается на любом сроке
								const [y, m] = v.split("-");
								return `${m}.${y.slice(2)}`;
							}}
							tick={{ fontSize: 11 }}
							tickLine={false}
						/>
						<YAxis
							tick={{ fontSize: 11 }}
							tickLine={false}
							axisLine={false}
							tickFormatter={(v: number) => `${Math.round(v / 1_000_000)} млн`}
							width={52}
						/>
						<Tooltip
							formatter={(value) => formatRub(Number(value) * 100)}
							labelFormatter={(label) => `Месяц ${label}`}
							contentStyle={{
								background: "var(--popover)",
								border: "1px solid var(--border)",
								borderRadius: 8,
								color: "var(--popover-foreground)",
							}}
						/>
						<Line
							type="monotone"
							dataKey="Остаток"
							stroke="var(--chart-1)"
							strokeWidth={2}
							dot={false}
						/>
						<Line
							type="monotone"
							dataKey="Досрочные"
							stroke="var(--chart-1)"
							strokeWidth={0}
							dot={{
								r: 5,
								fill: "var(--chart-4)",
								stroke: "var(--background)",
							}}
							connectNulls={false}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</ChartCard>
	);
}
