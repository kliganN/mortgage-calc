import { Link } from "react-router";
import type { ScheduleResult } from "@/lib/calc";
import { formatRub, formatTerm } from "@/lib/format";
import {
	LANDING_EXTRA_LOAN,
	LANDING_EXTRA_SCHEDULE,
	LANDING_LOAN,
	LANDING_SCHEDULE,
} from "@/lib/landing-demo";
import { encodeLoanInput } from "@/lib/url";

/** Линии показывают фактический остаток из того же помесячного графика, что и калькулятор. */
function balancePath(schedule: ScheduleResult): string {
	return [
		"M 12 12",
		...schedule.rows.map((row) => {
			const x = 12 + (row.monthIndex / LANDING_LOAN.termMonths) * 576;
			const y = 12 + (1 - row.remaining / schedule.loanAmount) * 216;
			return `L ${x.toFixed(2)} ${y.toFixed(2)}`;
		}),
	].join(" ");
}

const exampleUrl = `/calculator?s=${encodeLoanInput(LANDING_EXTRA_LOAN)}`;

export function EarlyPaymentExample() {
	const monthsSaved =
		LANDING_SCHEDULE.effectiveTermMonths -
		LANDING_EXTRA_SCHEDULE.effectiveTermMonths;
	const interestSaved =
		LANDING_SCHEDULE.totalInterest - LANDING_EXTRA_SCHEDULE.totalInterest;
	return (
		<section className="landing-early" aria-labelledby="early-title">
			<div className="landing-early-copy">
				<h2 id="early-title">Досрочный платёж меняет весь график.</h2>
				<p className="landing-section-lead">
					Добавим к тому же кредиту{" "}
					{formatRub(LANDING_EXTRA_LOAN.recurringExtra.amount * 100)} в месяц с
					первого платежа и сократим срок.
				</p>
				<p className="landing-saved">
					<span>На {formatTerm(monthsSaved)}</span>
					раньше без ипотеки
				</p>
				<dl className="landing-saving-detail">
					<dt>Меньше процентов в этом примере</dt>
					<dd>{formatRub(interestSaved)}</dd>
				</dl>
				<Link to={exampleUrl} className="landing-text-link">
					Открыть этот пример в калькуляторе
				</Link>
			</div>
			<figure className="landing-balance">
				<figcaption>Как уменьшается долг</figcaption>
				<div className="landing-chart-legend">
					<span className="landing-legend-base">Без досрочки</span>
					<span className="landing-legend-extra">С досрочкой</span>
				</div>
				<svg
					viewBox="0 0 600 240"
					width="600"
					height="240"
					role="img"
					aria-labelledby="balance-title balance-description"
				>
					<title id="balance-title">Остаток ипотечного долга</title>
					<desc id="balance-description">
						Без досрочки: {formatTerm(LANDING_SCHEDULE.effectiveTermMonths)}. С
						досрочкой: {formatTerm(LANDING_EXTRA_SCHEDULE.effectiveTermMonths)}.
					</desc>
					<path
						className="landing-chart-grid"
						d="M 12 12 H 588 M 12 120 H 588 M 12 228 H 588"
					/>
					<path
						className="landing-chart-base"
						d={balancePath(LANDING_SCHEDULE)}
					/>
					<path
						className="landing-chart-extra"
						d={balancePath(LANDING_EXTRA_SCHEDULE)}
					/>
				</svg>
				<div className="landing-chart-axis" aria-hidden="true">
					<span>Первый платёж</span>
					<span>10 лет</span>
					<span>20 лет</span>
				</div>
				<dl className="landing-term-compare">
					<div>
						<dt>Без досрочки</dt>
						<dd>{formatTerm(LANDING_SCHEDULE.effectiveTermMonths)}</dd>
					</div>
					<div>
						<dt>С досрочкой</dt>
						<dd>{formatTerm(LANDING_EXTRA_SCHEDULE.effectiveTermMonths)}</dd>
					</div>
				</dl>
			</figure>
		</section>
	);
}
