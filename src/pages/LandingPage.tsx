import { Navigate, useLocation } from "react-router";

/** Личный инструмент открывается сразу; старые ссылки с параметрами сохраняются. */
export default function LandingPage() {
	const { search } = useLocation();
	return <Navigate to={`/calculator${search}`} replace />;
}
