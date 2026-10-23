import { Plus, Trash2 } from "lucide-react";
import { NumberField } from "@/components/number-field";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	type EarlyPayment,
	type EarlyPaymentStrategy,
	MAX_EARLY_PAYMENTS,
} from "@/lib/calc";
import { useLoanStore } from "@/store/loan";

const STRATEGY_LABELS: Record<EarlyPaymentStrategy, string> = {
	reduceTerm: "Уменьшить срок",
	reducePayment: "Уменьшить платёж",
};

function newEarlyPayment(termMonths: number): EarlyPayment {
	return {
		id: crypto.randomUUID(),
		monthIndex: Math.min(12, termMonths),
		amount: 100_000,
		strategy: "reduceTerm",
	};
}

/** Редактор разовых платежей и регулярной ежемесячной надбавки. */
export function EarlyPaymentsEditor({
	issues,
}: {
	issues?: Map<string, string>;
}) {
	const { input, setEarlyPayments, setRecurringExtra } = useLoanStore();
	const earlyPayments = input.earlyPayments;
	const recurring = input.recurringExtra;
	const earlyError = issues?.get("earlyPayments");
	const recurringError = issues?.get("recurringExtra");

	const update = (id: string, changes: Partial<EarlyPayment>) =>
		setEarlyPayments(
			earlyPayments.map((payment) =>
				payment.id === id ? { ...payment, ...changes } : payment,
			),
		);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Досрочное погашение</CardTitle>
				<CardDescription>
					Добавьте разовый платёж или сумму, которую готовы вносить каждый
					месяц.
				</CardDescription>
			</CardHeader>
			<CardContent className="@container flex flex-col gap-6">
				<FieldGroup className="gap-4">
					{earlyPayments.map((payment, index) => (
						<FieldGroup
							key={payment.id}
							className="gap-3 rounded-xl border bg-muted/20 p-3"
						>
							<div className="flex items-center justify-between gap-2">
								<p className="text-sm font-medium">
									Разовый платёж {index + 1}
								</p>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="size-11"
									onClick={() =>
										setEarlyPayments(
											earlyPayments.filter((item) => item.id !== payment.id),
										)
									}
									aria-label={`Удалить разовый платёж ${index + 1}`}
								>
									<Trash2 />
								</Button>
							</div>
							<div className="grid gap-3 @min-[28rem]:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
								<NumberField
									id={`early-month-${payment.id}`}
									label="Месяц платежа"
									value={payment.monthIndex}
									onChange={(value) =>
										update(payment.id, { monthIndex: value })
									}
									unit="мес."
									min={1}
									max={input.termMonths}
									error={
										!Number.isInteger(payment.monthIndex) ||
										payment.monthIndex < 1 ||
										payment.monthIndex > input.termMonths
											? earlyError
											: undefined
									}
								/>
								<NumberField
									id={`early-amount-${payment.id}`}
									label="Сумма"
									value={payment.amount}
									onChange={(value) => update(payment.id, { amount: value })}
									unit="₽"
									min={1}
									error={payment.amount <= 0 ? earlyError : undefined}
								/>
							</div>
							<StrategyField
								id={`early-strategy-${payment.id}`}
								label={`Стратегия разового платежа ${index + 1}`}
								value={payment.strategy}
								onChange={(strategy) => update(payment.id, { strategy })}
							/>
						</FieldGroup>
					))}
					{earlyError && <FieldError>{earlyError}</FieldError>}
					<Button
						type="button"
						variant="outline"
						className="h-11 w-full"
						disabled={earlyPayments.length >= MAX_EARLY_PAYMENTS}
						title={`Можно добавить до ${MAX_EARLY_PAYMENTS} разовых платежей`}
						onClick={() =>
							setEarlyPayments([
								...earlyPayments,
								newEarlyPayment(input.termMonths),
							])
						}
					>
						<Plus data-icon="inline-start" />
						Добавить разовый платёж
					</Button>
				</FieldGroup>

				<FieldGroup className="gap-4 rounded-xl border p-4">
					<div className="flex flex-col gap-1">
						<p className="text-sm font-medium">Регулярная надбавка</p>
						<FieldDescription>
							Сверх обычного платежа каждый месяц. Оставьте 0, чтобы отключить.
						</FieldDescription>
					</div>
					<NumberField
						id="recurring-amount"
						label="Ежемесячная сумма"
						value={recurring?.amount ?? 0}
						onChange={(amount) =>
							setRecurringExtra(
								amount <= 0
									? null
									: {
											amount,
											strategy: recurring?.strategy ?? "reduceTerm",
											startMonthIndex: recurring?.startMonthIndex ?? 1,
										},
							)
						}
						unit="₽"
						min={0}
						error={recurringError}
					/>
					<NumberField
						id="recurring-start"
						label="Начиная с месяца"
						value={recurring?.startMonthIndex ?? 1}
						onChange={(startMonthIndex) =>
							setRecurringExtra({
								amount: recurring?.amount ?? 0,
								strategy: recurring?.strategy ?? "reduceTerm",
								startMonthIndex,
							})
						}
						unit="мес."
						min={1}
						max={input.termMonths}
						disabled={!recurring || recurring.amount <= 0}
					/>
					<StrategyField
						id="recurring-strategy"
						label="Стратегия регулярной надбавки"
						value={recurring?.strategy ?? "reduceTerm"}
						onChange={(strategy) =>
							setRecurringExtra({
								amount: recurring?.amount ?? 0,
								strategy,
								startMonthIndex: recurring?.startMonthIndex ?? 1,
							})
						}
						disabled={!recurring || recurring.amount <= 0}
					/>
				</FieldGroup>
			</CardContent>
		</Card>
	);
}

function StrategyField({
	id,
	label,
	value,
	onChange,
	disabled = false,
}: {
	id: string;
	label: string;
	value: EarlyPaymentStrategy;
	onChange: (value: EarlyPaymentStrategy) => void;
	disabled?: boolean;
}) {
	return (
		<Field data-disabled={disabled}>
			<FieldLabel htmlFor={id}>Что уменьшать</FieldLabel>
			<Select
				value={value}
				onValueChange={(strategy) => onChange(strategy as EarlyPaymentStrategy)}
				disabled={disabled}
			>
				<SelectTrigger id={id} aria-label={label} className="h-11 w-full">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectItem value="reduceTerm">
							{STRATEGY_LABELS.reduceTerm}
						</SelectItem>
						<SelectItem value="reducePayment">
							{STRATEGY_LABELS.reducePayment}
						</SelectItem>
					</SelectGroup>
				</SelectContent>
			</Select>
		</Field>
	);
}
