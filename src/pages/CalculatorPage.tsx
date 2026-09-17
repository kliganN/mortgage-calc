import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { LoanForm } from "@/components/calculator/loan-form";
import { SummaryCards } from "@/components/calculator/summary-cards";
import { CompareView } from "@/components/compare/compare-view";
import { HistoryPanel } from "@/components/history/history-panel";
import { EarlyPaymentsEditor } from "@/components/schedule/early-payments-editor";
import { ScheduleExplorer } from "@/components/schedule/schedule-explorer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

				<ScheduleExplorer
					schedule={schedule}
					onExportXlsx={() =>
						exportScheduleToXlsx(input, schedule).then(() =>
							toast.success("Файл XLSX скачан"),
						)
					}
				/>

				<CompareView currentInput={input} />
			</div>
		</div>
	);
}
