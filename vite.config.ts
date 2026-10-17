/// <reference types="vitest/config" />
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

/** В preview каждый чистый URL получает свой HTML, как на статическом хостинге. */
function staticPagePreview(): Plugin {
	return {
		name: "static-page-preview",
		configurePreviewServer(server) {
			server.middlewares.use((req, res, next) => {
				const url = new URL(req.url ?? "/", "http://preview.local");
				const path = url.pathname.replace(/\/+$/, "") || "/";
				if (path === "/" || path === "/charts") {
					res.writeHead(301, { Location: `/calculator${url.search}` });
					res.end();
					return;
				}
				if (["/calculator", "/about", "/report"].includes(path)) {
					req.url = `${path}/index.html${url.search}`;
					next();
					return;
				}
				if (!url.pathname.includes(".")) {
					readFile(
						resolve(server.config.root, server.config.build.outDir, "404.html"),
					)
						.then((html) => {
							res.writeHead(404, {
								"Content-Type": "text/html; charset=utf-8",
							});
							res.end(html);
						})
						.catch(next);
					return;
				}
				next();
			});
		},
	};
}

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss(), staticPagePreview()],
	ssr: { noExternal: ["lz-string"] },
	resolve: {
		alias: {
			"@": `${import.meta.dirname}/src`,
		},
	},
	test: {
		environment: "node",
		include: ["src/**/*.test.ts"],
	},
});
