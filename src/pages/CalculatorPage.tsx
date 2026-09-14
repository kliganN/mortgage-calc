import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { LoanForm } from "@/components/calculator/loan-form";
import { SummaryCards } from "@/components/calculator/summary-cards";
import { BalanceChart } from "@/components/charts/balance-chart";
import { PayoutPieChart } from "@/components/charts/payout-pie-chart";
import { YearlyStructureChart } from "@/components/charts/yearly-structure-chart";
import { CompareView } from "@/components/compare/compare-view";
import { HistoryPanel } from "@/components/history/history-panel";
import { EarlyPaymentsEditor } from "@/components/schedule/early-payments-editor";
import { ScheduleTable } from "@/components/schedule/schedule-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildSchedule, validateLoanInput } from "@/lib/calc";
import { exportScheduleToXlsx } from "@/lib/export/xlsx";
import { decodeLoanInput } from "@/lib/url";
import { useLoanStore } from "@/store/loan";

export default function CalculatorPage() {
	const input = useLoanStore((s) => s.input);
	const patch = useLoanStore((s) => s.patch);

	// Восстановление расчёта из ссылки-шаринга (?s=…) — один раз при открытии.
	useEffect(() => {
		const restored = decodeLoanInput(
			new URLSearchParams(globalThis.location.search).get("s"),
		);
		if (restored) patch(restored);
	}, [patch]);

	const issues = useMemo(() => {
		const map = new Map<string, string>();
		for (const issue of validateLoanInput(input)) {
			if (!map.has(issue.field)) map.set(issue.field, issue.message);
		}
		return map;
	}, [input]);

	const schedule = useMemo(() => buildSchedule(input), [input]);

	return (
		<div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
			<div className="min-w-0 space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Параметры кредита</CardTitle>
					</CardHeader>
					<CardContent>
						<LoanForm issues={issues} />
					</CardContent>
				</Card>
				<HistoryPanel />
			</div>

			<div className="min-w-0 space-y-6">
				{issues.size > 0 && (
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
				)}

				<SummaryCards schedule={schedule} />

				<EarlyPaymentsEditor />

				<Tabs defaultValue="schedule">
					<TabsList>
						<TabsTrigger value="schedule">График платежей</TabsTrigger>
						<TabsTrigger value="charts">Графики</TabsTrigger>
					</TabsList>
					<TabsContent value="schedule" className="mt-4">
						<ScheduleTable
							schedule={schedule}
							onExportXlsx={() =>
								exportScheduleToXlsx(input, schedule).then(() =>
									toast.success("Файл XLSX скачан"),
								)
							}
						/>
					</TabsContent>
					<TabsContent value="charts" className="mt-4 space-y-4">
						<BalanceChart schedule={schedule} />
						<div className="grid gap-4 xl:grid-cols-2">
							<YearlyStructureChart schedule={schedule} />
							<PayoutPieChart schedule={schedule} />
						</div>
					</TabsContent>
				</Tabs>

				<CompareView currentInput={input} />
			</div>
		</div>
	);
}
