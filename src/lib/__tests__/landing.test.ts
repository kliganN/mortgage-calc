import { describe, expect, it } from "vitest";
import { render } from "@/entry-prerender";

describe("главная страница", () => {
	it("показывает Hero и переход к инструменту в готовом HTML", () => {
		const html = render("/");
		const text = html.replace(/<[^>]*>/g, "");
		expect(text).toContain("Ваша ипотека.");
		expect(text).toContain("В понятных цифрах.");
		expect(html).toContain("Рассчитать ипотеку");
		expect(html).toContain('href="/calculator"');
		expect(html).not.toContain("Параметры кредита");
	});

	it("сохраняет рабочую форму по адресу калькулятора", () => {
		const html = render("/calculator");
		expect(html).toContain("Параметры кредита");
		expect(html).not.toContain("Ваша ипотека.");
	});
});
