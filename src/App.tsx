import { Link, Outlet } from "react-router";
import { FloatingNavbar } from "@/components/floating-navbar";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
	return (
		<div className="flex min-h-screen flex-col bg-background text-foreground">
			<FloatingNavbar />
			<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 print:max-w-none print:p-0">
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
