import { afterEach, describe, expect, it, vi } from "vitest";
import { localISODate } from "@/lib/format";

afterEach(() => vi.useRealTimers());

describe("локальная календарная дата", () => {
	it("сохраняет календарный день сразу после полуночи", () => {
		expect(localISODate(new Date(2026, 9, 17, 0, 30))).toBe("2026-10-17");
	});

	it("дополняет месяц и день нулями", () => {
		expect(localISODate(new Date(2026, 0, 3, 23, 30))).toBe("2026-01-03");
	});

	it("без аргумента использует сегодняшний локальный день", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 9, 17, 0, 30));
		expect(localISODate()).toBe("2026-10-17");
	});
});
