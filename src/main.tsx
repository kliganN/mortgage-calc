import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import App from "./App.tsx";
import CalculatorPage from "./pages/CalculatorPage.tsx";
import ReportPage from "./pages/ReportPage.tsx";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Не найден #root в index.html");

createRoot(root).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				<Route element={<App />}>
					<Route index element={<CalculatorPage />} />
					<Route path="report" element={<ReportPage />} />
				</Route>
			</Routes>
		</BrowserRouter>
	</StrictMode>,
);
