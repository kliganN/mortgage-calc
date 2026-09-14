import {
	compressToEncodedURIComponent,
	decompressFromEncodedURIComponent,
} from "lz-string";
import type { LoanInput } from "@/lib/calc";
import { DEFAULT_LOAN } from "@/store/loan";

/**
 * Кодирование состояния расчёта в параметр ссылки `?s=…`
 * lz-string сжимает JSON в URL-безопасную строку — расчёт умещается в одну ссылку.
 */
export function encodeLoanInput(input: LoanInput): string {
	return compressToEncodedURIComponent(JSON.stringify(input));
}

/** Восстанавливает параметры из ссылки; при ошибке возвращает null. */
export function decodeLoanInput(encoded: string | null): LoanInput | null {
	if (!encoded) return null;
	try {
		const json = decompressFromEncodedURIComponent(encoded);
		if (!json) return null;
		const parsed = JSON.parse(json) as Partial<LoanInput>;
		if (
			typeof parsed.propertyPrice !== "number" ||
			typeof parsed.termMonths !== "number" ||
			typeof parsed.annualRate !== "number"
		) {
			return null;
		}
		// Дополняем недостающие поля значениями по умолчанию (устойчивость к версиям).
		return { ...DEFAULT_LOAN, ...parsed };
	} catch {
		return null;
	}
}

/** Собирает ссылку-шаринг для текущего расчёта. */
export function buildShareUrl(input: LoanInput): string {
	const url = new URL(globalThis.location.href);
	url.searchParams.set("s", encodeLoanInput(input));
	return url.toString();
}
