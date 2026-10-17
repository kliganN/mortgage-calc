import {
	compressToEncodedURIComponent,
	decompressFromEncodedURIComponent,
} from "lz-string";
import {
	type EarlyPayment,
	type LoanInput,
	type RecurringExtra,
	validateLoanInput,
} from "@/lib/calc";
import { DEFAULT_LOAN } from "@/store/loan";

const LINK_VERSION = 1;

/**
 * Кодирование состояния расчёта в параметр ссылки `?s=…`
 * lz-string сжимает JSON в URL-безопасную строку — расчёт умещается в одну ссылку.
 */
export function encodeLoanInput(input: LoanInput): string {
	return compressToEncodedURIComponent(
		JSON.stringify({ ...input, version: LINK_VERSION }),
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStrategy(value: unknown): value is EarlyPayment["strategy"] {
	return value === "reduceTerm" || value === "reducePayment";
}

function parseEarlyPayments(value: unknown): EarlyPayment[] | null {
	if (!Array.isArray(value)) return null;
	const payments: EarlyPayment[] = [];
	const ids = new Set<string>();
	const reservedIds = new Set(
		value.flatMap((p) =>
			isRecord(p) && typeof p.id === "string" ? [p.id] : [],
		),
	);
	for (const [index, p] of value.entries()) {
		if (
			!isRecord(p) ||
			typeof p.monthIndex !== "number" ||
			typeof p.amount !== "number" ||
			!isStrategy(p.strategy) ||
			(p.id !== undefined && (typeof p.id !== "string" || p.id.length === 0))
		)
			return null;
		// Старые ссылки могли содержать досрочки без идентификаторов интерфейса.
		let id = typeof p.id === "string" ? p.id : `url-early-${index}`;
		if (p.id === undefined) {
			while (reservedIds.has(id)) id += "-";
		}
		if (ids.has(id)) return null;
		ids.add(id);
		payments.push({
			id,
			monthIndex: p.monthIndex,
			amount: p.amount,
			strategy: p.strategy,
		});
	}
	return payments;
}

function parseRecurringExtra(
	value: unknown,
): RecurringExtra | null | undefined {
	if (value === null) return null;
	if (
		!isRecord(value) ||
		typeof value.amount !== "number" ||
		!isStrategy(value.strategy) ||
		(value.startMonthIndex !== undefined &&
			typeof value.startMonthIndex !== "number")
	)
		return undefined;
	return {
		amount: value.amount,
		strategy: value.strategy,
		// До появления выбора первого месяца надбавка начиналась сразу.
		startMonthIndex: value.startMonthIndex ?? 1,
	};
}

/** Восстанавливает параметры из ссылки; при ошибке возвращает null. */
export function decodeLoanInput(encoded: string | null): LoanInput | null {
	if (!encoded) return null;
	try {
		const json = decompressFromEncodedURIComponent(encoded);
		if (!json) return null;
		const parsed: unknown = JSON.parse(json);
		if (
			!isRecord(parsed) ||
			(parsed.version !== undefined && parsed.version !== LINK_VERSION) ||
			typeof parsed.propertyPrice !== "number" ||
			typeof parsed.termMonths !== "number" ||
			typeof parsed.annualRate !== "number"
		) {
			return null;
		}
		// Проверяем структуру до вызова валидатора ядра и не переносим лишние поля.
		const downPayment =
			parsed.downPayment === undefined
				? DEFAULT_LOAN.downPayment
				: parsed.downPayment;
		const paymentType =
			parsed.paymentType === undefined
				? DEFAULT_LOAN.paymentType
				: parsed.paymentType;
		const startDate =
			parsed.startDate === undefined
				? DEFAULT_LOAN.startDate
				: parsed.startDate;
		if (
			typeof downPayment !== "number" ||
			(paymentType !== "annuity" && paymentType !== "differentiated") ||
			typeof startDate !== "string"
		)
			return null;
		const earlyPayments = parseEarlyPayments(
			parsed.earlyPayments === undefined ? [] : parsed.earlyPayments,
		);
		const recurringExtra = parseRecurringExtra(
			parsed.recurringExtra === undefined ? null : parsed.recurringExtra,
		);
		if (earlyPayments === null || recurringExtra === undefined) return null;
		const input: LoanInput = {
			propertyPrice: parsed.propertyPrice,
			downPayment,
			termMonths: parsed.termMonths,
			annualRate: parsed.annualRate,
			paymentType,
			startDate,
			earlyPayments,
			recurringExtra,
		};
		return validateLoanInput(input).length === 0 ? input : null;
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
