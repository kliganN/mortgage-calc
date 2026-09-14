/**
 * Денежные величины внутри ядра — целые копейки, чтобы исключить потери
 * точности на числах с плавающей точкой (правило из AGENTS.md).
 * Преобразование в рубли — только при выводе (см. src/lib/format.ts).
 */

/** Рублей → копейки (округление до копейки на входе). */
export function toKopecks(rubles: number): number {
	return Math.round(rubles * 100);
}

/** Копейки → рубли (только для отображения/экспорта). */
export function toRubles(kopecks: number): number {
	return kopecks / 100;
}
