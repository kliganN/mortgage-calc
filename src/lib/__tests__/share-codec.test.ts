import { compressToEncodedURIComponent } from "lz-string";
import { describe, expect, it } from "vitest";
import { decodeSharedJson } from "@/lib/share-codec";

describe("бюджет распаковки ссылок", () => {
	it("принимает ровно допустимый вывод и отклоняет превышение на один символ", () => {
		const text = "x".repeat(131_072);
		expect(decodeSharedJson(compressToEncodedURIComponent(text))).toBe(text);
		expect(
			decodeSharedJson(compressToEncodedURIComponent(`${text}x`)),
		).toBeNull();
	});

	it("сохраняет литералы UTF-16 и переходы ширины словаря", () => {
		let seed = 123456789;
		for (const size of [1, 2, 3, 4, 7, 8, 16, 32, 128, 512, 2048, 8192]) {
			let text = "";
			for (let index = 0; index < size; index++) {
				seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
				text += String.fromCharCode(seed >>> 16);
			}
			expect(decodeSharedJson(compressToEncodedURIComponent(text))).toBe(text);
		}
	});

	it.each(["abababab", "ЯЯЯЯЯЯ", "😀😀😀", "abc".repeat(1000)])(
		"сохраняет повторения словаря: %s",
		(text) => {
			expect(decodeSharedJson(compressToEncodedURIComponent(text))).toBe(text);
		},
	);

	it("понимает пробел вместо плюса в старых query-ссылках", () => {
		const text = "\u01f0";
		const link = compressToEncodedURIComponent(text);
		expect(link.includes("+")).toBe(true);
		expect(decodeSharedJson(link.replaceAll("+", " "))).toBe(text);
	});

	it.each(["", "A", "!!!!", "$", "A".repeat(65_536)])(
		"отклоняет повреждённый или оборванный поток %#",
		(link) => {
			expect(decodeSharedJson(link)).toBeNull();
		},
	);
});
