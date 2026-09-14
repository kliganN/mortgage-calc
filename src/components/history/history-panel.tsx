import { Copy, Link2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { scenarioLabel } from "@/lib/scenario-label";
import { buildShareUrl } from "@/lib/url";
import { useHistoryStore } from "@/store/history";
import { useLoanStore } from "@/store/loan";

/** История расчётов: сохранить, скопировать ссылку, вернуться к сохранённому. */
export function HistoryPanel() {
	const input = useLoanStore((s) => s.input);
	const patch = useLoanStore((s) => s.patch);
	const { entries, save, remove, clear } = useHistoryStore();

	const copyLink = async () => {
		const url = buildShareUrl(input);
		try {
			await navigator.clipboard.writeText(url);
			toast.success("Ссылка скопирована", {
				description: "Расчёт закодирован в параметр ?s=",
			});
		} catch {
			toast.error("Не удалось скопировать", { description: url });
		}
	};

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle>История расчётов</CardTitle>
				<CardDescription>
					Сохранённые сценарии хранятся в этом браузере
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						className="flex-1"
						onClick={() => {
							save(scenarioLabel(input), input);
							toast.success("Сценарий сохранён");
						}}
					>
						<Save /> Сохранить
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="flex-1"
						onClick={copyLink}
					>
						<Link2 /> Ссылка
					</Button>
				</div>

				{entries.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Пока пусто — нажмите «Сохранить», чтобы зафиксировать текущие
						параметры.
					</p>
				) : (
					<ul className="space-y-1.5">
						{entries.map((entry) => (
							<li
								key={entry.id}
								className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
							>
								<button
									type="button"
									className="min-w-0 flex-1 text-left"
									onClick={() => {
										patch(entry.input);
										toast.success("Параметры загружены", {
											description: entry.label,
										});
									}}
									title="Загрузить параметры в калькулятор"
								>
									<span className="block truncate text-sm">{entry.label}</span>
									<span className="block text-xs text-muted-foreground">
										{new Date(entry.savedAt).toLocaleString("ru-RU", {
											day: "2-digit",
											month: "short",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</span>
								</button>
								<Button
									variant="ghost"
									size="icon"
									aria-label={`Загрузить ${entry.label}`}
									className="size-7"
									onClick={() => patch(entry.input)}
								>
									<Copy />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									aria-label={`Удалить ${entry.label}`}
									className="size-7 text-muted-foreground hover:text-destructive"
									onClick={() => remove(entry.id)}
								>
									<Trash2 />
								</Button>
							</li>
						))}
					</ul>
				)}

				{entries.length > 1 && (
					<Button variant="ghost" size="sm" className="w-full" onClick={clear}>
						Очистить историю
					</Button>
				)}
			</CardContent>
		</Card>
	);
}
