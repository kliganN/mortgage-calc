import { useId, useState } from "react";
import { NumberField } from "@/components/number-field";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
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
import { useRatePresetsStore } from "@/store/rate-presets";

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
	const { presets, updateRate } = useRatePresetsStore();
	const [termUnit, setTermUnit] = useState("years");
	const termId = useId();
	const paymentTypeId = useId();
	const inMonths = termUnit === "months";
	const termHint = `${input.termMonths} ${plural(input.termMonths, ["месяц", "месяца", "месяцев"])} · от 1 до 30 лет`;
	const termError = issues.get("termMonths");

	// Срок ограничен 1–30 годами; месяцы сохраняются точно, в том числе после импорта.
	const setTerm = (value: number) =>
		patch({ termMonths: Math.round(inMonths ? value : value * 12) });
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
							decimal={!inMonths}
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
						onValueChange={(value) => value && setTermUnit(value)}
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
					min={MIN_YEARS * 12}
					max={MAX_YEARS * 12}
					step={1}
					value={input.termMonths}
					onChange={(event) =>
						patch({ termMonths: Number(event.target.value) })
					}
					aria-label="Срок кредита в месяцах"
					aria-valuetext={termHint}
					aria-describedby={`${termId}-summary`}
					className="h-6 w-full cursor-pointer accent-primary"
				/>
				<FieldDescription id={`${termId}-summary`}>{termHint}</FieldDescription>
			</FieldGroup>

			<FieldGroup className="gap-3">
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
				<fieldset className="flex flex-wrap gap-2" aria-label="Примеры ставок">
					{presets.map((preset) => (
						<Button
							key={preset.id}
							type="button"
							variant={
								input.annualRate === preset.rate ? "secondary" : "outline"
							}
							className="h-11"
							onClick={() => patch({ annualRate: preset.rate })}
							aria-label={`Применить пример: ${preset.name}, ${preset.rate} процентов`}
						>
							{preset.name} · {preset.rate} %
						</Button>
					))}
				</fieldset>
				<div className="flex flex-col items-start gap-1">
					<FieldDescription>
						Примеры для расчёта. Ставку и условия уточняйте в банке.
					</FieldDescription>
					<Dialog>
						<DialogTrigger asChild>
							<Button type="button" variant="link" className="h-11 px-0">
								Изменить ставки
							</Button>
						</DialogTrigger>
						<DialogContent className="max-h-[90dvh] overflow-y-auto">
							<DialogHeader>
								<DialogTitle>Примеры ставок</DialogTitle>
								<DialogDescription>
									Задайте свои значения. Изменения сохраняются сразу; ставка
									текущего расчёта выбирается отдельно.
								</DialogDescription>
							</DialogHeader>
							<FieldGroup className="gap-4">
								{presets.map((preset) => (
									<NumberField
										key={preset.id}
										id={`rate-preset-${preset.id}`}
										label={preset.name}
										value={preset.rate}
										onChange={(value) => {
											if (value >= 0 && value <= 100)
												updateRate(preset.id, value);
										}}
										decimal
										min={0}
										max={100}
										unit="%"
										hint="От 0 до 100 % годовых"
									/>
								))}
							</FieldGroup>
							<DialogFooter>
								<DialogClose asChild>
									<Button type="button" className="h-11">
										Готово
									</Button>
								</DialogClose>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</FieldGroup>

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
					<ToggleGroupItem value="annuity" className="h-11 flex-1 px-3">
						Равные
					</ToggleGroupItem>
					<ToggleGroupItem value="differentiated" className="h-11 flex-1 px-3">
						Убывающие
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
