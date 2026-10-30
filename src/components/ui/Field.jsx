export default function Field({
  id,
  label,
  hint,
  error,
  required = false,
  children,
  className = '',
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
        {required ? (
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        ) : null}
        {!required ? <span className="ml-1.5 text-xs font-normal text-slate-400">optional</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="error-text" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
