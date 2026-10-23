import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { expect, it } from "vitest";
import { validateLoanInput } from "@/lib/calc";
import { decodeLoanInput, encodeLoanInput } from "@/lib/url";
import CalculatorPage from "@/pages/CalculatorPage";
import { DEFAULT_LOAN, useLoanStore } from "@/store/loan";

it("оставляет расчёт доступным после редактирования ссылки почти предельного размера", () => {
	const input = {
		...DEFAULT_LOAN,
		termMonths: 1,
		annualRate: 0,
		earlyPayments: Array.from({ length: 500 }, (_, index) => ({
			id: `e${index}`,
			monthIndex: 1,
			amount: 1,
			strategy: "reduceTerm" as const,
		})),
	};
	let remaining = 131_000 - JSON.stringify({ ...input, version: 1 }).length;
	for (const payment of input.earlyPayments) {
		const quotes = Math.min(128 - payment.id.length, Math.floor(remaining / 2));
		payment.id += '"'.repeat(quotes);
		remaining -= quotes * 2;
	}
	const restored = decodeLoanInput(encodeLoanInput(input));
	expect(restored).not.toBeNull();
	const edited = {
		...restored!,
		earlyPayments: [
			...restored!.earlyPayments,
			{
				id: "00000000-0000-4000-8000-000000000001",
				monthIndex: 1,
				amount: 100_000,
				strategy: "reduceTerm" as const,
			},
		],
	};
	expect(validateLoanInput(edited)).toEqual([]);
	// Серверный рендер Zustand читает начальный снимок, а не текущее состояние.
	const initialState = useLoanStore.getInitialState();
	const previous = initialState.input;
	initialState.input = edited;
	try {
		let html = "";
		expect(() => {
			html = renderToStaticMarkup(
				createElement(MemoryRouter, {}, createElement(CalculatorPage)),
			);
		}).not.toThrow();
		expect(html.includes("Расчёт слишком велик для передачи ссылкой")).toBe(
			true,
		);
		expect(html).not.toContain('href="/report?s=');
	} finally {
		initialState.input = previous;
	}
});
