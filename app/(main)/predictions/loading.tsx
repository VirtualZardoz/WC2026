export default function PredictionsLoading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded w-64 mb-2" />
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-80" />
      </div>

      {/* Progress bar skeleton */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-full" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-40 mr-2" />
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-44" />
      </div>

      {/* Group header skeleton */}
      <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-4" />

      {/* Match cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card">
            {/* Match header */}
            <div className="flex justify-between mb-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16" />
            </div>
            {/* Date/venue */}
            <div className="space-y-1 mb-3">
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-36" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-44" />
            </div>
            {/* Teams */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded flex-1" />
                <div className="w-16 h-10 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded flex-1" />
                <div className="w-16 h-10 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            </div>
            {/* Button */}
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-full mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
