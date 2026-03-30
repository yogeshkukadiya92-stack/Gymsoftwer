type SectionCardProps = {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  eyebrow,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section
      className={`overflow-hidden rounded-[2rem] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)] backdrop-blur ${className}`}
    >
      <div className="mb-5 border-b border-slate-200/80 pb-4">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 font-serif text-[1.85rem] leading-tight text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}
