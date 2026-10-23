/** Тип платежа: аннуитетный или дифференцированный. */
export type PaymentType = "annuity" | "differentiated";

/** Общий бюджет редактора, расчёта и обмена ссылками. */
export const MAX_EARLY_PAYMENTS = 600;
export const MAX_EARLY_PAYMENT_ID_LENGTH = 128;

/** Стратегия досрочного погашения: уменьшить срок или уменьшить ежемесячный платёж. */
export type EarlyPaymentStrategy = "reduceTerm" | "reducePayment";

/** Разовый досрочный платёж. */
export interface EarlyPayment {
	/** Уникальный идентификатор (для React-ключей и редактирования). */
	id: string;
	/** Номер платёжного месяца, считая с 1 (первый платёж по кредиту). */
	monthIndex: number;
	/** Сумма в рублях. */
	amount: number;
	strategy: EarlyPaymentStrategy;
}

/** Регулярная ежемесячная надбавка к платежу (досрочка каждый месяц). */
export interface RecurringExtra {
	/** Сумма надбавки в рублях, добавляется к каждому плановому платежу. */
	amount: number;
	strategy: EarlyPaymentStrategy;
	/** Номер месяца, с которого начинается надбавка (по умолчанию 1). */
	startMonthIndex: number;
}

/** Параметры кредита. Все денежные поля — в рублях (на входе от пользователя). */
export interface LoanInput {
	/** Стоимость жилья, ₽. */
	propertyPrice: number;
	/** Первоначальный взнос, ₽. */
	downPayment: number;
	/** Срок кредита в месяцах. */
	termMonths: number;
	/** Ставка, % годовых (например 16.5). */
	annualRate: number;
	paymentType: PaymentType;
	/** Дата первого платежа в формате ISO «YYYY-MM-DD». */
	startDate: string;
	/** Разовые досрочные платежи. */
	earlyPayments: EarlyPayment[];
	/** Регулярная ежемесячная надбавка (null — нет). */
	recurringExtra: RecurringExtra | null;
}

/** Одна строка графика платежей. Все суммы — целые копейки. */
export interface ScheduleRow {
	/** Номер платежа, с 1. */
	monthIndex: number;
	/** Дата платежа, ISO «YYYY-MM-DD». */
	date: string;
	/** Плановый платёж за месяц (без досрочных), копейки. */
	payment: number;
	/** Проценты за месяц, копейки. */
	interest: number;
	/** Погашение тела плановым платежом, копейки. */
	principal: number;
	/** Досрочные платежи за месяц (тело сверх планового), копейки. */
	extraPaid: number;
	/** Остаток долга после всех платежей месяца, копейки. */
	remaining: number;
}

/** Результат расчёта. Все суммы — целые копейки. */
export interface ScheduleResult {
	rows: ScheduleRow[];
	/** Сумма кредита (тело), копейки. */
	loanAmount: number;
	/** Всего выплачено: плановые платежи + досрочные, копейки. */
	totalPaid: number;
	/** Всего процентов, копейки. */
	totalInterest: number;
	/** Всего досрочных платежей, копейки. */
	totalExtraPaid: number;
	/** Фактический срок: число строк графика. */
	effectiveTermMonths: number;
	/** Первый плановый платёж, копейки. */
	initialPayment: number;
	/** Последний плановый платёж, копейки. */
	finalPayment: number;
	/** Плановый платёж на конец срока (актуальный платёж), копейки. */
	currentPayment: number;
}

/** Замечание валидации параметров кредита. */
export interface LoanIssue {
	field: string;
	message: string;
}
