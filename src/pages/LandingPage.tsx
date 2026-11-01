import {
	Check,
	FileSpreadsheet,
	GitCompareArrows,
	ListOrdered,
	ShieldCheck,
} from "lucide-react";
import { Link, Navigate, useLocation } from "react-router";
import { SummaryCards } from "@/components/calculator/summary-cards";
import { EarlyPaymentExample } from "@/components/landing/early-payment-example";
import { formatRate, formatRub, formatTerm } from "@/lib/format";
import { LANDING_LOAN, LANDING_SCHEDULE } from "@/lib/landing-demo";

/** Главная представляет инструмент; старые ссылки открывают свой расчёт напрямую. */
export default function LandingPage() {
	const { search } = useLocation();
	if (new URLSearchParams(search).has("s")) {
		return <Navigate to={`/calculator${search}`} replace />;
	}
	return (
		<div className="landing">
			<section className="landing-hero" aria-labelledby="landing-title">
				<div className="landing-hero-copy">
					<h1 id="landing-title">
						Ваша ипотека.
						<br />В понятных цифрах.
					</h1>
					<p className="landing-lead">
						Платёж, переплата и досрочное погашение. Посчитайте до решения о
						кредите.
					</p>
					<div className="landing-actions">
						<Link to="/calculator" className="landing-button">
							Рассчитать ипотеку
						</Link>
						<a href="#possibilities" className="landing-text-link">
							Что можно посчитать
						</a>
					</div>
					<p className="landing-assurance">
						<Check size={16} aria-hidden="true" /> Без регистрации
						<ShieldCheck size={16} aria-hidden="true" /> Данные в вашем браузере
					</p>
				</div>
				<figure
					className="landing-preview"
					aria-label="Пример ипотечного расчёта"
				>
					<figcaption>
						<span>Пример расчёта</span>
						<span>Аннуитетный платёж</span>
					</figcaption>
					<div className="landing-summary">
						<SummaryCards
							input={LANDING_LOAN}
							schedule={LANDING_SCHEDULE}
							baseline={LANDING_SCHEDULE}
						/>
					</div>
					<dl className="landing-conditions">
						<div>
							<dt>Стоимость жилья</dt>
							<dd>{formatRub(LANDING_LOAN.propertyPrice * 100)}</dd>
						</div>
						<div>
							<dt>Первый взнос</dt>
							<dd>{formatRub(LANDING_LOAN.downPayment * 100)}</dd>
						</div>
						<div>
							<dt>Ставка и срок</dt>
							<dd>
								{formatRate(LANDING_LOAN.annualRate)},{" "}
								{formatTerm(LANDING_LOAN.termMonths)}
							</dd>
						</div>
					</dl>
					<p className="landing-sample-note">
						Условия для примера, не предложение банка.
					</p>
				</figure>
			</section>
			<EarlyPaymentExample />
			<section
				id="possibilities"
				className="landing-capabilities"
				aria-labelledby="possibilities-title"
			>
				<div className="landing-section-heading">
					<h2 id="possibilities-title">От первого платежа до последнего.</h2>
					<p className="landing-section-lead">
						Все детали, из которых складывается ваша ипотека.
					</p>
				</div>
				<dl className="landing-features">
					<div>
						<ListOrdered size={24} strokeWidth={1.5} aria-hidden="true" />
						<dt>Каждый месяц на виду</dt>
						<dd>
							Основной долг, проценты и остаток в подробном графике платежей.
						</dd>
					</div>
					<div>
						<GitCompareArrows size={24} strokeWidth={1.5} aria-hidden="true" />
						<dt>Срок или платёж?</dt>
						<dd>
							Сравните стратегии досрочного погашения и сохраните разные
							сценарии.
						</dd>
					</div>
					<div>
						<FileSpreadsheet size={24} strokeWidth={1.5} aria-hidden="true" />
						<dt>Расчёт можно забрать</dt>
						<dd>
							Скачайте график в Excel, распечатайте отчёт или поделитесь
							ссылкой.
						</dd>
					</div>
				</dl>
			</section>
			<section className="landing-close" aria-labelledby="privacy-title">
				<div>
					<ShieldCheck size={28} strokeWidth={1.5} aria-hidden="true" />
					<h2 id="privacy-title">Ваши планы остаются у вас.</h2>
					<p className="landing-section-lead">
						Без аккаунта и заявки в банк. Расчёты и сохранённые сценарии
						хранятся в этом браузере.
					</p>
				</div>
				<div className="landing-close-action">
					<Link to="/calculator" className="landing-button">
						Рассчитать ипотеку
					</Link>
					<Link to="/about" className="landing-text-link">
						О методике и хранении данных
					</Link>
				</div>
			</section>
			<p className="landing-disclaimer">
				Предварительный расчёт по постоянной ставке. Страховки, комиссии и
				налоговые вычеты не включены. Даты и суммы в банковском графике могут
				отличаться.
			</p>
		</div>
	);
}
