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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { EarlyPayment, EarlyPaymentStrategy } from "@/lib/calc";
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

/** Редактор досрочных платежей: разовые (месяц + сумма + стратегия) и регулярная надбавка. */
export function EarlyPaymentsEditor() {
	const { input, setEarlyPayments, setRecurringExtra } = useLoanStore();
	const earlyPayments = input.earlyPayments;
	const recurring = input.recurringExtra;

	const update = (id: string, changes: Partial<EarlyPayment>) =>
		setEarlyPayments(
			earlyPayments.map((p) => (p.id === id ? { ...p, ...changes } : p)),
		);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Досрочные платежи</CardTitle>
				<CardDescription>
					Разовые платежи в выбранные месяцы и/или регулярная ежемесячная
					надбавка. Для каждого — что уменьшать: срок или ежемесячный платёж.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-3">
					{earlyPayments.map((p) => (
						<div
							key={p.id}
							className="grid grid-cols-[70px_1fr_1fr_36px] items-end gap-2 sm:grid-cols-[90px_1fr_1fr_36px]"
						>
							<NumberField
								id={`early-month-${p.id}`}
								label="Месяц"
								value={p.monthIndex}
								onChange={(v) =>
									update(p.id, { monthIndex: Math.max(1, Math.round(v)) })
								}
								unit="мес."
								min={1}
							/>
							<NumberField
								id={`early-amount-${p.id}`}
								label="Сумма"
								value={p.amount}
								onChange={(v) => update(p.id, { amount: v })}
								unit="₽"
								min={1_000}
							/>
							<div className="space-y-2">
								<span className="text-sm font-medium">Стратегия</span>
								<Select
									value={p.strategy}
									onValueChange={(v) =>
										update(p.id, { strategy: v as EarlyPaymentStrategy })
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="reduceTerm">
											{STRATEGY_LABELS.reduceTerm}
										</SelectItem>
										<SelectItem value="reducePayment">
											{STRATEGY_LABELS.reducePayment}
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() =>
									setEarlyPayments(earlyPayments.filter((x) => x.id !== p.id))
								}
								aria-label="Удалить досрочный платёж"
								className="text-muted-foreground hover:text-destructive"
							>
								<Trash2 />
							</Button>
						</div>
					))}
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							setEarlyPayments([
								...earlyPayments,
								newEarlyPayment(input.termMonths),
							])
						}
					>
						<Plus /> Добавить разовый платёж
					</Button>
				</div>

				<div className="rounded-lg border p-4">
					<div className="mb-3 flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">Регулярная надбавка</p>
							<p className="text-xs text-muted-foreground">
								Добавляется к каждому платежу, начиная с выбранного месяца
							</p>
						</div>
					</div>
					<div className="grid grid-cols-[1fr_1fr_80px] items-end gap-2">
						<NumberField
							id="recurring-amount"
							label="Сумма"
							value={recurring?.amount ?? 0}
							onChange={(v) =>
								setRecurringExtra({
									amount: v,
									strategy: recurring?.strategy ?? "reduceTerm",
									startMonthIndex: recurring?.startMonthIndex ?? 1,
								})
							}
							unit="₽"
							min={0}
						/>
						<div className="space-y-2">
							<span className="text-sm font-medium">Стратегия</span>
							<Select
								value={recurring?.strategy ?? "reduceTerm"}
								onValueChange={(v) =>
									setRecurringExtra({
										amount: recurring?.amount ?? 0,
										strategy: v as EarlyPaymentStrategy,
										startMonthIndex: recurring?.startMonthIndex ?? 1,
									})
								}
								disabled={!recurring || recurring.amount <= 0}
							>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="reduceTerm">
										{STRATEGY_LABELS.reduceTerm}
									</SelectItem>
									<SelectItem value="reducePayment">
										{STRATEGY_LABELS.reducePayment}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<NumberField
							id="recurring-start"
							label="С"
							value={recurring?.startMonthIndex ?? 1}
							onChange={(v) =>
								setRecurringExtra({
									amount: recurring?.amount ?? 0,
									strategy: recurring?.strategy ?? "reduceTerm",
									startMonthIndex: Math.max(1, Math.round(v)),
								})
							}
							unit="мес."
							min={1}
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
