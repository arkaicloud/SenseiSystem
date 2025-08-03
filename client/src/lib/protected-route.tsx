import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
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
  const { user, isLoading } = useAuth();

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Redirect to login page if not authenticated
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/login" />
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