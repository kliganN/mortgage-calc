import { describe, expect, it } from "vitest";
import { numberInputCaret } from "../number-input";

describe("курсор при вводе процентной ставки", () => {
	it.each(["13.", "13,"])(
		"после %s следующая цифра вводится в дробную часть",
		(raw) => {
			const formatted = "13,";
			const caret = numberInputCaret(raw, formatted, raw.length);
			const next = `${formatted.slice(0, caret)}5${formatted.slice(caret)}`;
			expect(next).toBe("13,5");
		},
	);
	it("сохраняет курсор в начале поля", () => {
		expect(numberInputCaret("13,5", "13,5", 0)).toBe(0);
	});
	it("учитывает разделители тысяч при редактировании числа", () => {
		expect(numberInputCaret("1234,5", "1\u00a0234,5", 4)).toBe(5);
	});
	it("не учитывает отброшенную точку в целочисленном поле", () => {
		expect(numberInputCaret("12.34", "1234", 3)).toBe(2);
	});
});
