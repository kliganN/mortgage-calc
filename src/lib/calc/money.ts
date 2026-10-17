/**
 * Денежные величины внутри ядра — целые копейки, чтобы исключить потери
 * точности на числах с плавающей точкой (правило из AGENTS.md).
 * Преобразование в рубли — только при выводе (см. src/lib/format.ts).
 */

/** Даже при 600 месяцах и ставке 100% сумма кредита и процентов остаётся safe integer. */
export const MAX_MONEY_RUBLES = 1_000_000_000_000;

/** Десятичная запись Number → точная рациональная дробь, включая экспоненциальную запись. */
function decimalFraction(value: number): [bigint, bigint] {
	const [coefficient, exponent = "0"] = value.toString().split("e");
	const [whole, fraction = ""] = coefficient.split(".");
	const numerator = BigInt(whole + fraction);
	const scale = fraction.length - Number(exponent);
	return scale >= 0
		? [numerator, 10n ** BigInt(scale)]
		: [numerator * 10n ** BigInt(-scale), 1n];
}

/** Округление рационального числа, половина — вверх, как Math.round. */
function roundFraction(numerator: bigint, denominator: bigint): number {
	const quotient = numerator / denominator;
	const remainder = numerator % denominator;
	if (remainder * 2n >= denominator) return Number(quotient + 1n);
	if (remainder * -2n > denominator) return Number(quotient - 1n);
	return Number(quotient);
}

/** Рублей → копейки: десятичная половина копейки не теряется в двоичном умножении. */
export function toKopecks(rubles: number): number {
	if (!Number.isFinite(rubles)) return Math.round(rubles * 100);
	const [numerator, denominator] = decimalFraction(rubles);
	return roundFraction(numerator * 100n, denominator);
}

/**
 * Проценты месяца = остаток × годовая ставка / 12 / 100.
 * Источник месячной модели: https://www.vtb.ru/articles/kak-rasschityvaetsya-ipoteka/
 * Ставку разбираем один раз; BigInt сохраняет точные половины копейки.
 */
export function monthlyInterestCalculator(
	annualRate: number,
): (balanceKop: number) => number {
	const [numerator, denominator] = decimalFraction(annualRate);
	return (balanceKop) =>
		roundFraction(BigInt(balanceKop) * numerator, denominator * 1200n);
}

/**
 * Точный аннуитет P = S·i·(1+i)^n / ((1+i)^n−1).
 * Источник: https://www.vtb.ru/articles/kak-rasschityvaetsya-ipoteka/
 * По умолчанию rate — годовые проценты (i = rate/1200).
 * Делитель 1 сохраняет API старого помощника с месячной долей.
 * Степени целые: даже у почти нулевого тела ошибка float не превращается в новый долг.
 */
export function annuityPaymentCalculator(
	rate: number,
	rateDivisor = 1200,
): (balanceKop: number, months: number) => number {
	const [numerator, decimalDenominator] = decimalFraction(rate);
	const denominator = decimalDenominator * BigInt(rateDivisor);
	return (balanceKop, months) => {
		if (months <= 0) return balanceKop;
		const balance = BigInt(balanceKop);
		const count = BigInt(months);
		const lower = roundFraction(balance, count);
		if (numerator === 0n) return lower;
		if (numerator > 0n) {
			// Неравенство Бернулли даёт S/n ≤ P ≤ S/n + S·i.
			// Совпавшие округления границ точны и избавляют от огромных степеней при малой ставке.
			const upper = roundFraction(
				balance * (denominator + numerator * count),
				count * denominator,
			);
			if (lower === upper) return lower;
		}
		const factor = (denominator + numerator) ** BigInt(months);
		const base = denominator ** BigInt(months);
		return roundFraction(
			balance * numerator * factor,
			denominator * (factor - base),
		);
	};
}

/** Копейки → рубли (только для отображения/экспорта). */
export function toRubles(kopecks: number): number {
	return kopecks / 100;
}
