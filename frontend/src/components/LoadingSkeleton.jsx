export default function LoadingSkeleton({ height = 16, width = "100%" }) {
  return (
    <div
      className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded"
      style={{ height, width }}
    ></div>
  );
}
