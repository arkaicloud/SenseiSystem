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

  // Redirect to login page if not authenticated
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/login" />
      </Route>
    );
  }

  // Redirect pending users to awaiting approval
  if (user.status === 'pending') {
    return (
      <Route path={path}>
        <Redirect to="/awaiting-approval" />
      </Route>
    );
  }

  // Check if user role has access
  const hasAccess = 
    allowedRoles.includes("any") || 
    (user.role && allowedRoles.includes(user.role as AllowedRoles));

  // Redirect to dashboard if authenticated but unauthorized
  if (!hasAccess) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  // If authenticated and authorized, render the component
  return <Route path={path} component={Component} />;
}