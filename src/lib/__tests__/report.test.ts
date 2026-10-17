import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { encodeLoanInput } from "@/lib/url";
import ReportPage from "@/pages/ReportPage";
import { DEFAULT_LOAN } from "@/store/loan";

function renderReport(url: string): string {
	return renderToStaticMarkup(
		createElement(
			MemoryRouter,
			{ initialEntries: [url] },
			createElement(ReportPage),
		),
	);
}

describe("печатный отчёт", () => {
	it.each(["/report?s=broken", "/report?s="])(
		"не подменяет повреждённую ссылку другим расчётом: %s",
		(url) => {
			const html = renderReport(url);
			expect(html.includes('role="alert"')).toBe(true);
			expect(html.includes('href="/calculator"')).toBe(true);
			expect(/<button[^>]*\sdisabled=""/.test(html)).toBe(true);
			expect(html.includes("<table")).toBe(false);
		},
	);

	it("показывает текущий расчёт при отсутствии параметра ссылки", () => {
		const html = renderReport("/report");
		expect(html.includes("<table")).toBe(true);
		expect(html.includes('role="alert"')).toBe(false);
		expect(/<button[^>]*\sdisabled=""/.test(html)).toBe(false);
	});

	it("называет платёж дифференцированного графика первым плановым", () => {
		const input = {
			...DEFAULT_LOAN,
			propertyPrice: 1_200_000,
			downPayment: 0,
			annualRate: 10,
			termMonths: 12,
			paymentType: "differentiated" as const,
		};
		const html = renderReport(`/report?s=${encodeLoanInput(input)}`);
		expect(
			html.match(/Первый плановый платёж<\/p><p[^>]*>([^<]+)<\/p>/)?.[1],
		).toBe("110\u00a0000,00\u00a0₽");
	});

	it("показывает первый платёж до будущего уменьшения досрочкой", () => {
		const input = {
			...DEFAULT_LOAN,
			propertyPrice: 1_200_000,
			downPayment: 0,
			annualRate: 0,
			termMonths: 12,
			earlyPayments: [
				{
					id: "e1",
					monthIndex: 1,
					amount: 100_000,
					strategy: "reducePayment" as const,
				},
			],
		};
		const html = renderReport(`/report?s=${encodeLoanInput(input)}`);
		expect(
			html.match(/Первый плановый платёж<\/p><p[^>]*>([^<]+)<\/p>/)?.[1],
		).toBe("100\u00a0000,00\u00a0₽");
	});
});
