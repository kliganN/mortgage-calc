import { cn } from "cn";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NumberFieldProps {
	id: string;
	label: string;
	value: number;
	onChange: (value: number) => void;
	/** Единицы после поля (₽, %, мес.). */
	unit?: string;
	hint?: string;
	error?: string;
	/** Разрешить десятичную дробь (для ставки). */
	decimal?: boolean;
	/** Прижимаются к значению при потере фокуса, не во время ввода. */
	min?: number;
	max?: number;
}

/** Разбирает ввод: пробелы-разделители, запятая как десятичный разделитель. */
function parseNumber(text: string, decimal: boolean): number | null {
	const cleaned = text.replace(/\s/g, "").replace(",", ".");
	if (cleaned === "" || cleaned === ".") return null;
	const n = decimal ? Number(cleaned) : Number.parseInt(cleaned, 10);
	return Number.isFinite(n) ? n : null;
}

/**
 * Числовое поле: пока поле в фокусе — показываем «сырой» текст пользователя,
 * после потери фокуса — отформатированное число. Значение в стор уходит
 * на каждый ввод; прижимание к min/max происходит только на blur, чтобы не
 * ломать ввод по цифрам (см. историю с автозаполнением в GUI-тесте).
 */
export function NumberField({
	id,
	label,
	value,
	onChange,
	unit,
	hint,
	error,
	decimal = false,
	min,
	max,
}: NumberFieldProps) {
	// null — показываем форматированное значение из стора.
	const [draft, setDraft] = useState<string | null>(null);

	const clamp = (n: number): number => {
		let v = n;
		if (min !== undefined) v = Math.max(min, v);
		if (max !== undefined) v = Math.min(max, v);
		return v;
	};

	const display =
		draft ??
		new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(value);

	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{label}</Label>
			<div className="relative">
				<Input
					id={id}
					inputMode={decimal ? "decimal" : "numeric"}
					value={display}
					onBlur={() => {
						if (draft !== null) {
							const n = parseNumber(draft, decimal);
							if (n !== null) onChange(clamp(n));
						}
						setDraft(null);
					}}
					onChange={(e) => {
						setDraft(e.target.value);
						const n = parseNumber(e.target.value, decimal);
						if (n !== null) onChange(n);
					}}
					aria-invalid={Boolean(error)}
					className={cn("pr-12", error && "border-destructive")}
				/>
				{unit && (
					<span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
						{unit}
					</span>
				)}
			</div>
			{error ? (
				<p className="text-xs text-destructive">{error}</p>
			) : hint ? (
				<p className="text-xs text-muted-foreground">{hint}</p>
			) : null}
		</div>
	);
}
