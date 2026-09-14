import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

const ORDER = ["light", "dark", "system"] as const;
const LABELS = {
	light: "Светлая тема",
	dark: "Тёмная тема",
	system: "Системная тема",
} as const;

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	const next = () => {
		const i = ORDER.indexOf(theme as (typeof ORDER)[number]) % ORDER.length;
		setTheme(ORDER[(i + 1) % ORDER.length]);
	};

	const Icon = theme === "dark" ? Moon : theme === "system" ? Monitor : Sun;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					onClick={next}
					aria-label={`Тема: ${LABELS[theme as keyof typeof LABELS] ?? "системная"} (переключить)`}
				>
					<Icon className="size-4" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				{LABELS[theme as keyof typeof LABELS] ?? "Системная тема"}
			</TooltipContent>
		</Tooltip>
	);
}
