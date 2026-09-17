import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

interface FaqItem {
	id: string;
	question: string;
	answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
	{
		id: "payment",
		question: "Как рассчитывается ежемесячный платёж?",
		answer:
			"Аннуитетный платёж считается по стандартной банковской формуле P = S·i·(1+i)ⁿ / ((1+i)ⁿ−1), где i — месячная ставка. Дифференцированный платёж — это тело кредита, делённое на срок, плюс проценты на остаток. Каждый платёж округляется до копейки, как в настоящем банковском графике.",
	},
	{
		id: "accuracy",
		question: "Насколько точны расчёты?",
		answer:
			"Все суммы внутри калькулятора считаются в целых копейках, без ошибок плавающей точки, поэтому график сходится до копейки. Расчёт носит предварительный характер и не является офертой — точные условия всегда уточняйте в банке.",
	},
	{
		id: "early",
		question: "Что дают досрочные платежи и какую стратегию выбрать?",
		answer:
			"Разовый или регулярный досрочный платёж уменьшает остаток долга, а дальше всё зависит от стратегии: «уменьшить срок» даёт максимальную экономию на процентах, «уменьшить платёж» снижает ежемесячную нагрузку. Попробуйте обе в блоке «Сравнение сценариев» — разница видна наглядно.",
	},
	{
		id: "storage",
		question: "Куда сохраняются мои расчёты?",
		answer:
			"История и пресеты ставок хранятся только в вашем браузере (localStorage). Сервера нет: данные никуда не отправляются и не могут утечь. Очистите данные сайта — и история исчезнет.",
	},
	{
		id: "share",
		question: "Как поделиться расчётом?",
		answer:
			"Нажмите «Ссылка» в панели истории: весь расчёт кодируется в адрес страницы, и получатель увидит ровно ваши параметры, просто открыв ссылку. Никакой базы данных — вся информация внутри самого URL.",
	},
	{
		id: "account",
		question: "Нужна ли регистрация?",
		answer:
			"Нет. Калькулятор полностью работает без аккаунтов и интернета после загрузки: расчёты, графики, экспорт в Excel и печать PDF выполняются прямо в браузере.",
	},
];

/**
 * Страница «О нас»: о проекте + FAQ-аккордеон на нативных <details>/<summary>.
 * Разметка работает и без JavaScript (браузер сам раскрывает пункты);
 * React-слой лишь превращает список в «настоящий» аккордеон — при открытии
 * одного пункта предыдущий закрывается.
 */
export default function AboutPage() {
	const [openId, setOpenId] = useState<string | null>(null);

	return (
		<div className="mx-auto max-w-2xl space-y-10 py-8">
			<section className="space-y-4 text-center">
				<h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
					О проекте
				</h1>
				<p className="text-lg text-muted-foreground">
					«Ипотека — прозрачно» — личный калькулятор ипотеки для российского
					рынка. Без регистрации и сервера: аннуитетные и дифференцированные
					платежи, досрочные погашения со снижением срока или платежа, сравнение
					сценариев и экспорт графика в Excel — всё считается прямо в браузере,
					с точностью до копейки, как в банковском графике.
				</p>
				<p className="text-sm text-muted-foreground">
					Начните с{" "}
					<Link
						to="/calculator"
						className="font-medium text-primary underline-offset-4 hover:underline"
					>
						калькулятора
					</Link>{" "}
					— или разберитесь в вопросах ниже.
				</p>
			</section>

			<section>
				<h2 className="mb-4 text-xl font-semibold tracking-tight">
					Частые вопросы
				</h2>
				{/* Каждый пункт — строка с рамкой; между строками разделители */}
				<div className="divide-y divide-border rounded-2xl border bg-card">
					{FAQ_ITEMS.map((item) => (
						<details
							key={item.id}
							open={openId === item.id}
							onToggle={(e) => {
								if (e.currentTarget.open) setOpenId(item.id);
								else if (openId === item.id) setOpenId(null);
							}}
							className="group px-5"
						>
							<summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium select-none [&::-webkit-details-marker]:hidden">
								<span>{item.question}</span>
								<span className="flex size-6 shrink-0 items-center justify-center rounded-full border bg-background">
									<ChevronDown className="size-3.5 transition-transform duration-200 group-open:rotate-180" />
								</span>
							</summary>
							<p className="pb-5 leading-relaxed text-muted-foreground">
								{item.answer}
							</p>
						</details>
					))}
				</div>
			</section>
		</div>
	);
}
