import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// Shared visual language for every screen. Plain, prop-driven components —
// none of them hold state, so they work equally well in server and client files.

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold " +
  "transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const buttonVariants = {
  primary: "bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)] shadow-sm",
  secondary: "bg-white text-[var(--ink)] border border-[var(--border)] hover:bg-stone-50",
  outline: "bg-transparent text-[var(--brand)] border border-[var(--brand)] hover:bg-[var(--brand-light)]",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  ghost: "bg-transparent text-[var(--muted)] hover:bg-stone-100 hover:text-[var(--ink)]",
  // For a button sitting directly on a colored overlay (e.g. the scan-result card) —
  // its own variant, not a className override, since same-specificity Tailwind
  // utilities don't reliably follow DOM order.
  overlay: "bg-transparent text-white border border-white/70 hover:bg-white/10",
};

const buttonSizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5",
  lg: "px-5 py-3 text-base",
};

type Variant = keyof typeof buttonVariants;
type Size = keyof typeof buttonSizes;

export function Button({
  variant = "primary",
  size = "md",
  full,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; full?: boolean }) {
  return (
    <button
      className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], full && "w-full", className)}
      {...props}
    />
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  full,
  className,
  href,
  children,
}: {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], full && "w-full", className)}>
      {children}
    </Link>
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cx("rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm", className)}
      {...props}
    />
  );
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
      <div>
        <h2 className="font-semibold text-[var(--ink)]">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-[var(--muted)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-3 pb-1">
      <div>
        <h1 className="text-xl font-bold text-[var(--ink)]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-[var(--muted)]">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

const badgeTones = {
  brand: "bg-[var(--brand-light)] text-[var(--brand-dark)]",
  success: "bg-[var(--success-light)] text-[var(--success)]",
  warning: "bg-[var(--warning-light)] text-[var(--warning)]",
  danger: "bg-[var(--danger-light)] text-[var(--danger)]",
  neutral: "bg-stone-100 text-stone-600",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof badgeTones; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", badgeTones[tone])}>
      {children}
    </span>
  );
}

export function Field({
  name,
  label,
  type = "text",
  required = true,
  defaultValue,
  placeholder,
  min,
  max,
}: {
  name: string;
  label: ReactNode;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  placeholder?: string;
  min?: string | number;
  max?: string | number;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-[var(--ink)]">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-2.5 text-[var(--ink)] placeholder:text-stone-400 focus:border-[var(--brand)]"
      />
    </label>
  );
}

export function Select({
  name,
  label,
  defaultValue,
  value,
  onChange,
  children,
}: {
  name?: string;
  label?: ReactNode;
  defaultValue?: string;
  value?: string;
  onChange?: ComponentProps<"select">["onChange"];
  children: ReactNode;
}) {
  const select = (
    <select
      name={name}
      defaultValue={value === undefined ? defaultValue : undefined}
      value={value}
      onChange={onChange}
      className="w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-2.5 text-[var(--ink)] focus:border-[var(--brand)]"
    >
      {children}
    </select>
  );
  if (!label) return select;
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-[var(--ink)]">{label}</span>
      {select}
    </label>
  );
}

export function EmptyState({ icon, title, subtitle }: { icon?: ReactNode; title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center text-[var(--muted)]">
      {icon}
      <p className="font-medium text-[var(--ink)]">{title}</p>
      {subtitle && <p className="max-w-xs text-sm">{subtitle}</p>}
    </div>
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-light)] text-sm font-semibold text-[var(--brand-dark)]">
      {initials || "?"}
    </div>
  );
}

export function StatTile({ icon, label, value, tone = "neutral" }: { icon?: ReactNode; label: ReactNode; value: ReactNode; tone?: "danger" | "brand" | "neutral" }) {
  const valueTone = tone === "danger" ? "text-[var(--danger)]" : tone === "brand" ? "text-[var(--brand)]" : "text-[var(--ink)]";
  return (
    <Card className="flex items-center gap-3 p-4">
      {icon && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-light)] text-[var(--brand-dark)]">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs text-[var(--muted)]">{label}</p>
        <p className={cx("text-lg font-bold", valueTone)}>{value}</p>
      </div>
    </Card>
  );
}

export function Alert({ tone = "neutral", children }: { tone?: "success" | "danger" | "warning" | "neutral"; children: ReactNode }) {
  const tones = {
    success: "bg-[var(--success-light)] text-[var(--success)] border-[var(--success)]/20",
    danger: "bg-[var(--danger-light)] text-[var(--danger)] border-[var(--danger)]/20",
    warning: "bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning)]/20",
    neutral: "bg-stone-50 text-stone-700 border-[var(--border)]",
  };
  return <div className={cx("rounded-xl border px-4 py-3 text-sm", tones[tone])}>{children}</div>;
}
