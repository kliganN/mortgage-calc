import { Navigate, useLocation } from "react-router";

/** Совместимость старых закладок: диаграммы теперь находятся рядом с расчётом. */
export default function ChartsPage() {
	const { search } = useLocation();
	return <Navigate to={`/calculator${search}#analytics`} replace />;
}
