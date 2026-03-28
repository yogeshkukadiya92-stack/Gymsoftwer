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
      className={`rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)] backdrop-blur ${className}`}
    >
      <div className="mb-5">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 font-serif text-2xl text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}
