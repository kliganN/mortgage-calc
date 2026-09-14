/**
 * Операции с датами платежей в формате ISO «YYYY-MM-DD».
 * Работаем в UTC, чтобы не зависеть от часового пояса пользователя.
 */

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
