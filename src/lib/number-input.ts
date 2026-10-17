/** Сохраняет положение курсора относительно цифр и десятичного разделителя. */
export function numberInputCaret(
	raw: string,
	formatted: string,
	caret: number,
): number {
	const significant = raw
		.slice(0, caret)
		.split("")
		.filter(
			(ch) => /\d/.test(ch) || (formatted.includes(",") && /[.,]/.test(ch)),
		).length;
	if (significant === 0) return 0;
	let seen = 0;
	for (let i = 0; i < formatted.length; i++) {
		if (/[\d,]/.test(formatted[i] ?? "")) {
			seen++;
			if (seen >= significant) return i + 1;
		}
	}
	return formatted.length;
}
