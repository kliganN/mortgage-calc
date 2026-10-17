import { renderToString } from "react-dom/server";
import { Route, Routes, StaticRouter } from "react-router";
import App from "./App";
import { normalizeSiteUrl } from "./lib/seo";
import AboutPage from "./pages/AboutPage";
import CalculatorPage from "./pages/CalculatorPage";
import NotFoundPage from "./pages/NotFoundPage";
import ReportPage from "./pages/ReportPage";

export { getSeo, renderSeoHead, renderSitemap } from "./lib/seo";
export const siteUrl = normalizeSiteUrl(import.meta.env.VITE_SITE_URL);

/** Готовый HTML тех же компонентов: без отдельной версии контента для роботов. */
export function render(path: string): string {
	const html = renderToString(
		<StaticRouter location={path}>
			<Routes>
				<Route element={<App />}>
					<Route index element={<CalculatorPage />} />
					<Route path="calculator" element={<CalculatorPage />} />
					<Route path="charts" element={<CalculatorPage />} />
					<Route path="about" element={<AboutPage />} />
					<Route path="report" element={<ReportPage />} />
					<Route path="*" element={<NotFoundPage />} />
				</Route>
			</Routes>
		</StaticRouter>,
	);
	if (html.includes("Switched to client rendering"))
		throw new Error(`Пререндер ${path} завершился ошибкой`);
	return html;
}
