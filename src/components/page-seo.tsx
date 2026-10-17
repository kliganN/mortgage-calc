import { useEffect } from "react";
import { useLocation } from "react-router";
import { getSeo, normalizeSiteUrl, renderSeoHead } from "@/lib/seo";

const siteUrl = normalizeSiteUrl(import.meta.env.VITE_SITE_URL);

export function PageSeo() {
	const { pathname, search } = useLocation();
	useEffect(() => {
		const template = document.createElement("template");
		template.innerHTML = renderSeoHead(getSeo(pathname + search, siteUrl));
		for (const tag of document.head.querySelectorAll("[data-seo]"))
			tag.remove();
		document.head.append(template.content);
	}, [pathname, search]);
	return null;
}
