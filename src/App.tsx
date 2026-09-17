import { Link, Outlet, useLocation } from "react-router";
import { FloatingNavbar } from "@/components/floating-navbar";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
	const { pathname } = useLocation();

	return (
		// overflow-x-clip: мягкое свечение градиента не создаёт горизонтальный скролл
		<div className="relative flex min-h-screen flex-col overflow-x-clip bg-background text-foreground">
			{/* Градиент главной страницы — от самого верха, чтобы навбар был над ним */}
			{pathname === "/" && (
				<div
					aria-hidden
					className="pointer-events-none absolute top-0 left-1/2 z-0 h-[560px] w-[860px] max-w-full -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
				/>
			)}
			<FloatingNavbar />
			{/* pt-20 — воздух под накладным навбаром для контентных страниц */}
			<main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 pt-20 pb-6 print:max-w-none print:p-0">
				<Outlet />
			</main>
			<footer className="pb-8 text-center text-xs text-muted-foreground print:hidden">
				<Link to="/" className="hover:text-foreground">
					Ипотечный калькулятор
				</Link>{" "}
				· расчёты выполняются локально в браузере
			</footer>
			<Toaster />
		</div>
	);
}
