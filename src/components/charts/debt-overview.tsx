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
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { ScheduleResult } from "@/lib/calc";
import { formatMonthYear, formatRub } from "@/lib/format";

/** Полный горизонт кредита всегда виден; фильтрация таблицы его не обрезает. */
export function DebtOverview({
	schedule,
	baseline,
}: {
	schedule: ScheduleResult;
	baseline: ScheduleResult;
}) {
	const hasExtra = schedule.totalExtraPaid > 0;
	const data = useMemo(
		() => [
			{
				month: 0,
				date: "Начало кредита",
				debt: schedule.loanAmount / 100,
				baseline: baseline.loanAmount / 100,
			},
			...baseline.rows.map((row, i) => ({
				month: i + 1,
				date: formatMonthYear(row.date),
				debt: (schedule.rows[i]?.remaining ?? 0) / 100,
				baseline: row.remaining / 100,
			})),
		],
		[schedule, baseline],
	);
	return (
		<Card id="analytics" className="scroll-mt-24">
			<CardHeader>
				<CardTitle>Как уменьшается долг</CardTitle>
				<CardDescription>
					Весь срок кредита — от первого платежа до погашения
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div
					className="h-60 min-w-0 sm:h-64"
					role="img"
					aria-label={`Остаток долга снижается с ${formatRub(schedule.loanAmount)} до нуля за ${schedule.effectiveTermMonths} месяцев. Точные значения доступны в таблице платежей.`}
				>
					<ResponsiveContainer width="100%" height="100%">
						<LineChart
							data={data}
							margin={{ top: 12, right: 12, bottom: 0, left: 0 }}
						>
							<CartesianGrid
								stroke="var(--border)"
								strokeDasharray="4 4"
								vertical={false}
							/>
							<XAxis
								dataKey="month"
								type="number"
								domain={[0, baseline.effectiveTermMonths]}
								tickCount={6}
								tick={{ fontSize: 11 }}
								tickLine={false}
								axisLine={false}
								tickFormatter={(month: number) =>
									month === 0
										? "Старт"
										: `${Math.round((month / 12) * 10) / 10} г.`
								}
							/>
							<YAxis
								domain={[0, schedule.loanAmount / 100]}
								width={62}
								tick={{ fontSize: 11 }}
								tickLine={false}
								axisLine={false}
								tickFormatter={(value: number) =>
									value >= 1_000_000
										? `${Math.round(value / 100_000) / 10} млн`
										: `${Math.round(value / 1000)} тыс.`
								}
							/>
							<Tooltip
								labelFormatter={(_, payload) =>
									String(payload[0]?.payload.date ?? "")
								}
								formatter={(value) => formatRub(Number(value) * 100)}
								contentStyle={{
									background: "var(--popover)",
									border: "1px solid var(--border)",
									borderRadius: 12,
									color: "var(--popover-foreground)",
								}}
							/>
							{hasExtra && (
								<Line
									name="Без досрочных"
									dataKey="baseline"
									stroke="var(--chart-5)"
									strokeDasharray="5 5"
									strokeWidth={2}
									dot={false}
									isAnimationActive={false}
								/>
							)}
							<Line
								name={hasExtra ? "С досрочными" : "Остаток долга"}
								dataKey="debt"
								stroke="var(--chart-1)"
								strokeWidth={3}
								dot={false}
								isAnimationActive={false}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
				{hasExtra && (
					<p className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
						<span className="flex items-center gap-2">
							<span className="h-0.5 w-5 bg-chart-1" />С досрочными
						</span>
						<span className="flex items-center gap-2">
							<span className="w-5 border-t-2 border-dashed border-chart-5" />
							Без досрочных
						</span>
					</p>
				)}
			</CardContent>
		</Card>
	);
}
