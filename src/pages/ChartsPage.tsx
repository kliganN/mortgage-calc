import { useMemo } from "react";
import { PayoutPieChart } from "@/components/charts/payout-pie-chart";
import { YearlyStructureChart } from "@/components/charts/yearly-structure-chart";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { buildSchedule } from "@/lib/calc";
import { useLoanStore } from "@/store/loan";

/**
 * Отдельная страница графиков: диаграммы во всю ширину контента,
 * строятся по текущим параметрам калькулятора (общий стор).
 */
export default function ChartsPage() {
	const input = useLoanStore((s) => s.input);
	const schedule = useMemo(() => buildSchedule(input), [input]);

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Графики</h1>
				<p className="text-sm text-muted-foreground">
					Строятся по текущим параметрам калькулятора — измените их на странице
					«Калькулятор», и диаграммы пересчитаются.
				</p>
			</div>

			{schedule.rows.length === 0 ? (
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">📊</EmptyMedia>
						<EmptyTitle>Пока нечего показывать</EmptyTitle>
						<EmptyDescription>
							Сумма кредита равна нулю — проверьте стоимость жилья и
							первоначальный взнос в калькуляторе.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : (
				<div className="grid gap-4 xl:grid-cols-2">
					<YearlyStructureChart schedule={schedule} />
					<PayoutPieChart schedule={schedule} />
				</div>
			)}
		</div>
	);
}
