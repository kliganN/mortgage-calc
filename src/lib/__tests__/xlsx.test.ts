import { Workbook } from "exceljs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildSchedule } from "@/lib/calc";
import { exportScheduleToXlsx } from "@/lib/export/xlsx";
import { DEFAULT_LOAN } from "@/store/loan";

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("экспорт после обновления зависимостей", () => {
	it("создаёт читаемый XLSX с параметрами и суммами графика", async () => {
		let savedBlob: Blob | undefined;
		vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
			savedBlob = blob as Blob;
			return "blob:test";
		});
		vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
		// Подменяем только браузерную загрузку; книгу создаёт и читает реальный ExcelJS.
		vi.stubGlobal("document", { createElement: () => ({ click() {} }) });
		const input = {
			...DEFAULT_LOAN,
			propertyPrice: 1_200,
			downPayment: 0,
			termMonths: 12,
			annualRate: 0,
		};
		await exportScheduleToXlsx(input, buildSchedule(input));
		expect(savedBlob).toBeInstanceOf(Blob);
		const workbook = new Workbook();
		await workbook.xlsx.load(await savedBlob!.arrayBuffer());
		expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
			"Параметры",
			"График платежей",
		]);
		expect(workbook.getWorksheet("Параметры")?.getCell("B3").value).toBe(1200);
		expect(workbook.getWorksheet("График платежей")?.getCell("C2").value).toBe(
			100,
		);
		expect(workbook.getWorksheet("График платежей")?.getCell("C14").value).toBe(
			1200,
		);
	});

	it("сохраняет расширенные правила ExcelJS, использующие uuid.v4", async () => {
		const workbook = new Workbook();
		const sheet = workbook.addWorksheet("Проверка");
		sheet.getCell("A1").value = 1;
		sheet.addConditionalFormatting({
			ref: "A1",
			rules: [
				{
					type: "iconSet",
					iconSet: "3Stars",
					priority: 1,
					cfvo: [
						{ type: "percent", value: 0 },
						{ type: "percent", value: 33 },
						{ type: "percent", value: 67 },
					],
				},
			],
		});
		const buffer = await workbook.xlsx.writeBuffer();
		const restored = new Workbook();
		await restored.xlsx.load(buffer);
		expect(restored.getWorksheet("Проверка")?.getCell("A1").value).toBe(1);
	});
});
