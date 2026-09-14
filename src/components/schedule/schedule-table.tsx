import { cn } from "cn";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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

/** Строк на странице: по одному году. */
const PAGE_SIZE = 12;

interface ScheduleTableProps {
	schedule: ScheduleResult;
	/** Колбэк кнопки «XLSX» — экспорт требует исходных параметров кредита. */
	onExportXlsx?: () => void;
}

export function ScheduleTable({ schedule, onExportXlsx }: ScheduleTableProps) {
	const [page, setPage] = useState(0);

	const pageCount = Math.max(1, Math.ceil(schedule.rows.length / PAGE_SIZE));
	const safePage = Math.min(page, pageCount - 1);
	const rows = useMemo(
		() => schedule.rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
		[schedule.rows, safePage],
	);

	if (schedule.rows.length === 0) {
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

	const firstMonth = schedule.rows[safePage * PAGE_SIZE];
	const lastMonth =
		schedule.rows[
			Math.min((safePage + 1) * PAGE_SIZE, schedule.rows.length) - 1
		];

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="text-lg font-semibold tracking-tight">
					График платежей
					<span className="ml-2 text-sm font-normal text-muted-foreground">
						{firstMonth && lastMonth
							? `${formatMonthYear(firstMonth.date)} — ${formatMonthYear(lastMonth.date)}`
							: ""}
					</span>
				</h2>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={onExportXlsx}
						disabled={!onExportXlsx}
					>
						<Download /> XLSX
					</Button>
					<Button
						variant="outline"
						size="icon"
						onClick={() => setPage(Math.max(0, safePage - 1))}
						disabled={safePage === 0}
						aria-label="Предыдущий год"
					>
						<ChevronLeft />
					</Button>
					<Select
						value={String(safePage)}
						onValueChange={(v) => setPage(Number(v))}
					>
						<SelectTrigger className="w-44" aria-label="Год графика">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{Array.from({ length: pageCount }, (_, i) => {
								const from = schedule.rows[i * PAGE_SIZE];
								if (!from) return null;
								return (
									<SelectItem key={from.monthIndex} value={String(i)}>
										{Math.floor(from.monthIndex / 12) + 1}-й год —{" "}
										{formatMonthYear(from.date)}
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>
					<Button
						variant="outline"
						size="icon"
						onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
						disabled={safePage >= pageCount - 1}
						aria-label="Следующий год"
					>
						<ChevronRight />
					</Button>
				</div>
			</div>

			<div className="overflow-x-auto rounded-lg border">
				<Table>
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
						{rows.map((row) => (
							<TableRow
								key={row.monthIndex}
								className={cn(
									row.extraPaid > 0 &&
										"bg-emerald-500/8 hover:bg-emerald-500/12",
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
											className="ml-2 border-emerald-600/40 text-emerald-700 dark:text-emerald-400"
										>
											досрочно
										</Badge>
									)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatRubPrecise(row.payment)}
								</TableCell>
								<TableCell className="text-right tabular-nums text-muted-foreground">
									{formatRubPrecise(row.interest)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatRubPrecise(row.principal)}
								</TableCell>
								<TableCell className="text-right tabular-nums text-emerald-700 tabular-nums dark:text-emerald-400">
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
								{formatRubPrecise(schedule.totalPaid - schedule.totalExtraPaid)}
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
				Зелёным выделены месяцы с досрочными платежами. Суммы — с точностью до
				копейки.
			</p>
		</div>
	);
}
