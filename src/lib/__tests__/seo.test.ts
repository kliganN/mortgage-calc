import { describe, expect, it } from "vitest";
import { getSeo, normalizeSiteUrl, renderSeoHead, renderSitemap } from "../seo";

describe("SEO до публикации", () => {
	it("не индексирует сборку без публичного домена", () => {
		expect(getSeo("/", null).robots).toBe("noindex, follow");
		expect(getSeo("/", null).canonical).toBeNull();
		expect(getSeo("/calculator", null).robots).toBe("noindex, follow");
		expect(getSeo("/calculator", null).canonical).toBeNull();
		expect(renderSitemap(null)).toBeNull();
	});
	it("принимает только публичный HTTPS origin", () => {
		expect(normalizeSiteUrl("https://example.org/")).toBe(
			"https://example.org",
		);
		for (const value of [
			"http://example.org",
			"https://localhost",
			"https://127.0.0.1",
			"https://example.org/sub",
			"https://u:p@example.org",
			"https://example.org/?x=1",
			"oops",
		]) {
			expect(() => normalizeSiteUrl(value)).toThrow();
		}
	});
	it("объединяет ссылки расчётов с каноническим калькулятором", () => {
		const origin = "https://example.org";
		expect(getSeo("/calculator?s=private", origin).canonical).toBe(
			`${origin}/calculator`,
		);
		expect(getSeo("/charts", origin).canonical).toBe(`${origin}/calculator`);
		expect(getSeo("/calculator", origin).robots).toBe("index, follow");
	});
	it("выделяет главную страницу и закрывает ссылки с расчётами от индексации", () => {
		const origin = "https://example.org";
		const home = getSeo("/", origin);
		const calculator = getSeo("/calculator", origin);
		expect(home.canonical).toBe(`${origin}/`);
		expect(home.robots).toBe("index, follow");
		expect(home.title).not.toBe(calculator.title);
		expect(home.description).not.toBe(calculator.description);
		for (const path of ["/?s=private", "/calculator?s=private"]) {
			expect(getSeo(path, origin).robots).toBe("noindex, follow");
		}
	});
	it("не индексирует отчёты и неизвестные страницы", () => {
		for (const path of ["/report?s=private", "/missing"]) {
			const seo = getSeo(path, "https://example.org");
			expect(seo.robots).toBe("noindex, follow");
			expect(seo.canonical).toBeNull();
			expect(seo.structuredData).toBeNull();
		}
	});
	it("различает публичные страницы и создаёт только их sitemap", () => {
		const origin = "https://example.org";
		const calc = getSeo("/calculator", origin);
		const about = getSeo("/about", origin);
		expect(calc.title).not.toBe(about.title);
		expect(calc.description).not.toBe(about.description);
		expect(renderSitemap(origin)?.match(/<loc>/g)).toHaveLength(3);
		expect(renderSitemap(origin)).toContain(`<loc>${origin}/</loc>`);
		expect(renderSitemap(origin)).not.toMatch(/report|charts|private/);
		const head = renderSeoHead(calc);
		expect(head).toContain('rel="canonical"');
		expect(head).toContain('property="og:title"');
		expect(head).toContain('type="application/ld+json"');
		expect(calc.structuredData).toMatchObject({
			"@type": "WebApplication",
			applicationCategory: "FinanceApplication",
		});
	});
});
