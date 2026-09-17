import { cn } from "cn";
import { Landmark } from "lucide-react";
import { MotionConfig, motion, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface NavLinkItem {
	label: string;
	/** Куда ведёт ссылка. */
	to: string;
	/** Активна ли ссылка в текущем расположении. */
	isActive: (pathname: string) => boolean;
}

const LINKS: NavLinkItem[] = [
	{
		label: "Калькулятор",
		to: "/calculator",
		isActive: (p) => p === "/calculator",
	},
	{
		label: "Графики",
		to: "/charts",
		isActive: (p) => p === "/charts",
	},
	{
		label: "Отчёт",
		to: "/report",
		isActive: (p) => p === "/report",
	},
	{
		label: "О нас",
		to: "/about",
		isActive: (p) => p === "/about",
	},
];

/** Пружина «жидкого» перетекания капли между пунктами. */
const PILL_SPRING = { stiffness: 380, damping: 32 };

/** Пружина «линзы»: текст чуть резче капли набирает и отпускает масштаб. */
const TEXT_SPRING = { stiffness: 480, damping: 26 };

/**
 * SVG-фильтр преломления — фирменный приём «жидкого стекла» iOS 26:
 * фон за каплей искажается (лепестки шума → смещение пикселей), как будто
 * свет проходит сквозь выпуклое стекло. Подключается через
 * backdrop-filter: url(…) в .glass-pill (см. index.css);
 * браузеры без поддержки получают стеклянный blur без искажения.
 */
function GlassDistortionFilter() {
	return (
		<svg aria-hidden className="pointer-events-none absolute size-0">
			<filter
				id="nav-glass-distortion"
				x="-20%"
				y="-20%"
				width="140%"
				height="140%"
			>
				<feTurbulence
					type="fractalNoise"
					baseFrequency="0.012 0.016"
					numOctaves={2}
					seed={7}
					result="noise"
				/>
				<feDisplacementMap in="SourceGraphic" in2="noise" scale={24} />
			</filter>
		</svg>
	);
}

/**
 * Pill-навбар с каплей «жидкого стекла»: одна постоянная капля ездит по
 * пунктам на пружинах Motion (по измеренным координатам ссылок), при
 * наведении стеклянная, на активном пункте — заливается изумрудом.
 * Панель накладывается на верх страницы и уезжает вместе с ней при скролле.
 */
export function FloatingNavbar() {
	return (
		// Накладывается поверх верха страницы (absolute, не fixed): контент начинается
		// под панелью, при прокрутке уезжает вместе со страницей.
		<div className="pointer-events-none absolute inset-x-0 top-4 z-40 flex justify-center px-4 print:hidden">
			<MotionConfig reducedMotion="user">
				<nav
					aria-label="Основная навигация"
					className="pointer-events-auto flex items-center gap-1 rounded-full border border-border/70 bg-background/70 py-1.5 pr-1.5 pl-2 shadow-lg shadow-black/5 backdrop-blur-md"
				>
					<GlassDistortionFilter />
					<Link
						to="/"
						className="flex items-center gap-2 rounded-full pr-1 transition-opacity hover:opacity-80"
						aria-label="Ипотека — на главную"
					>
						<span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
							<Landmark className="size-4" />
						</span>
						<span className="hidden text-sm font-semibold tracking-tight sm:block">
							Ипотека
						</span>
					</Link>

					<span aria-hidden className="mx-1 h-5 w-px bg-border" />

					<NavLinks />

					<Button
						size="sm"
						className="ml-1 rounded-full"
						onClick={() =>
							toast.info("Аккаунты не поддерживаются", {
								description:
									"Все расчёты выполняются локально в вашем браузере",
							})
						}
					>
						Вход
					</Button>
				</nav>
			</MotionConfig>
		</div>
	);
}

/**
 * Ссылки с каплей. Ключевая архитектурная особенность: капля — один
 * постоянный элемент (никогда не размонтируется), её позиция и ширина —
 * Motion-пружины, обновляемые по offsetLeft/offsetWidth цели. Поэтому нет
 * гонок монтирования и текст активного пункта не «пропадает».
 */
function NavLinks() {
	const { pathname } = useLocation();
	const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
	const targetRef = useRef(-1);
	const [hovered, setHovered] = useState<number | null>(null);

	const activeIndex = LINKS.findIndex((l) => l.isActive(pathname));
	// Капля всегда где-то живёт: под курсором, а без курсора — на активном пункте.
	const target = hovered ?? activeIndex;

	const left = useSpring(0, PILL_SPRING);
	const width = useSpring(0, PILL_SPRING);

	const measure = (i: number) => {
		const el = linkRefs.current[i];
		if (!el) return;
		left.set(el.offsetLeft);
		width.set(el.offsetWidth);
	};

	// Капля следует за целью; пересчёт при смене маршрута и после загрузки шрифтов.
	// На страницах без активного пункта (например, лендинг) капля без курсора
	// схлопывается до нулевой ширины — не зависает залитой на последней ссылке.
	useEffect(() => {
		if (target < 0) {
			width.set(0);
		} else {
			measure(target);
		}
		targetRef.current = target;
	}, [target, pathname, width]);

	useEffect(() => {
		if (document.fonts?.ready) {
			document.fonts.ready.then(() => measure(targetRef.current));
		}
	}, []);

	// Ресайз окна/панели меняет координаты ссылок — капля доезжает заново.
	useEffect(() => {
		const container = linkRefs.current[0]?.parentElement;
		if (!container) return;
		const ro = new ResizeObserver(() => measure(targetRef.current));
		ro.observe(container);
		return () => ro.disconnect();
	}, []);

	// Заливка включается только когда капля стоит на реальном активном пункте.
	const pillOnActive = target >= 0 && target === activeIndex;

	return (
		<div
			className="relative hidden items-center md:flex"
			onMouseLeave={() => setHovered(null)}
		>
			{/* Капля: постоянный элемент, ездит по координатам пунктов.
			    Два слоя перекрёстно растворяются: стекло ↔ изумрудная заливка. */}
			<motion.div
				aria-hidden
				style={{ left, width }}
				className="absolute inset-y-1 z-0"
			>
				<motion.div
					className="absolute inset-0 rounded-full bg-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),0_1px_2px_rgba(5,46,34,0.25)]"
					initial={false}
					animate={{ opacity: pillOnActive ? 1 : 0 }}
					transition={{ duration: 0.25, ease: "easeOut" }}
				/>
				<motion.div
					className="glass-pill absolute inset-0 rounded-full"
					initial={false}
					animate={{ opacity: pillOnActive ? 0 : 1 }}
					transition={{ duration: 0.25, ease: "easeOut" }}
				/>
			</motion.div>

			{LINKS.map((link, i) => {
				const pillHere = target === i;
				return (
					<Link
						key={link.label}
						ref={(el) => {
							linkRefs.current[i] = el;
						}}
						to={link.to}
						aria-current={i === activeIndex ? "page" : undefined}
						onMouseEnter={() => setHovered(i)}
						onFocus={() => setHovered(i)}
						onBlur={() => setHovered(null)}
						className={cn(
							"relative z-10 rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-200",
							pillHere
								? i === activeIndex
									? "text-primary-foreground"
									: "text-foreground"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						{/* Текст «линзуется»: увеличивается, когда капля стекла над ним,
						    как при преломлении через выпуклую линзу. transform не меняет
						    layout — измерения капли остаются точными. */}
						<motion.span
							className="inline-block"
							initial={false}
							animate={{ scale: pillHere ? 1.09 : 1 }}
							transition={TEXT_SPRING}
						>
							{link.label}
						</motion.span>
					</Link>
				);
			})}
		</div>
	);
}
