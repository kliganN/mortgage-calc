import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import App from "./App.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import CalculatorPage from "./pages/CalculatorPage.tsx";
import ChartsPage from "./pages/ChartsPage.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import ReportPage from "./pages/ReportPage.tsx";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Не найден #root в index.html");

createRoot(root).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				<Route element={<App />}>
					<Route index element={<LandingPage />} />
					<Route path="calculator" element={<CalculatorPage />} />
					<Route path="charts" element={<ChartsPage />} />
					<Route path="report" element={<ReportPage />} />
					<Route path="about" element={<AboutPage />} />
				</Route>
			</Routes>
		</BrowserRouter>
	</StrictMode>,
);
