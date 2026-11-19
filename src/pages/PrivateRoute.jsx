import { Navigate, Outlet } from "react-router-dom";

function PrivateRoute({ allowedRoles }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Verifica se existe token
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Verifica o nível de acesso, caso necessário
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/acesso-negado" replace />;
  }

  return <Outlet />;
}

export default PrivateRoute;