interface SectionHeaderProps {
  label: string;
  title: string;
  subtitle?: string;
}

export function SectionHeader({ label, title, subtitle }: SectionHeaderProps) {
  return (
    <div>
      <p className="text-[13px] font-semibold tracking-[0.5px] text-text-muted mb-3">
        {label}
      </p>
      <h2 className="text-[clamp(28px,4vw,40px)] font-extrabold tracking-[-1.5px] mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[17px] text-text-secondary max-w-[520px] leading-[1.7] mb-14">
          {subtitle}
        </p>
      )}
    </div>
  );
}
