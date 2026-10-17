import { cn } from "cn";
import { useRef, useState } from "react";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

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
	disabled?: boolean;
}

/** Разбирает готовый текст в число: пробелы-разделители, запятая как десятичный разделитель. */
function parseNumber(text: string, decimal: boolean): number | null {
	const cleaned = text.replace(/\s/g, "").replace(",", ".");
	if (cleaned === "" || cleaned === ".") return null;
	const n = decimal ? Number(cleaned) : Number.parseInt(cleaned, 10);
	return Number.isFinite(n) ? n : null;
}

const GROUP = "\u00A0"; // неразрывный пробел, как в Intl ru-RU

/**
 * Форматирует «сырой» ввод на лету: группы по 3 цифры, одна запятая для дроби.
 * Возвращает текст для показа и число для стора (null — значимого ввода нет).
 * Ведущие нули сохраняются, «,5» превращается в «0,5».
 */
function formatAsYouType(
	raw: string,
	decimal: boolean,
): { text: string; value: number | null } {
	let int = "";
	let frac = "";
	let hasSep = false;
	for (const ch of raw) {
		if (/\d/.test(ch)) {
			if (hasSep) frac += ch;
			else int += ch;
		} else if (decimal && (ch === "," || ch === ".") && !hasSep) {
			hasSep = true;
		}
	}
	if (int === "" && !hasSep) return { text: "", value: null };

	const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP);
	const text = hasSep ? `${grouped},${frac}` : grouped;
	const value = decimal
		? Number(`${int === "" ? "0" : int}.${frac === "" ? "0" : frac}`)
		: Number.parseInt(int, 10);
	return { text, value: Number.isFinite(value) ? value : null };
}

/** Считает «значимые» символы (цифры и запятая) в начале строки до курсора. */
function significantBefore(text: string, caret: number): number {
	return text
		.slice(0, caret)
		.split("")
		.filter((ch) => /\d|,/.test(ch)).length;
}

/** Позиция курсора в отформатированном тексте после N значимых символов. */
function caretForSignificant(text: string, significant: number): number {
	let seen = 0;
	for (let i = 0; i < text.length; i++) {
		if (/[\d,]/.test(text[i] ?? "")) {
			seen++;
			if (seen >= significant) return i + 1;
		}
	}
	return text.length;
}

/**
 * Числовое поле с разделителями тысяч прямо во время ввода («1 000 000»).
 * Значение в стор уходит на каждый ввод; прижимание к min/max — на blur,
 * чтобы не ломать ввод по цифрам. Курсор сохраняет позицию относительно цифр.
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
	disabled = false,
}: NumberFieldProps) {
	// null — показываем форматированное значение из стора.
	const [draft, setDraft] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

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
		<Field
			className="min-w-0 gap-2"
			data-invalid={Boolean(error)}
			data-disabled={disabled}
		>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<div className="relative">
				<Input
					id={id}
					name={id}
					autoComplete="off"
					spellCheck={false}
					disabled={disabled}
					ref={inputRef}
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
						const raw = e.target.value;
						const { text, value: n } = formatAsYouType(raw, decimal);
						// Восстанавливаем курсор: столько же значимых символов слева от него.
						const caret =
							e.target.selectionStart !== null
								? caretForSignificant(
										text,
										significantBefore(raw, e.target.selectionStart),
									)
								: text.length;
						setDraft(text);
						if (n !== null) onChange(n);
						requestAnimationFrame(() => {
							inputRef.current?.setSelectionRange(caret, caret);
						});
					}}
					aria-invalid={Boolean(error)}
					aria-describedby={
						error ? `${id}-error` : hint ? `${id}-hint` : undefined
					}
					className={cn(
						"h-11 pr-12 tabular-nums",
						error && "border-destructive",
					)}
				/>
				{unit && (
					<span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
						{unit}
					</span>
				)}
			</div>
			{error ? (
				<FieldError id={`${id}-error`}>{error}</FieldError>
			) : hint ? (
				<FieldDescription id={`${id}-hint`}>{hint}</FieldDescription>
			) : null}
		</Field>
	);
}
