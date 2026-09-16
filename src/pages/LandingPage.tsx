import { ArrowRight, FileText } from "lucide-react";
import { Link, Navigate } from "react-router";
import { Button } from "@/components/ui/button";

const BANKS = ["Сбербанк", "ВТБ", "Альфа-Банк", "ДОМ.РФ"];

/**
 * Посадочная страница с hero-секцией.
 * Старые ссылки-шаринга вели на корень — переносим параметр ?s= на калькулятор.
 */
export default function LandingPage() {
	const shared = new URLSearchParams(globalThis.location.search).get("s");
	if (shared) {
		return (
			<Navigate to={`/calculator?s=${encodeURIComponent(shared)}`} replace />
		);
	}

	return (
		<section className="relative overflow-hidden">
			<div
				aria-hidden
				className="pointer-events-none absolute top-[-160px] left-1/2 h-[420px] w-[720px] max-w-full -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
			/>
			<div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:py-32 lg:py-40">
				<Link
					to="/calculator"
					className="group inline-flex items-center gap-2 rounded-full border bg-primary/5 px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
				>
					Досрочные платежи, сравнение сценариев и экспорт — уже внутри
					<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
				</Link>

				<h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
					Ипотека — <span className="text-primary">прозрачно</span>
				</h1>

				<p className="mt-5 max-w-2xl text-lg text-muted-foreground">
					Аннуитетные и дифференцированные платежи, досрочные погашения со
					снижением срока или платежа — с точностью до копейки, как в банковском
					графике. Все расчёты выполняются прямо в браузере.
				</p>

				<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
					<Button size="lg" asChild>
						<Link to="/calculator">
							Рассчитать ипотеку
							<ArrowRight />
						</Link>
					</Button>
					<Button size="lg" variant="ghost" asChild>
						<Link to="/report">
							<FileText />
							Отчёт для печати
						</Link>
					</Button>
				</div>

				<div className="mt-16 w-full sm:mt-20">
					<p className="text-xs font-medium tracking-widest text-muted-foreground/70 uppercase">
						Заточен под ипотеку российских банков
					</p>
					<div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
						{BANKS.map((bank) => (
							<span
								key={bank}
								className="text-base font-semibold text-muted-foreground/60 transition-colors hover:text-muted-foreground"
							>
								{bank}
							</span>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
