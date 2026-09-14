/**
 * Форматирование денежных сумм, процентов и дат для интерфейса (ru-RU).
 * На входе — целые копейки (см. src/lib/calc/money.ts), на выходе — строки.
 */

const rublesNoKop = new Intl.NumberFormat("ru-RU", {
	style: "currency",
	currency: "RUB",
	maximumFractionDigits: 0,
});

const rublesWithKop = new Intl.NumberFormat("ru-RU", {
	style: "currency",
	currency: "RUB",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

const plainNumber = new Intl.NumberFormat("ru-RU", {
	maximumFractionDigits: 0,
});

/** Копейки → «1 234 567 ₽» (без копеек). */
export function formatRub(kopecks: number): string {
	return rublesNoKop.format(kopecks / 100);
}

/** Копейки → «1 234 567,89 ₽» (с копейками). */
export function formatRubPrecise(kopecks: number): string {
	return rublesWithKop.format(kopecks / 100);
}

/** Число с разделителями: «1 234 567». */
export function formatNumber(value: number): string {
	return plainNumber.format(value);
}

/** Доля от 0 до 1 → «16,5 %». */
export function formatFraction(value: number): string {
	return new Intl.NumberFormat("ru-RU", {
		style: "percent",
		maximumFractionDigits: 1,
	}).format(value);
}

/** Процентная ставка (например 16.5) → «16,5 %». */
export function formatRate(ratePercent: number): string {
	return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(ratePercent)} %`;
}

const monthYear = new Intl.DateTimeFormat("ru-RU", {
	month: "long",
	year: "numeric",
	timeZone: "UTC",
});

/** ISO-дата → «октябрь 2026». */
export function formatMonthYear(iso: string): string {
	const text = monthYear.format(new Date(`${iso}T00:00:00Z`));
	return text.charAt(0).toUpperCase() + text.slice(1);
}

/** ISO-дата → «14.09.2026». */
export function formatDate(iso: string): string {
	return new Intl.DateTimeFormat("ru-RU", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(`${iso}T00:00:00Z`));
}

/** Русские формы множественного числа: plural(2, ['год','года','лет']) → «года». */
export function plural(n: number, forms: [string, string, string]): string {
	const mod10 = n % 10;
	const mod100 = n % 100;
	if (mod10 === 1 && mod100 !== 11) return forms[0];
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
	return forms[2];
}

/** Срок в месяцах → «20 лет 3 мес.» (пропускает нулевые части). */
export function formatTerm(months: number): string {
	const years = Math.floor(months / 12);
	const rest = months % 12;
	const parts: string[] = [];
	if (years > 0)
		parts.push(`${years} ${plural(years, ["год", "года", "лет"])}`);
	if (rest > 0)
		parts.push(`${rest} ${plural(rest, ["месяц", "месяца", "месяцев"])}`);
	return parts.join(" ") || "0 месяцев";
}
