import { cn } from "cn";
import { Calculator, CircleHelp, FileText, Landmark } from "lucide-react";
import { Link, useLocation } from "react-router";

const LINKS = [
	{ to: "/calculator", label: "Расчёт", icon: Calculator },
	{ to: "/report", label: "Отчёт", icon: FileText },
	{ to: "/about", label: "Помощь", icon: CircleHelp },
];

/** Постоянная навигация с одинаковыми возможностями на телефоне и компьютере. */
export function FloatingNavbar() {
	const { pathname } = useLocation();
	return (
		<header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-md print:hidden">
			<div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2 px-4 py-2.5 sm:px-8">
				<Link
					to="/calculator"
					className="flex min-h-11 items-center gap-2.5 rounded-lg font-semibold tracking-tight"
					aria-label="Ипотека — калькулятор"
				>
					<span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
						<Landmark className="size-5" aria-hidden />
					</span>
					<span className="hidden sm:inline">
						Ипотека
						<span className="font-normal text-muted-foreground">
							{" "}
							/ прозрачно
						</span>
					</span>
				</Link>
				<nav
					aria-label="Основная навигация"
					className="flex items-center gap-1"
				>
					{LINKS.map(({ to, label, icon: Icon }) => {
						const active =
							pathname === to ||
							(to === "/calculator" &&
								(pathname === "/" || pathname === "/charts"));
						return (
							<Link
								key={to}
								to={to}
								aria-current={active ? "page" : undefined}
								className={cn(
									"flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors sm:px-4",
									active
										? "bg-secondary text-secondary-foreground"
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
								)}
							>
								<Icon className="hidden size-4 sm:block" aria-hidden />
								{label}
							</Link>
						);
					})}
				</nav>
			</div>
		</header>
	);
}
