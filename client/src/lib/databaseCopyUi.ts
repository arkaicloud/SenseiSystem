export type DatabaseCopyUiStatus = "idle" | "running" | "success" | "error";

export function getDatabaseCopyUiStatus(
  jobStatus: "running" | "success" | "error" | undefined,
  isStarting: boolean,
): DatabaseCopyUiStatus {
  if (isStarting || jobStatus === "running") return "running";
  return jobStatus || "idle";
}

export function shouldShowDatabaseOperations(canAccess: boolean | undefined): boolean {
  return canAccess === true;
}