import { cn } from "cn";
import { Download } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Brush,
	CartesianGrid,
	Line,
	LineChart,
	ReferenceDot,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { ScheduleResult } from "@/lib/calc";
import { formatDate, formatMonthYear, formatRubPrecise } from "@/lib/format";

interface ScheduleExplorerProps {
	schedule: ScheduleResult;
	onExportXlsx?: () => void;
}

const TOOLTIP_STYLE = {
	background: "var(--popover)",
	border: "1px solid var(--border)",
	borderRadius: 8,
	color: "var(--popover-foreground)",
} as const;

/** Диапазон по умолчанию — первый год графика. */
const DEFAULT_WINDOW = 12;

/**
 * Связанный вид графика платежей: линейный график остатка с brush-ползунком,
 * годовые чипы и таблица показывают общий диапазон; клик по точке графика
 * выбирает месяц (и наоборот), под графиком — состав выбранного платежа.
 */
export function ScheduleExplorer({
	schedule,
	onExportXlsx,
}: ScheduleExplorerProps) {
	const rows = schedule.rows;
	const [range, setRange] = useState<{ start: number; end: number }>({
		start: 0,
		end: Math.min(DEFAULT_WINDOW, rows.length) - 1,
	});
	const [selected, setSelected] = useState<number | null>(null);
	const rowRefs = useRef(new Map<number, HTMLTableRowElement>());

	const data = useMemo(
		() =>
			rows.map((row) => ({
				label: row.date.slice(0, 7),
				Остаток: row.remaining / 100,
				// Отдельная серия: значение только в месяцы с досрочными — рисуется точками.
				Досрочные: row.extraPaid > 0 ? row.remaining / 100 : null,
				monthIndex: row.monthIndex,
			})),
		[rows],
	);

	const years = useMemo(() => {
		const map = new Map<string, { start: number; end: number }>();
		rows.forEach((row, i) => {
			const year = row.date.slice(0, 4);
			const acc = map.get(year);
			if (acc) acc.end = i;
			else map.set(year, { start: i, end: i });
		});
		return [...map.entries()];
	}, [rows]);

	const visibleRows = useMemo(() => {
		const start = Math.max(0, range.start);
		const end = Math.min(rows.length - 1, range.end);
		return rows.slice(start, end + 1);
	}, [rows, range]);

	const selectedRow = useMemo(
		() => rows.find((r) => r.monthIndex === selected) ?? visibleRows[0] ?? null,
		[rows, selected, visibleRows],
	);

	// Выбор через график: строка может быть вне видимого диапазона таблицы — доскролливаем.
	useEffect(() => {
		if (selected === null) return;
		const el = rowRefs.current.get(selected);
		el?.scrollIntoView({ block: "nearest" });
	}, [selected]);

	if (rows.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">🏠</EmptyMedia>
					<EmptyTitle>Графика платежей нет</EmptyTitle>
					<EmptyDescription>
						Сумма кредита равна нулю: проверьте стоимость жилья и первоначальный
						взнос.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	const setWindow = (start: number, end: number) => {
		setRange({ start, end });
		setSelected(null);
	};

	const periodLabel = `${formatMonthYear(rows[0].date)} — ${formatMonthYear(rows[rows.length - 1].date)}`;
	const selectedTotal = selectedRow
		? selectedRow.payment + selectedRow.extraPaid
		: 0;
	const parts = selectedRow
		? [
				{
					key: "principal",
					label: "Тело",
					value: selectedRow.principal,
					color: "var(--chart-1)",
				},
				{
					key: "interest",
					label: "Проценты",
					value: selectedRow.interest,
					color: "var(--chart-2)",
				},
				...(selectedRow.extraPaid > 0
					? [
							{
								key: "extra",
								label: "Досрочно",
								value: selectedRow.extraPaid,
								color: "var(--chart-4)",
							},
						]
					: []),
			]
		: [];

	return (
		<Card>
			<CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
				<div className="space-y-1.5">
					<CardTitle>График платежей</CardTitle>
					<CardDescription>
						{periodLabel} · клик по графику или строке выбирает месяц
					</CardDescription>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={onExportXlsx}
					disabled={!onExportXlsx}
				>
					<Download /> XLSX
				</Button>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="h-64">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart
							data={data}
							margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
							onClick={(state: unknown) => {
								const i = (state as { activeTooltipIndex?: number } | null)
									?.activeTooltipIndex;
								if (typeof i === "number" && rows[i])
									setSelected(rows[i].monthIndex);
							}}
							style={{ cursor: "pointer" }}
						>
							<CartesianGrid
								stroke="var(--border)"
								strokeDasharray="4 4"
								vertical={false}
							/>
							<XAxis
								dataKey="label"
								interval={Math.max(1, Math.ceil(data.length / 10))}
								tick={{ fontSize: 11 }}
								tickLine={false}
								tickFormatter={(v: string) => {
									const [y, m] = v.split("-");
									return `${m}.${y.slice(2)}`;
								}}
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
								formatter={(value) => formatRubPrecise(Number(value) * 100)}
								labelFormatter={(label) => `Месяц ${label}`}
								contentStyle={TOOLTIP_STYLE}
							/>
							<Line
								type="monotone"
								dataKey="Остаток"
								stroke="var(--chart-1)"
								strokeWidth={2}
								dot={false}
								activeDot={{
									r: 5,
									fill: "var(--chart-1)",
									stroke: "var(--background)",
								}}
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
							{selectedRow && (
								<ReferenceDot
									x={selectedRow.date.slice(0, 7)}
									y={selectedRow.remaining / 100}
									r={7}
									fill="var(--primary)"
									stroke="var(--background)"
									strokeWidth={2}
								/>
							)}
							<Brush
								dataKey="label"
								height={26}
								travellerWidth={10}
								stroke="var(--primary)"
								fill="var(--muted)"
								startIndex={range.start}
								endIndex={range.end}
								onChange={(s: unknown) => {
									const r = s as {
										startIndex?: number;
										endIndex?: number;
									} | null;
									if (
										typeof r?.startIndex === "number" &&
										typeof r?.endIndex === "number"
									) {
										setRange({ start: r.startIndex, end: r.endIndex });
									}
								}}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>

				{selectedRow && (
					<div className="space-y-2 rounded-lg border bg-muted/40 p-3">
						<div className="flex flex-wrap items-baseline justify-between gap-2">
							<p className="text-sm font-medium">
								{formatMonthYear(selectedRow.date)}
								{selectedRow.extraPaid > 0 && (
									<Badge
										variant="outline"
										className="ml-2 border-chart-4/40 text-chart-4"
									>
										с досрочным
									</Badge>
								)}
							</p>
							<p className="text-sm tabular-nums">
								<span className="font-semibold">
									{formatRubPrecise(selectedTotal)}
								</span>
								<span className="text-muted-foreground">
									{" "}
									· остаток {formatRubPrecise(selectedRow.remaining)}
								</span>
							</p>
						</div>
						<div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
							{parts.map((p) => (
								<div
									key={p.key}
									className="h-full"
									style={{
										width: `${selectedTotal > 0 ? (p.value / selectedTotal) * 100 : 0}%`,
										background: p.color,
									}}
								/>
							))}
						</div>
						<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
							{parts.map((p) => (
								<span key={p.key} className="inline-flex items-center gap-1.5">
									<span
										className="inline-block size-2 rounded-full"
										style={{ background: p.color }}
									/>
									{p.label}: {formatRubPrecise(p.value)}
									{selectedTotal > 0 && (
										<span className="tabular-nums">
											({Math.round((p.value / selectedTotal) * 100)} %)
										</span>
									)}
								</span>
							))}
						</div>
					</div>
				)}

				<div className="flex flex-wrap items-center gap-1.5">
					<Chip
						active={range.start === 0 && range.end === rows.length - 1}
						onClick={() => setWindow(0, rows.length - 1)}
					>
						Всё
					</Chip>
					{years.map(([year, span]) => (
						<Chip
							key={year}
							active={range.start === span.start && range.end === span.end}
							onClick={() => setWindow(span.start, span.end)}
						>
							{year}
						</Chip>
					))}
				</div>

				<div className="sticky-table max-h-96 overflow-auto rounded-lg border">
					<Table className="text-xs [&_[data-slot=table-cell]]:px-1.5 [&_[data-slot=table-head]]:px-1.5">
						<TableHeader>
							<TableRow>
								<TableHead className="w-10 text-right">№</TableHead>
								<TableHead>Дата</TableHead>
								<TableHead className="text-right">Платёж</TableHead>
								<TableHead className="text-right">Проценты</TableHead>
								<TableHead className="text-right">Тело</TableHead>
								<TableHead className="text-right">Досрочно</TableHead>
								<TableHead className="text-right">Остаток</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{visibleRows.map((row) => (
								<TableRow
									key={row.monthIndex}
									ref={(el) => {
										if (el) rowRefs.current.set(row.monthIndex, el);
										else rowRefs.current.delete(row.monthIndex);
									}}
									onClick={() => setSelected(row.monthIndex)}
									className={cn(
										"cursor-pointer",
										row.extraPaid > 0 && "bg-chart-4/8 hover:bg-chart-4/12",
										selected === row.monthIndex &&
											"bg-primary/12 hover:bg-primary/12 [&_[data-slot=table-cell]]:font-medium",
									)}
								>
									<TableCell className="text-right tabular-nums text-muted-foreground">
										{row.monthIndex}
									</TableCell>
									<TableCell className="whitespace-nowrap tabular-nums">
										{formatDate(row.date)}
										{row.extraPaid > 0 && (
											<Badge
												variant="outline"
												className="ml-2 border-chart-4/40 text-chart-4"
											>
												досрочно
											</Badge>
										)}
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{formatRubPrecise(row.payment)}
									</TableCell>
									<TableCell className="text-right tabular-nums text-chart-2">
										{formatRubPrecise(row.interest)}
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{formatRubPrecise(row.principal)}
									</TableCell>
									<TableCell className="text-right tabular-nums font-medium text-chart-4">
										{row.extraPaid > 0 ? formatRubPrecise(row.extraPaid) : ""}
									</TableCell>
									<TableCell className="text-right tabular-nums font-medium">
										{formatRubPrecise(row.remaining)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
						<TableFooter>
							<TableRow>
								<TableCell colSpan={2}>Итого по кредиту</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatRubPrecise(
										schedule.totalPaid - schedule.totalExtraPaid,
									)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatRubPrecise(schedule.totalInterest)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatRubPrecise(
										schedule.loanAmount - schedule.totalExtraPaid,
									)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{schedule.totalExtraPaid > 0
										? formatRubPrecise(schedule.totalExtraPaid)
										: ""}
								</TableCell>
								<TableCell />
							</TableRow>
						</TableFooter>
					</Table>
				</div>
				<p className="text-xs text-muted-foreground">
					Диапазон таблицы управляется ползунком под графиком и чипами годов;
					янтарным выделены месяцы с досрочными платежами. Суммы — с точностью
					до копейки.
				</p>
			</CardContent>
		</Card>
	);
}

function Chip({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"rounded-full border px-3 py-1 text-xs font-medium transition-colors select-none",
				active
					? "border-primary bg-primary text-primary-foreground"
					: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
			)}
			aria-pressed={active}
		>
			{children}
		</button>
	);
}
