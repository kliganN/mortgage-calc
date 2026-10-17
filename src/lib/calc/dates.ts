/**
 * Операции с датами платежей в формате ISO «YYYY-MM-DD».
 * Работаем в UTC, чтобы не зависеть от часового пояса пользователя.
 */

/** Реальная календарная дата с четырёхзначным годом без особенностей Date.UTC для 0–99. */
export function isValidPaymentDate(iso: string, termMonths: number): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
	const [year, month, day] = iso.split("-").map(Number);
	if (year < 100 || month < 1 || month > 12 || day < 1) return false;
	const date = new Date(`${iso}T00:00:00Z`);
	if (
		!Number.isFinite(date.getTime()) ||
		date.toISOString().slice(0, 10) !== iso
	)
		return false;
	return (
		Number.isInteger(termMonths) &&
		year * 12 + month - 1 + termMonths - 1 < 10_000 * 12
	);
}

/** Прибавляет месяцы к ISO-дате с прижиманием дня к концу короткого месяца (31.01 → 28.02). */
export function addMonthsISO(iso: string, months: number): string {
	const [y, m, d] = iso.split("-").map(Number);
	if (!y || !m || !d) return iso;
	const target = new Date(Date.UTC(y, m - 1 + months, 1));
	const daysInTarget = new Date(
		Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
	).getUTCDate();
	target.setUTCDate(Math.min(d, daysInTarget));
	return target.toISOString().slice(0, 10);
}
