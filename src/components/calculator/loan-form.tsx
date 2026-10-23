import { useId, useState } from "react";
import { NumberField } from "@/components/number-field";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { PaymentType } from "@/lib/calc";
import { plural } from "@/lib/format";
import { useLoanStore } from "@/store/loan";

const DOWN_PAYMENT_SHARES = [15, 20, 30, 50];

/** Границы срока кредита в годах (правило пользователя). */
const MIN_YEARS = 1;
const MAX_YEARS = 30;

interface LoanFormProps {
	/** Замечания валидации по имени поля. */
	issues: Map<string, string>;
}

export function LoanForm({ issues }: LoanFormProps) {
	const { input, patch } = useLoanStore();
	const [preferredTermUnit, setTermUnit] = useState("years");
	// Неполные годы после загрузки показываем точно в месяцах, без скрытого округления.
	const termUnit = input.termMonths % 12 === 0 ? preferredTermUnit : "months";
	if (termUnit !== preferredTermUnit) setTermUnit(termUnit);
	const termId = useId();
	const paymentTypeId = useId();
	const inMonths = termUnit === "months";
	const termHint = `${input.termMonths} ${plural(input.termMonths, ["месяц", "месяца", "месяцев"])} · от 1 до 30 лет`;
	const termError = issues.get("termMonths");

	// Срок ограничен 1–30 годами; месяцы сохраняются точно, в том числе после импорта.
	const setTerm = (value: number) =>
		patch({ termMonths: Math.round(value) * (inMonths ? 1 : 12) });
	const setDownShare = (share: number) =>
		patch({ downPayment: Math.round((input.propertyPrice * share) / 100) });

	return (
		<FieldGroup className="gap-6">
			<NumberField
				id="property-price"
				label="Стоимость жилья"
				unit="₽"
				value={input.propertyPrice}
				onChange={(value) => patch({ propertyPrice: value })}
				min={100_000}
				error={issues.get("propertyPrice")}
			/>
			<FieldGroup className="gap-2">
				<NumberField
					id="down-payment"
					label="Первоначальный взнос"
					unit="₽"
					value={input.downPayment}
					onChange={(value) => patch({ downPayment: value })}
					min={0}
					hint={`${Math.round((input.downPayment / Math.max(1, input.propertyPrice)) * 100)} % от стоимости жилья`}
					error={issues.get("downPayment")}
				/>
				<div className="flex flex-wrap gap-2">
					{DOWN_PAYMENT_SHARES.map((share) => (
						<Button
							key={share}
							type="button"
							variant="outline"
							className="h-11 flex-1"
							onClick={() => setDownShare(share)}
							aria-label={`Первоначальный взнос ${share} процентов`}
						>
							{share} %
						</Button>
					))}
				</div>
			</FieldGroup>

			<FieldGroup className="gap-3">
				<div className="flex items-end gap-3">
					<div className="min-w-0 flex-1">
						<NumberField
							key={termUnit}
							id={termId}
							label="Срок кредита"
							value={inMonths ? input.termMonths : input.termMonths / 12}
							onChange={setTerm}
							min={inMonths ? MIN_YEARS * 12 : MIN_YEARS}
							max={inMonths ? MAX_YEARS * 12 : MAX_YEARS}
							unit={inMonths ? "мес." : "лет"}
							error={termError}
						/>
					</div>
					<ToggleGroup
						type="single"
						variant="outline"
						value={termUnit}
						onValueChange={(value) => {
							if (!value) return;
							if (value === "years") {
								patch({ termMonths: Math.round(input.termMonths / 12) * 12 });
							}
							setTermUnit(value);
						}}
						aria-label="Единицы срока кредита"
						className="shrink-0 self-start pt-6"
					>
						<ToggleGroupItem value="years" className="h-11 px-3">
							Лет
						</ToggleGroupItem>
						<ToggleGroupItem value="months" className="h-11 px-3">
							Мес.
						</ToggleGroupItem>
					</ToggleGroup>
				</div>
				<input
					type="range"
					min={inMonths ? MIN_YEARS * 12 : MIN_YEARS}
					max={inMonths ? MAX_YEARS * 12 : MAX_YEARS}
					step={1}
					value={inMonths ? input.termMonths : input.termMonths / 12}
					onChange={(event) => setTerm(Number(event.target.value))}
					aria-label={
						inMonths ? "Срок кредита в месяцах" : "Срок кредита в годах"
					}
					aria-valuetext={termHint}
					aria-describedby={`${termId}-summary`}
					className="h-6 w-full cursor-pointer accent-primary"
				/>
				<FieldDescription id={`${termId}-summary`}>{termHint}</FieldDescription>
			</FieldGroup>

			<NumberField
				id="annual-rate"
				label="Процентная ставка"
				unit="%"
				value={input.annualRate}
				onChange={(value) => patch({ annualRate: value })}
				decimal
				min={0}
				max={100}
				error={issues.get("annualRate")}
			/>

			<StartMonthField error={issues.get("startDate")} />

			<Field data-invalid={Boolean(issues.get("paymentType"))}>
				<FieldLabel id={paymentTypeId}>Тип платежей</FieldLabel>
				<ToggleGroup
					type="single"
					variant="outline"
					value={input.paymentType}
					onValueChange={(value) =>
						value && patch({ paymentType: value as PaymentType })
					}
					className="w-full flex-wrap"
					aria-labelledby={paymentTypeId}
					aria-describedby={`${paymentTypeId}-hint`}
				>
					<ToggleGroupItem
						value="annuity"
						className="h-11 flex-1 basis-48 px-3"
					>
						Аннуитетные
					</ToggleGroupItem>
					<ToggleGroupItem
						value="differentiated"
						className="h-11 flex-1 basis-48 px-3"
					>
						Дифференцированные
					</ToggleGroupItem>
				</ToggleGroup>
				<FieldDescription id={`${paymentTypeId}-hint`}>
					{input.paymentType === "annuity"
						? "Аннуитетные: одинаковый платёж каждый месяц."
						: "Дифференцированные: платёж выше в начале и уменьшается со временем."}
				</FieldDescription>
			</Field>
		</FieldGroup>
	);
}

/** Дата первого платежа хранится как ISO-строка; ошибка приходит из общей валидации. */
function StartMonthField({ error }: { error?: string }) {
	const { input, patch } = useLoanStore();
	return (
		<Field data-invalid={Boolean(error)}>
			<FieldLabel htmlFor="start-date">Дата первого платежа</FieldLabel>
			<Input
				id="start-date"
				type="date"
				value={input.startDate}
				onChange={(event) => patch({ startDate: event.target.value })}
				aria-invalid={Boolean(error)}
				aria-describedby={error ? "start-date-error" : undefined}
				className="h-11 min-w-0"
			/>
			{error && <FieldError id="start-date-error">{error}</FieldError>}
		</Field>
	);
}
