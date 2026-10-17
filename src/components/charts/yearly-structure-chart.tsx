import { useMemo, useState } from "react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ScheduleResult } from "@/lib/calc";
import { formatRub } from "@/lib/format";

interface YearlyStructureChartProps {
	schedule: ScheduleResult;
}

type Granularity = "years" | "months";

const monthNames = [
	"январь",
	"февраль",
	"март",
	"апрель",
	"май",
	"июнь",
	"июль",
	"август",
	"сентябрь",
	"октябрь",
	"ноябрь",
	"декабрь",
];

/** Состав платежей: тело (+ досрочные) и проценты, агрегация по годам или месяцам. */
export function YearlyStructureChart({ schedule }: YearlyStructureChartProps) {
	const [granularity, setGranularity] = useState<Granularity>("years");

	const data = useMemo(() => {
		const byKey = new Map<
			string,
			{ Тело: number; Проценты: number; order: number }
		>();
		for (const row of schedule.rows) {
			const key =
				granularity === "years" ? row.date.slice(0, 4) : row.date.slice(0, 7);
			const acc = byKey.get(key) ?? {
				Тело: 0,
				Проценты: 0,
				order: row.monthIndex,
			};
			acc.Тело += (row.principal + row.extraPaid) / 100;
			acc.Проценты += row.interest / 100;
			byKey.set(key, acc);
		}
		return [...byKey.entries()]
			.sort((a, b) => a[1].order - b[1].order)
			.map(([key, v]) => ({ key, ...v }));
	}, [schedule.rows, granularity]);

	const monthView = granularity === "months";

	if (data.length === 0) return null;

	return (
		<ChartCard
			title="Состав платежей"
			description={
				monthView
					? "По месяцам — удобно на коротких сроках"
					: "Тело кредита (включая досрочные) и проценты по годам"
			}
		>
			<div className="mb-2 flex justify-end">
				<ToggleGroup
					type="single"
					variant="outline"
					size="sm"
					value={granularity}
					aria-label="Период группировки платежей"
					onValueChange={(v) => v && setGranularity(v as Granularity)}
				>
					<ToggleGroupItem value="years" className="h-11">
						По годам
					</ToggleGroupItem>
					<ToggleGroupItem value="months" className="h-11">
						По месяцам
					</ToggleGroupItem>
				</ToggleGroup>
			</div>
			<div className="h-80">
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
						<XAxis
							dataKey="key"
							tick={{ fontSize: 10 }}
							tickLine={false}
							// Прореживаем подписи: ~6 меток на ширину графика, чтобы не слипались
							interval={Math.max(1, Math.ceil(data.length / 6)) - 1}
							tickFormatter={(v: string) =>
								monthView ? `${v.slice(5)}.${v.slice(2, 4)}` : v
							}
						/>
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
							labelFormatter={(label) => {
								const key = String(label ?? "");
								return monthView
									? `${monthNames[Number(key.slice(5, 7)) - 1] ?? ""} ${key.slice(0, 4)}`
									: `${key} год`;
							}}
							contentStyle={{
								background: "var(--popover)",
								border: "1px solid var(--border)",
								borderRadius: 8,
								color: "var(--popover-foreground)",
							}}
						/>
						<Legend />
						{/* Без анимации: при смене маршрута ширина контейнера меняется,
						    и анимация может застыть на промежуточном кадре. */}
						<Bar
							dataKey="Тело"
							stackId="a"
							fill="var(--chart-1)"
							isAnimationActive={false}
						/>
						<Bar
							dataKey="Проценты"
							stackId="a"
							fill="var(--chart-2)"
							radius={[4, 4, 0, 0]}
							isAnimationActive={false}
						/>
					</BarChart>
				</ResponsiveContainer>
			</div>
		</ChartCard>
	);
}
