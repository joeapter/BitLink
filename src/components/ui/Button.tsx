import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "dark" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border border-link-blue/30 bg-[#e6fbff] text-ink shadow-[0_16px_45px_rgba(0,174,202,0.16)] hover:-translate-y-0.5 hover:border-link-blue/45 hover:bg-[#d8f7fd] hover:text-ink focus-visible:outline-link-blue",
  secondary:
    "border border-ink/10 bg-white/78 text-ink shadow-sm backdrop-blur-xl hover:-translate-y-0.5 hover:border-link-blue/30 hover:bg-white focus-visible:outline-link-blue",
  ghost: "text-ink hover:bg-link-blue/8 hover:text-link-blue focus-visible:outline-link-blue",
  dark:
    "border border-white/70 bg-white !text-ink shadow-soft hover:-translate-y-0.5 hover:bg-[#f8fafc] hover:!text-ink focus-visible:outline-white",
  danger: "bg-rose-600 text-white shadow-sm hover:bg-rose-700 hover:text-white focus-visible:outline-rose-600",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-6 text-base",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-55",
    sizes[size],
    variants[variant],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button className={buttonClasses({ variant, size, className })} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
}
