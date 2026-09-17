import { cn } from "cn";
import { Landmark } from "lucide-react";
import { Link, useLocation } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface NavLinkItem {
	label: string;
	/** Куда ведёт ссылка. */
	to: string;
	/** Активна ли ссылка в текущем расположении. */
	isActive: (pathname: string) => boolean;
}

const LINKS: NavLinkItem[] = [
	{
		label: "Калькулятор",
		to: "/calculator",
		isActive: (p) => p === "/calculator",
	},
	{
		label: "Графики",
		to: "/charts",
		isActive: (p) => p === "/charts",
	},
	{
		label: "Отчёт",
		to: "/report",
		isActive: (p) => p === "/report",
	},
	{
		label: "О нас",
		to: "/about",
		isActive: (p) => p === "/about",
	},
];

/**
 * Pill-навбар: скруглённая панель по центру верхней части страницы —
 * полупрозрачный фон, blur, тонкая рамка, мягкая тень. Живёт в потоке
 * страницы: при прокрутке уезжает вместе с контентом, а не следует
 * за экраном. Средние ссылки скрыты ниже md; на печати не выводится.
 */
export function FloatingNavbar() {
	const { pathname } = useLocation();

	return (
		// Накладывается поверх верха страницы (absolute, не fixed): контент начинается
		// под панелью, при прокрутке уезжает вместе со страницей.
		<div className="pointer-events-none absolute inset-x-0 top-4 z-40 flex justify-center px-4 print:hidden">
			<nav
				aria-label="Основная навигация"
				className="pointer-events-auto flex items-center gap-1 rounded-full border border-border/70 bg-background/70 py-1.5 pr-1.5 pl-2 shadow-lg shadow-black/5 backdrop-blur-md"
			>
				<Link
					to="/"
					className="flex items-center gap-2 rounded-full pr-1 transition-opacity hover:opacity-80"
					aria-label="Ипотека — на главную"
				>
					<span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
						<Landmark className="size-4" />
					</span>
					<span className="hidden text-sm font-semibold tracking-tight sm:block">
						Ипотека
					</span>
				</Link>

				<span aria-hidden className="mx-1 h-5 w-px bg-border" />

				<div className="hidden items-center gap-1 md:flex">
					{LINKS.map((link) => {
						const active = link.isActive(pathname);
						return (
							<Link
								key={link.label}
								to={link.to}
								aria-current={active ? "page" : undefined}
								className={cn(
									"rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
									active
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
								)}
							>
								{link.label}
							</Link>
						);
					})}
				</div>

				<Button
					size="sm"
					className="ml-1 rounded-full"
					onClick={() =>
						toast.info("Аккаунты не поддерживаются", {
							description: "Все расчёты выполняются локально в вашем браузере",
						})
					}
				>
					Вход
				</Button>
			</nav>
		</div>
	);
}
