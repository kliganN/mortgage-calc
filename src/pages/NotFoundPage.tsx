import { Link } from "react-router";

export default function NotFoundPage() {
	return (
		<section className="mx-auto max-w-2xl space-y-4 py-12">
			<h1 className="text-3xl font-semibold">Страница не найдена</h1>
			<p className="text-muted-foreground">
				Возможно, ссылка устарела или в адресе есть опечатка.
			</p>
			<Link to="/calculator" className="font-medium text-primary underline">
				Открыть ипотечный калькулятор
			</Link>
		</section>
	);
}
