export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Breadcrumbs Skeleton */}
      <div className="h-5 bg-gray-200 rounded-md dark:bg-gray-700 w-1/4"></div>

      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-10 bg-gray-300 rounded-md dark:bg-gray-600 w-80 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded-md dark:bg-gray-700 w-52"></div>
        </div>
        <div className="h-10 bg-gray-300 rounded-md dark:bg-gray-600 w-28"></div>
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="h-40 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
        ))}
      </div>
    </div>
  );
}