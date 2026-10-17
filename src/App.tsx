import { Suspense } from "react";
import { Link, Outlet } from "react-router";
import { FloatingNavbar } from "@/components/floating-navbar";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
	return (
		<div className="flex min-h-screen flex-col bg-background text-foreground">
			<a
				href="#main-content"
				className="sr-only fixed top-2 left-2 z-50 rounded-lg bg-card p-3 focus:not-sr-only"
			>
				К содержимому
			</a>
			<FloatingNavbar />
			<main
				id="main-content"
				tabIndex={-1}
				className="mx-auto w-full max-w-[1440px] min-w-0 flex-1 px-4 py-6 outline-none sm:px-8 sm:py-8 print:max-w-none print:p-0"
			>
				<Suspense
					fallback={
						<p
							role="status"
							className="py-12 text-center text-muted-foreground"
						>
							Загрузка…
						</p>
					}
				>
					<Outlet />
				</Suspense>
			</main>
			<footer className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 pt-6 pb-24 text-xs text-muted-foreground sm:px-8 lg:pb-6 print:hidden">
				<span>Расчёты выполняются в вашем браузере</span>
				<Link to="/about" className="rounded py-2 hover:text-foreground">
					О расчёте и хранении данных
				</Link>
			</footer>
			<Toaster />
		</div>
	);
}
