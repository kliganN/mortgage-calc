import { Plus, X } from "lucide-react";
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
import { Button } from "@/components/ui/button";
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
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { buildSchedule, compareSchedules, type LoanInput } from "@/lib/calc";
import { formatRub, formatTerm } from "@/lib/format";
import { scenarioLabel } from "@/lib/scenario-label";
import { useCompareStore } from "@/store/compare";

const LINE_COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
];

interface CompareViewProps {
	currentInput: LoanInput;
}

/** Сравнение текущего сценария с добавленными снимками (до 3). */
export function CompareView({ currentInput }: CompareViewProps) {
	const { scenarios, add, remove, clear } = useCompareStore();

	const all = useMemo(
		() => [
			{ id: "current", label: "Текущий", input: currentInput },
			...scenarios,
		],
		[currentInput, scenarios],
	);

	const schedules = useMemo(
		() => all.map((s) => ({ ...s, schedule: buildSchedule(s.input) })),
		[all],
	);

	const chartData = useMemo(() => {
		const maxLen = Math.max(...schedules.map((s) => s.schedule.rows.length));
		return Array.from({ length: maxLen }, (_, i) => {
			const point: Record<string, number> = { month: i + 1 };
			for (const s of schedules) {
				const row = s.schedule.rows[i];
				point[s.id] = row ? row.remaining / 100 : 0;
			}
			return point;
		});
	}, [schedules]);

	const baseline = schedules[0];
	if (!baseline) return null;

	if (scenarios.length === 0) {
		return (
			<Card>
				<CardHeader className="pb-3">
					<CardTitle>Сравнение сценариев</CardTitle>
					<CardDescription>
						Добавьте снимок текущих параметров, затем поменяйте условия — и
						сравните до трёх сценариев рядом.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						variant="outline"
						size="sm"
						onClick={() => add(scenarioLabel(currentInput), currentInput)}
					>
						<Plus /> Добавить текущий сценарий
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="flex-row items-start justify-between space-y-0">
				<div className="space-y-1.5">
					<CardTitle>Сравнение сценариев</CardTitle>
					<CardDescription>
						Экономия считается относительно текущего сценария
					</CardDescription>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={scenarios.length >= 3}
						onClick={() => add(scenarioLabel(currentInput), currentInput)}
					>
						<Plus /> Добавить
					</Button>
					<Button variant="ghost" size="sm" onClick={clear}>
						Очистить
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="overflow-x-auto rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-44">Метрика</TableHead>
								{schedules.map((s, i) => (
									<TableHead key={s.id}>
										<div className="flex items-center gap-1">
											<span
												className="inline-block size-2 rounded-full"
												style={{
													background: LINE_COLORS[i % LINE_COLORS.length],
												}}
											/>
											{s.label}
											{s.id !== "current" && (
												<button
													type="button"
													onClick={() => remove(s.id)}
													aria-label={`Убрать сценарий ${s.label}`}
													className="ml-1 text-muted-foreground hover:text-destructive"
												>
													<X className="size-3.5" />
												</button>
											)}
										</div>
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							<MetricRow
								ids={schedules.map((s) => s.id)}
								label="Ежемесячный платёж"
								values={schedules.map((s) =>
									formatRub(s.schedule.currentPayment),
								)}
							/>
							<MetricRow
								ids={schedules.map((s) => s.id)}
								label="Срок"
								values={schedules.map((s) =>
									formatTerm(s.schedule.effectiveTermMonths),
								)}
							/>
							<MetricRow
								ids={schedules.map((s) => s.id)}
								label="Переплата (проценты)"
								values={schedules.map((s) =>
									formatRub(s.schedule.totalInterest),
								)}
							/>
							<MetricRow
								ids={schedules.map((s) => s.id)}
								label="Общая выплата"
								values={schedules.map((s) => formatRub(s.schedule.totalPaid))}
							/>
							<MetricRow
								ids={schedules.map((s) => s.id)}
								label="Экономия против текущего"
								values={schedules.map((s) => {
									if (s.id === "current") return "—";
									const cmp = compareSchedules(baseline.schedule, s.schedule);
									const parts: string[] = [];
									if (cmp.interestSaved !== 0)
										parts.push(
											`${cmp.interestSaved > 0 ? "−" : "+"}${formatRub(Math.abs(cmp.interestSaved))} процентов`,
										);
									if (cmp.monthsSaved !== 0)
										parts.push(
											`${cmp.monthsSaved > 0 ? "−" : "+"}${Math.abs(cmp.monthsSaved)} мес.`,
										);
									return parts.join(", ") || "равно";
								})}
								emphasize
							/>
						</TableBody>
					</Table>
				</div>

				<div>
					<p className="mb-2 text-sm font-medium">Остаток долга по сценариям</p>
					<div className="h-64">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart
								data={chartData}
								margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
							>
								<CartesianGrid
									stroke="var(--border)"
									strokeDasharray="4 4"
									vertical={false}
								/>
								<XAxis
									dataKey="month"
									tick={{ fontSize: 11 }}
									tickLine={false}
									tickFormatter={(v: number) => `${Math.floor((v - 1) / 12)}`}
								/>
								<YAxis
									tick={{ fontSize: 11 }}
									tickLine={false}
									axisLine={false}
									tickFormatter={(v: number) =>
										`${Math.round(v / 1_000_000)} млн`
									}
									width={52}
								/>
								<Tooltip
									labelFormatter={(label) => `Месяц ${label}`}
									formatter={(value) => formatRub(Number(value) * 100)}
									contentStyle={{
										background: "var(--popover)",
										border: "1px solid var(--border)",
										borderRadius: 8,
										color: "var(--popover-foreground)",
									}}
								/>
								{schedules.map((s, i) => (
									<Line
										key={s.id}
										type="monotone"
										dataKey={s.id}
										name={s.label}
										stroke={LINE_COLORS[i % LINE_COLORS.length]}
										strokeWidth={2}
										dot={false}
									/>
								))}
							</LineChart>
						</ResponsiveContainer>
					</div>
					<p className="mt-1 text-xs text-muted-foreground">
						Ось X — годы с начала кредита
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

function MetricRow({
	label,
	ids,
	values,
	emphasize = false,
}: {
	label: string;
	ids: string[];
	values: string[];
	emphasize?: boolean;
}) {
	return (
		<TableRow>
			<TableCell
				className={emphasize ? "font-medium" : "text-muted-foreground"}
			>
				{label}
			</TableCell>
			{values.map((v, i) => (
				<TableCell
					key={ids[i]}
					className={emphasize ? "font-medium tabular-nums" : "tabular-nums"}
				>
					{v}
				</TableCell>
			))}
		</TableRow>
	);
}
