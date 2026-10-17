import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useHistoryStore } from "@/store/history";
import { useLoanStore } from "@/store/loan";

/** Сохранённые расчёты: загрузка параметров и управление историей. */
export function HistoryPanel() {
	const patch = useLoanStore((s) => s.patch);
	const { entries, remove, clear } = useHistoryStore();

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle>История расчётов</CardTitle>
				<CardDescription>
					Сохранённые сценарии хранятся в этом браузере
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				{entries.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Здесь появятся сохранённые расчёты. Нажмите «Сохранить» над
						калькулятором, чтобы добавить текущие условия.
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
									aria-label={`Удалить ${entry.label}`}
									className="size-11 text-muted-foreground hover:text-destructive"
									onClick={() => remove(entry.id)}
								>
									<Trash2 />
								</Button>
							</li>
						))}
					</ul>
				)}

				{entries.length > 1 && (
					<Button
						variant="ghost"
						size="sm"
						className="h-11 w-full"
						onClick={clear}
					>
						Очистить историю
					</Button>
				)}
			</CardContent>
		</Card>
	);
}
