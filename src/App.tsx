import { cn } from "cn";
import { Link, NavLink, Outlet } from "react-router";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App() {
	return (
		<ThemeProvider>
			<TooltipProvider>
				<div className="flex min-h-screen flex-col bg-background text-foreground">
					<header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur print:hidden">
						<div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
							<Link to="/" className="text-base font-semibold tracking-tight">
								Ипотечный калькулятор
							</Link>
							<div className="flex items-center gap-1">
								<NavLink to="/calculator">
									{({ isActive }) => (
										<Button
											variant="ghost"
											size="sm"
											className={cn(
												isActive && "bg-accent text-accent-foreground",
											)}
										>
											Калькулятор
										</Button>
									)}
								</NavLink>
								<NavLink to="/report">
									{({ isActive }) => (
										<Button
											variant="ghost"
											size="sm"
											className={cn(
												isActive && "bg-accent text-accent-foreground",
											)}
										>
											Отчёт для печати
										</Button>
									)}
								</NavLink>
								<ThemeToggle />
							</div>
						</div>
					</header>
					<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 print:max-w-none print:p-0">
						<Outlet />
					</main>
				</div>
				<Toaster />
			</TooltipProvider>
		</ThemeProvider>
	);
}
