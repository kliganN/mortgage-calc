import { useId, useState } from "react";
import { NumberField } from "@/components/number-field";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
	const years = Math.round(input.termMonths / 12);
	const termId = useId();

	// Срок ограничен 1–30 годами (правило пользователя): слайдер и поле ввода.
	const setYears = (y: number) =>
		patch({ termMonths: Math.max(MIN_YEARS, Math.min(MAX_YEARS, y)) * 12 });
	const setDownShare = (share: number) =>
		patch({ downPayment: Math.round((input.propertyPrice * share) / 100) });

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center gap-2">
				<span className="text-sm text-muted-foreground">Пресеты ставок:</span>
				{presets.map((p) => (
					<Badge
						key={p.id}
						variant={input.annualRate === p.rate ? "default" : "outline"}
						className="cursor-pointer select-none"
						onClick={() => patch({ annualRate: p.rate })}
						onDoubleClick={() => {
							const text = globalThis.prompt(
								`Ставка «${p.name}», % годовых:`,
								String(p.rate),
							);
							const n = text === null ? null : Number(text.replace(",", "."));
							if (n !== null && Number.isFinite(n) && n >= 0 && n <= 100)
								updateRate(p.id, n);
						}}
						title="Клик — применить ставку, двойной клик — изменить ставку пресета"
					>
						{p.name} · {p.rate} %
					</Badge>
				))}
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<NumberField
					id="property-price"
					label="Стоимость жилья"
					unit="₽"
					value={input.propertyPrice}
					onChange={(v) => patch({ propertyPrice: v })}
					min={100_000}
					error={issues.get("propertyPrice")}
				/>
				<div className="space-y-2">
					<NumberField
						id="down-payment"
						label="Первоначальный взнос"
						unit="₽"
						value={input.downPayment}
						onChange={(v) => patch({ downPayment: v })}
						min={0}
						hint={`${Math.round((input.downPayment / Math.max(1, input.propertyPrice)) * 100)} % от стоимости`}
						error={issues.get("downPayment")}
					/>
					<div className="flex gap-1.5">
						{DOWN_PAYMENT_SHARES.map((share) => (
							<button
								key={share}
								type="button"
								onClick={() => setDownShare(share)}
								className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
							>
								{share} %
							</button>
						))}
					</div>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor={termId}>Срок кредита</Label>
				<div className="flex items-center gap-4">
					<Slider
						id={termId}
						min={MIN_YEARS * 12}
						max={MAX_YEARS * 12}
						step={12}
						value={[
							Math.max(
								MIN_YEARS * 12,
								Math.min(
									MAX_YEARS * 12,
									Math.round(input.termMonths / 12) * 12,
								),
							),
						]}
						onValueChange={([v]) => patch({ termMonths: v })}
						className="flex-1"
						aria-label="Срок кредита в месяцах"
					/>
					<TermYearsInput years={years} onCommit={setYears} />
					<span className="text-sm text-muted-foreground">
						{years} {plural(years, ["год", "года", "лет"])}
					</span>
				</div>
				{issues.get("termMonths") && (
					<p className="text-xs text-destructive">{issues.get("termMonths")}</p>
				)}
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<NumberField
					id="annual-rate"
					label="Ставка"
					unit="%"
					value={input.annualRate}
					onChange={(v) => patch({ annualRate: v })}
					decimal
					min={0}
					max={100}
					error={issues.get("annualRate")}
				/>
				<StartMonthField />
			</div>

			<div className="space-y-2">
				<Label htmlFor="payment-type">Тип платежей</Label>
				<ToggleGroup
					type="single"
					variant="outline"
					value={input.paymentType}
					onValueChange={(v) => v && patch({ paymentType: v as PaymentType })}
					className="w-full"
				>
					<ToggleGroupItem value="annuity" className="flex-1">
						Аннуитетные
					</ToggleGroupItem>
					<ToggleGroupItem value="differentiated" className="flex-1">
						Дифференцированные
					</ToggleGroupItem>
				</ToggleGroup>
			</div>
		</div>
	);
}

/** Месяц первого платежа: нативный input[type=date], хранится как ISO-строка. */
function StartMonthField() {
	const { input, patch } = useLoanStore();
	const valid = /^\d{4}-\d{2}-\d{2}$/.test(input.startDate);
	return (
		<div className="space-y-2">
			<Label htmlFor="start-date">Дата первого платежа</Label>
			<Input
				id="start-date"
				type="date"
				value={input.startDate}
				onChange={(e) => e.target.value && patch({ startDate: e.target.value })}
			/>
			{!valid && (
				<p className="text-xs text-destructive">Укажите корректную дату</p>
			)}
		</div>
	);
}

/**
 * Поле «лет» для срока кредита: черновик во время ввода — значение можно
 * стереть полностью и ввести заново; прижимание к 1–30 происходит на blur,
 * чтобы промежуточный ввод («2» из «20») не прыгал к границам.
 */
function TermYearsInput({
	years,
	onCommit,
}: {
	years: number;
	onCommit: (years: number) => void;
}) {
	const [draft, setDraft] = useState<string | null>(null);

	return (
		<Input
			inputMode="numeric"
			value={draft ?? String(years)}
			onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 2))}
			onBlur={() => {
				const n = Number.parseInt(draft ?? "", 10);
				if (Number.isFinite(n)) onCommit(n);
				setDraft(null);
			}}
			aria-label="Срок кредита в годах"
			className="w-20"
		/>
	);
}
