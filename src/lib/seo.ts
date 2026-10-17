const BRAND = "Ипотека — прозрачно";
export const PUBLIC_PATHS = ["/calculator", "/about"] as const;

export interface PageSeo {
	title: string;
	description: string;
	robots: string;
	canonical: string | null;
	structuredData: Record<string, unknown> | null;
}

/** Публичный адрес задаётся перед выпуском, а не выводится из адреса превью. */
export function normalizeSiteUrl(value: string | undefined): string | null {
	if (!value?.trim()) return null;
	const url = new URL(value.trim());
	if (
		url.protocol !== "https:" ||
		url.username ||
		url.password ||
		url.port ||
		url.pathname !== "/" ||
		url.search ||
		url.hash ||
		!url.hostname.includes(".") ||
		url.hostname.endsWith(".localhost") ||
		url.hostname.endsWith(".local") ||
		/^[\d.]+$/.test(url.hostname)
	)
		throw new Error(
			"VITE_SITE_URL должен содержать публичный HTTPS-домен без пути и параметров",
		);
	return url.origin;
}

export function getSeo(location: string, siteUrl: string | null): PageSeo {
	const [pathname = "/", search = ""] = location.split("?");
	const path = pathname.replace(/\/+$/, "") || "/";
	const calculator = ["/", "/calculator", "/charts"].includes(path);
	const about = path === "/about";
	const canonicalPath = calculator ? "/calculator" : about ? "/about" : null;
	const canonical =
		siteUrl && canonicalPath ? `${siteUrl}${canonicalPath}` : null;
	const title = calculator
		? "Ипотечный калькулятор с досрочным погашением"
		: about
			? "Как рассчитывается ипотека и хранятся данные"
			: path === "/report"
				? "Отчёт по ипотеке для печати"
				: "Страница не найдена";
	const description = calculator
		? "Рассчитайте платёж по ипотеке, переплату и досрочное погашение. Сравните уменьшение срока и платежа, изучите график и скачайте Excel. Без регистрации."
		: about
			? "Методика ипотечного калькулятора: аннуитетные и дифференцированные платежи, досрочное погашение, точность расчётов и хранение данных в браузере."
			: "Вернитесь к ипотечному калькулятору, чтобы рассчитать платёж и график погашения.";
	return {
		title: `${title} | ${BRAND}`,
		description,
		robots:
			siteUrl && canonicalPath && !new URLSearchParams(search).has("s")
				? "index, follow"
				: "noindex, follow",
		canonical,
		structuredData: calculator
			? {
					"@context": "https://schema.org",
					"@type": "WebApplication",
					name: BRAND,
					description,
					applicationCategory: "FinanceApplication",
					operatingSystem: "Any",
					inLanguage: "ru",
					isAccessibleForFree: true,
					...(canonical ? { url: canonical } : {}),
				}
			: null,
	};
}

function escapeHtml(value: string): string {
	return value.replace(
		/[&<>"']/g,
		(character) =>
			({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
				character
			] ?? character,
	);
}

/** Одни и те же метаданные используются в статическом HTML и при навигации SPA. */
export function renderSeoHead(seo: PageSeo): string {
	const title = escapeHtml(seo.title);
	const description = escapeHtml(seo.description);
	return [
		`<title data-seo>${title}</title>`,
		`<meta data-seo name="description" content="${description}" />`,
		`<meta data-seo name="robots" content="${seo.robots}" />`,
		`<meta data-seo property="og:type" content="website" />`,
		`<meta data-seo property="og:locale" content="ru_RU" />`,
		`<meta data-seo property="og:site_name" content="${BRAND}" />`,
		`<meta data-seo property="og:title" content="${title}" />`,
		`<meta data-seo property="og:description" content="${description}" />`,
		...(seo.canonical
			? [
					`<link data-seo rel="canonical" href="${escapeHtml(seo.canonical)}" />`,
					`<meta data-seo property="og:url" content="${escapeHtml(seo.canonical)}" />`,
				]
			: []),
		...(seo.structuredData
			? [
					`<script data-seo type="application/ld+json">${JSON.stringify(seo.structuredData).replace(/</g, "\\u003c")}</script>`,
				]
			: []),
	].join("\n");
}

export function renderSitemap(siteUrl: string | null): string | null {
	if (!siteUrl) return null;
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${PUBLIC_PATHS.map((path) => `<url><loc>${escapeHtml(siteUrl + path)}</loc></url>`).join("")}</urlset>\n`;
}
