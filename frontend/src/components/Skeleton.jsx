export default function Skeleton({ width = '100%', height = 16, radius, style, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      aria-hidden="true"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}
