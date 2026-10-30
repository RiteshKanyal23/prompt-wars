import Container from './Container';

export default function PageHeader({ eyebrow, title, description, actions, children }) {
  return (
    <div className="border-b border-slate-200/70 bg-white">
      <Container className="py-8 sm:py-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            {eyebrow ? (
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">{eyebrow}</p>
            ) : null}
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            {description ? (
              <p className="mt-3 text-[15px] leading-6 text-slate-600 sm:text-base">{description}</p>
            ) : null}
            {children}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </Container>
    </div>
  );
}
