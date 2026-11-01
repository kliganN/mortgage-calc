import { lazy, StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import App from "./App.tsx";
import ChartsPage from "./pages/ChartsPage.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import "./index.css";

const AboutPage = lazy(() => import("./pages/AboutPage.tsx"));
const CalculatorPage = lazy(() => import("./pages/CalculatorPage.tsx"));
const ReportPage = lazy(() => import("./pages/ReportPage.tsx"));

const root = document.getElementById("root");
if (!root) throw new Error("Не найден #root в index.html");

const application = (
	<StrictMode>
		<BrowserRouter>
			<Routes>
				<Route element={<App />}>
					<Route index element={<LandingPage />} />
					<Route path="calculator" element={<CalculatorPage />} />
					<Route path="charts" element={<ChartsPage />} />
					<Route path="report" element={<ReportPage />} />
					<Route path="about" element={<AboutPage />} />
					<Route path="*" element={<NotFoundPage />} />
				</Route>
			</Routes>
		</BrowserRouter>
	</StrictMode>
);

// На публичных страницах сохраняем готовый HTML до загрузки интерактивности.
// Редиректы и отчёт зависят от URL/текущего расчёта и монтируются отдельно.
const path = window.location.pathname.replace(/\/+$/, "") || "/";
// Готовый HTML главной не содержит редирект персональной ссылки: монтируем его отдельно.
const sharedLanding =
	path === "/" && new URLSearchParams(window.location.search).has("s");
if (
	root.hasAttribute("data-prerender") &&
	!sharedLanding &&
	["/", "/calculator", "/about"].includes(path)
) {
	hydrateRoot(root, application);
} else {
	createRoot(root).render(application);
}
