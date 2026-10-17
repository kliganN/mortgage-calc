import { ChevronDown, Download, FileText, Link2, Save } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import { toast } from "sonner";
import { LoanForm } from "@/components/calculator/loan-form";
import { SummaryCards } from "@/components/calculator/summary-cards";
import { DebtOverview } from "@/components/charts/debt-overview";
import { PayoutPieChart } from "@/components/charts/payout-pie-chart";
import { YearlyStructureChart } from "@/components/charts/yearly-structure-chart";
import { HistoryPanel } from "@/components/history/history-panel";
import { EarlyPaymentsEditor } from "@/components/schedule/early-payments-editor";
import { ScheduleExplorer } from "@/components/schedule/schedule-explorer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildSchedule, validateLoanInput } from "@/lib/calc";
import { exportScheduleToXlsx } from "@/lib/export/xlsx";
import { formatRub } from "@/lib/format";
import { scenarioLabel } from "@/lib/scenario-label";
import { buildShareUrl, decodeLoanInput, encodeLoanInput } from "@/lib/url";
import { useHistoryStore } from "@/store/history";
import { useLoanStore } from "@/store/loan";

const CompareView = lazy(() =>
	import("@/components/compare/compare-view").then((module) => ({
		default: module.CompareView,
	})),
);

/** Параметры, результат и аналитика остаются вместе при редактировании кредита. */
export default function CalculatorPage() {
	const input = useLoanStore((s) => s.input);
	const patch = useLoanStore((s) => s.patch);
	const save = useHistoryStore((s) => s.save);
	const { search } = useLocation();
	const [exporting, setExporting] = useState(false);
	const [copying, setCopying] = useState(false);
	const [panel, setPanel] = useState("schedule");
	const [showStructure, setShowStructure] = useState(false);
	const [earlyOpen, setEarlyOpen] = useState(
		input.earlyPayments.length > 0 || Boolean(input.recurringExtra?.amount),
	);
	const shared = new URLSearchParams(search).get("s");
	const restored = useMemo(() => decodeLoanInput(shared), [shared]);
	const invalidLink = shared !== null && restored === null;
	useEffect(() => {
		if (restored) {
			patch(restored);
			setEarlyOpen(
				restored.earlyPayments.length > 0 ||
					Boolean(restored.recurringExtra?.amount),
			);
		}
	}, [restored, patch]);

	const issues = useMemo(
		() =>
			new Map(
				validateLoanInput(input).map((issue) => [issue.field, issue.message]),
			),
		[input],
	);
	const valid = issues.size === 0;
	const baselineInput = useMemo(
		() => ({ ...input, earlyPayments: [], recurringExtra: null }),
		[input],
	);
	const baseline = useMemo(
		() => (valid ? buildSchedule(baselineInput) : null),
		[baselineInput, valid],
	);
	// Не показываем частичный расчёт при ошибках в форме или досрочных платежах.
	const schedule = useMemo(
		() => (valid ? buildSchedule(input) : null),
		[input, valid],
	);

	const copyLink = async () => {
		setCopying(true);
		let timeout: ReturnType<typeof setTimeout> | undefined;
		try {
			await Promise.race([
				navigator.clipboard.writeText(buildShareUrl(input)),
				new Promise<never>((_, reject) => {
					timeout = setTimeout(
						() => reject(new Error("Буфер обмена недоступен")),
						3000,
					);
				}),
			]);
			toast.success("Ссылка на расчёт скопирована");
		} catch {
			toast.error("Выделите ссылку и скопируйте её вручную.");
		} finally {
			clearTimeout(timeout);
			setCopying(false);
		}
	};
	const exportXlsx = async () => {
		if (!schedule || exporting) return;
		setExporting(true);
		try {
			await exportScheduleToXlsx(input, schedule);
			toast.success("График XLSX скачан");
		} catch {
			toast.error("Не удалось скачать файл. Попробуйте ещё раз.");
		} finally {
			setExporting(false);
		}
	};

	return (
		<div className="flex min-w-0 flex-col gap-6 pb-16 lg:pb-0">
			{schedule && schedule.rows.length > 0 && (
				<a
					href="#analytics"
					className="fixed inset-x-0 bottom-0 z-30 flex min-h-16 items-center justify-between gap-3 border-t bg-card px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg lg:hidden"
				>
					<span className="text-xs text-muted-foreground">
						{input.paymentType === "differentiated"
							? "Первый платёж"
							: "Платёж"}
						<span className="ml-2 text-lg font-semibold text-primary tabular-nums">
							{formatRub(schedule.initialPayment)}
						</span>
					</span>
					<span className="text-sm font-medium text-primary">К графику ↑</span>
				</a>
			)}
			<header className="flex flex-wrap items-end justify-between gap-5">
				<div>
					<p className="mb-2 text-xs font-medium tracking-widest text-muted-foreground uppercase">
						Личный финансовый план
					</p>
					<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
						Ипотечный калькулятор
					</h1>
					<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
						Посмотрите платёж, переплату и эффект досрочного погашения.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="h-11"
						disabled={!valid}
						onClick={() => {
							save(scenarioLabel(input), input);
							toast.success("Расчёт сохранён в истории");
						}}
					>
						<Save data-icon="inline-start" />
						Сохранить
					</Button>
					<Dialog>
						<DialogTrigger asChild>
							<Button variant="outline" className="h-11" disabled={!valid}>
								<Link2 data-icon="inline-start" />
								Поделиться
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Ссылка на расчёт</DialogTitle>
								<DialogDescription>
									Ссылка содержит все условия кредита и досрочные платежи.
									Открыв её, получатель увидит этот расчёт.
								</DialogDescription>
							</DialogHeader>
							<Label htmlFor="share-url">Ссылка</Label>
							<Input
								id="share-url"
								readOnly
								value={buildShareUrl(input)}
								className="h-11"
								onFocus={(event) => event.currentTarget.select()}
							/>
							<Button className="h-11" disabled={copying} onClick={copyLink}>
								{copying ? "Копирование…" : "Скопировать ссылку"}
							</Button>
						</DialogContent>
					</Dialog>
				</div>
			</header>
			{invalidLink && (
				<Alert variant="destructive">
					<AlertTitle>
						Ссылка на расчёт повреждена или не поддерживается
					</AlertTitle>
					<AlertDescription>
						Параметры из ссылки не загружены. Вы можете задать их вручную или
						открыть другую ссылку.
					</AlertDescription>
				</Alert>
			)}
			<div className="lg:hidden">
				{schedule && baseline && (
					<SummaryCards input={input} schedule={schedule} baseline={baseline} />
				)}
			</div>
			<div className="grid min-w-0 items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
				<div className="flex min-w-0 flex-col gap-5">
					<Card>
						<CardHeader>
							<CardTitle>Параметры кредита</CardTitle>
							<CardDescription>
								Результаты обновляются при изменении условий
							</CardDescription>
						</CardHeader>
						<CardContent>
							<LoanForm issues={issues} />
						</CardContent>
					</Card>
					<details
						className="group rounded-2xl border bg-card"
						open={earlyOpen}
						onToggle={(event) => setEarlyOpen(event.currentTarget.open)}
					>
						<summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-medium">
							Досрочное погашение
							<ChevronDown
								className="size-4 transition-transform group-open:rotate-180"
								aria-hidden
							/>
						</summary>
						<div className="p-2 pt-0">
							<EarlyPaymentsEditor issues={issues} />
						</div>
					</details>
				</div>
				<section
					aria-label="Результаты и аналитика"
					className="flex min-w-0 flex-col gap-5"
				>
					{!valid ? (
						<Alert variant="destructive">
							<AlertTitle>Проверьте параметры</AlertTitle>
							<AlertDescription>
								<ul className="list-inside list-disc">
									{[...issues.values()].map((message) => (
										<li key={message}>{message}</li>
									))}
								</ul>
							</AlertDescription>
						</Alert>
					) : (
						schedule &&
						baseline && (
							<>
								<div className="hidden lg:block">
									<SummaryCards
										input={input}
										schedule={schedule}
										baseline={baseline}
									/>
								</div>
								{schedule.rows.length > 0 && (
									<>
										<DebtOverview schedule={schedule} baseline={baseline} />
										<PayoutPieChart schedule={schedule} />
										<details
											className="group rounded-2xl border bg-card"
											onToggle={(e) => setShowStructure(e.currentTarget.open)}
										>
											<summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-medium">
												Состав платежей по годам и месяцам
												<ChevronDown
													className="size-4 transition-transform group-open:rotate-180"
													aria-hidden
												/>
											</summary>
											{showStructure && (
												<div className="p-2 pt-0">
													<YearlyStructureChart schedule={schedule} />
												</div>
											)}
										</details>
									</>
								)}
							</>
						)
					)}
				</section>
			</div>
			{valid && schedule && schedule.rows.length > 0 && (
				<Tabs value={panel} onValueChange={setPanel} className="min-w-0 gap-5">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<TabsList className="h-12">
							<TabsTrigger value="schedule" className="min-h-11 px-4">
								Платежи
							</TabsTrigger>
							<TabsTrigger value="compare" className="min-h-11 px-4">
								Сравнение сценариев
							</TabsTrigger>
						</TabsList>
						<div className="flex flex-wrap gap-2">
							<Button
								variant="outline"
								className="h-11"
								disabled={exporting}
								onClick={exportXlsx}
							>
								<Download data-icon="inline-start" />
								{exporting ? "Подготовка…" : "Скачать Excel"}
							</Button>
							<Button variant="outline" className="h-11" asChild>
								<Link to={`/report?s=${encodeLoanInput(input)}`}>
									<FileText data-icon="inline-start" />
									Печать / PDF
								</Link>
							</Button>
						</div>
					</div>
					<TabsContent value="schedule">
						<ScheduleExplorer schedule={schedule} />
					</TabsContent>
					<TabsContent value="compare">
						<Suspense fallback={<p role="status">Загрузка сравнения…</p>}>
							<CompareView currentInput={input} />
						</Suspense>
					</TabsContent>
				</Tabs>
			)}
			<details className="group rounded-2xl border bg-card">
				<summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-medium">
					История расчётов
					<ChevronDown
						className="size-4 transition-transform group-open:rotate-180"
						aria-hidden
					/>
				</summary>
				<div className="p-2 pt-0">
					<HistoryPanel />
				</div>
			</details>
			<p className="text-xs leading-relaxed text-muted-foreground">
				Предварительный расчёт по постоянной ставке. Страховки, комиссии и
				налоговые вычеты не включены. Даты и суммы в банковском графике могут
				отличаться.
			</p>
		</div>
	);
}
