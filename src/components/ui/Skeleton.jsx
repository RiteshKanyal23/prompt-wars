export default function Skeleton({ className = '', lines = 0 }) {
  if (lines > 0) {
    return (
      <div className="space-y-2" aria-hidden="true">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={['skeleton h-3.5', index === lines - 1 ? 'w-2/3' : 'w-full', className]
              .filter(Boolean)
              .join(' ')}
          />
        ))}
      </div>
    );
  }

  return <div className={['skeleton', className].filter(Boolean).join(' ')} aria-hidden="true" />;
}
