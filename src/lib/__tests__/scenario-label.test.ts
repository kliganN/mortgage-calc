import { describe, expect, it } from "vitest";
import { scenarioLabel } from "@/lib/scenario-label";
import { DEFAULT_LOAN } from "@/store/loan";

describe("названия сохранённых сценариев", () => {
	it.each([
		[1, "22 % • 1 месяц • 10 млн"],
		[6, "22 % • 6 месяцев • 10 млн"],
		[12, "22 % • 1 год • 10 млн"],
		[15, "22 % • 1 год 3 месяца • 10 млн"],
		[24, "22 % • 2 года • 10 млн"],
		[240, "22 % • 20 лет • 10 млн"],
	])("сохраняет точный срок %i месяцев", (termMonths, expected) => {
		expect(scenarioLabel({ ...DEFAULT_LOAN, termMonths })).toBe(expected);
	});
});
