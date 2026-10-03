export default function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`shimmer rounded-xl ${className}`} />;
}
