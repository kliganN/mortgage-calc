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
			"Аннуитетный платёж: P = S·i·(1+i)ⁿ / ((1+i)ⁿ−1), где S — сумма кредита, i — годовая ставка, делённая на 12 и на 100, n — число месяцев. При нулевой ставке P = S/n. Дифференцированный платёж — доля основного долга плюс проценты на остаток. Проценты и платежи округляются до копейки за каждый месяц.",
	},
	{
		id: "accuracy",
		question: "Насколько точны расчёты?",
		answer:
			"Все суммы внутри калькулятора считаются в целых копейках, с округлением процентов и платежей до копейки. Расчёт носит предварительный характер и не является офертой — точные условия всегда уточняйте в банке.",
	},
	{
		id: "early",
		question: "Что дают досрочные платежи и какую стратегию выбрать?",
		answer:
			"Разовый или регулярный досрочный платёж уменьшает остаток долга. При одинаковых суммах и датах досрочных платежей сохранение планового платежа с сокращением срока обычно сильнее уменьшает проценты. Уменьшение платежа снижает обязательную ежемесячную нагрузку. Сравните оба варианта при своих условиях в блоке «Сравнение сценариев».",
	},
	{
		id: "storage",
		question: "Куда сохраняются мои расчёты?",
		answer:
			"История хранится в вашем браузере (localStorage), а расчёты выполняются локально. Любой человек с доступом к этому профилю браузера может открыть историю. Очистка данных сайта удалит её. Если вы открываете ссылку с расчётом, параметры находятся в URL и могут попасть в историю браузера и журналы хостинга или CDN.",
	},
	{
		id: "share",
		question: "Как поделиться расчётом?",
		answer:
			"Нажмите «Поделиться» над калькулятором: весь расчёт кодируется в адрес страницы, и получатель увидит ровно ваши параметры, просто открыв ссылку. Никакой базы данных — вся информация внутри самого URL.",
	},
	{
		id: "account",
		question: "Нужна ли регистрация?",
		answer:
			"Нет. Регистрация не требуется. Все функции работают в браузере: расчёты, графики, экспорт в Excel и печать PDF выполняются прямо в браузере.",
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
					сценариев и экспорт графика в Excel — всё считается прямо в браузере.
					Расчёт предварительный: конкретный банк может учитывать фактическое
					число дней, страховки и комиссии.
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
