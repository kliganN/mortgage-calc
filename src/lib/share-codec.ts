import { decompressFromEncodedURIComponent } from "lz-string";

export const MAX_SHARE_ENCODED_LENGTH = 65_536;
export const MAX_SHARE_JSON_LENGTH = 131_072;

const URI_ALPHABET =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-";

/**
 * Проверяет длину вывода lz-string, храня только длины словарных записей.
 * Строки создаёт штатный распаковщик лишь после проверки всего потока.
 * Формат: https://pieroxy.net/blog/pages/lz-string/index.html
 * Порядок кодов сверён с lz-string 1.5.0, libs/lz-string.js, _decompress.
 */
function fitsOutputBudget(encoded: string): boolean {
	let bitOffset = 0;
	const readBits = (count: number): number | null => {
		if (bitOffset + count > encoded.length * 6) return null;
		let value = 0;
		for (let bit = 0; bit < count; bit++, bitOffset++) {
			const digit = URI_ALPHABET.indexOf(encoded[Math.floor(bitOffset / 6)]);
			value += ((digit >> (5 - (bitOffset % 6))) & 1) * 2 ** bit;
		}
		return value;
	};

	const first = readBits(2);
	if (first === 2) return true;
	if (first !== 0 && first !== 1) return false;
	if (readBits(first === 0 ? 8 : 16) === null) return false;

	const lengths = [0, 0, 0, 1];
	let previousLength = 1;
	let outputLength = 1;
	let numBits = 3;
	let enlargeIn = 4;
	while (true) {
		let code = readBits(numBits);
		if (code === null) return false;
		if (code === 2) return true;
		if (code === 0 || code === 1) {
			if (readBits(code === 0 ? 8 : 16) === null) return false;
			code = lengths.length;
			lengths.push(1);
			enlargeIn--;
		}
		if (enlargeIn === 0) {
			enlargeIn = 2 ** numBits;
			numBits++;
		}
		const entryLength =
			code === lengths.length ? previousLength + 1 : lengths[code];
		if (!entryLength || outputLength + entryLength > MAX_SHARE_JSON_LENGTH)
			return false;
		outputLength += entryLength;
		// Сумма длин добавленных записей ≤ объём вывода + число кодов.
		// Число кодов и размер числового словаря ограничены длиной входа.
		lengths.push(previousLength + 1);
		previousLength = entryLength;
		enlargeIn--;
		if (enlargeIn === 0) {
			enlargeIn = 2 ** numBits;
			numBits++;
		}
	}
}

/** Лимиты проверяются до нормализации, распаковки и JSON.parse у вызывающего кода. */
export function decodeSharedJson(encoded: string): string | null {
	if (!encoded || encoded.length > MAX_SHARE_ENCODED_LENGTH) return null;
	// URLSearchParams превращает неэкранированный «+» старых ссылок в пробел.
	const normalized = encoded.replace(/ /g, "+");
	if (!/^[A-Za-z0-9+-]+$/.test(normalized) || !fitsOutputBudget(normalized))
		return null;
	const json = decompressFromEncodedURIComponent(normalized);
	return json && json.length <= MAX_SHARE_JSON_LENGTH ? json : null;
}
