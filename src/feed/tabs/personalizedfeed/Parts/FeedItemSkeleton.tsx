export const FeedItemSkeleton = () => (
  <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 md:p-6 w-full animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-700 rounded w-24"></div>
          <div className="h-3 bg-gray-700 rounded w-32"></div>
        </div>
      </div>
      <div className="h-6 bg-gray-700 rounded w-16"></div>
    </div>
    <div className="h-48 bg-gray-700 rounded-xl mb-4"></div>
    <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
    <div className="flex gap-4 pt-4 border-t border-gray-700">
      <div className="h-8 bg-gray-700 rounded w-16"></div>
      <div className="h-8 bg-gray-700 rounded w-16"></div>
      <div className="h-8 bg-gray-700 rounded w-16"></div>
    </div>
  </div>
);