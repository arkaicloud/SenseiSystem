export default function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-muted dark:bg-muted rounded"></div>
        <div className="h-8 w-32 bg-muted dark:bg-muted rounded"></div>
      </div>
      
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted dark:bg-muted rounded-lg"></div>
        ))}
      </div>
      
      {/* Main content skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="h-6 w-36 bg-muted dark:bg-muted rounded"></div>
          <div className="h-48 bg-muted dark:bg-muted rounded-lg"></div>
        </div>
        <div className="space-y-4">
          <div className="h-6 w-40 bg-muted dark:bg-muted rounded"></div>
          <div className="h-48 bg-muted dark:bg-muted rounded-lg"></div>
        </div>
      </div>
      
      {/* Additional content skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-44 bg-muted dark:bg-muted rounded"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-muted dark:bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
}