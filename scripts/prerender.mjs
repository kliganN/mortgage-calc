import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
	getSeo,
	render,
	renderSeoHead,
	renderSitemap,
	siteUrl,
} from "../dist-ssr/entry-prerender.js";

const root = resolve(import.meta.dirname, "..");
const template = await readFile(resolve(root, "dist/index.html"), "utf8");
for (const [path, file] of [
	["/", "index.html"],
	["/calculator", "calculator/index.html"],
	["/about", "about/index.html"],
	["/report", "report/index.html"],
	["/charts", "charts/index.html"],
	["/404", "404.html"],
]) {
	const html = template
		.replace('<div id="root">', '<div id="root" data-prerender>')
		.replace("<!--seo-head-->", () => renderSeoHead(getSeo(path, siteUrl)))
		.replace("<!--app-html-->", () => render(path));
	const destination = resolve(root, "dist", file);
	await mkdir(resolve(destination, ".."), { recursive: true });
	await writeFile(destination, html);
	console.log(`HTML: ${path}`);
}
// Робот должен прочитать noindex отчёта; поэтому /report не закрыт через Disallow.
await writeFile(
	resolve(root, "dist/robots.txt"),
	siteUrl
		? `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`
		: "User-agent: *\nAllow: /\n",
);
const sitemap = renderSitemap(siteUrl);
if (sitemap) await writeFile(resolve(root, "dist/sitemap.xml"), sitemap);
else
	console.log("VITE_SITE_URL не задан: сборка noindex, sitemap не создаётся.");
