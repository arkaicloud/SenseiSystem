import { useAuth } from "@/hooks/use-auth";
import { Redirect, Route } from "wouter";

type AllowedRoles = "admin" | "instructor" | "student" | "any";

interface ProtectedRouteProps {
  path: string;
  component: () => React.JSX.Element;
  allowedRoles?: AllowedRoles[];
}

export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles = ["any"]
}: ProtectedRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/login" />
      </Route>
    );
  }

  if (user.status === 'pending') {
    return (
      <Route path={path}>
        <Redirect to="/awaiting-approval" />
      </Route>
    );
  }

  if (user.mustChangePassword) {
    return (
      <Route path={path}>
        <Redirect to="/change-password" />
      </Route>
    );
  }

  const hasAccess =
    allowedRoles.includes("any") ||
    (user.role && allowedRoles.includes(user.role as AllowedRoles));

  if (!hasAccess) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
