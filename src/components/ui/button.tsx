"use client";

import type { ButtonHTMLAttributes, MouseEvent, ReactElement } from "react";
import { Children, cloneElement, forwardRef, isValidElement } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  asChild?: boolean;
};

function variantClasses(variant: ButtonVariant): string {
  if (variant === "secondary") {
    return "border border-transparent bg-[color:var(--kw-fill-strong)] text-[color:var(--kw-ink)] hover:bg-[color:var(--kw-hover-strong)]";
  }
  if (variant === "ghost") {
    return "border border-transparent bg-transparent text-[color:var(--kw-ink)] hover:bg-[color:var(--kw-hover-soft)]";
  }
  if (variant === "danger") {
    return "border border-transparent bg-[#d70015] text-white hover:bg-[#b80012]";
  }
  return "border border-transparent bg-[rgba(var(--kw-accent-rgb),1)] text-white hover:bg-[rgba(var(--kw-accent-rgb),0.88)]";
}

function sizeClasses(size: ButtonSize): string {
  if (size === "sm") {
    return "h-[var(--kw-control-sm-height)] rounded-[var(--kw-control-sm-radius)] px-3.5 text-sm";
  }
  if (size === "lg") {
    return "h-[var(--kw-control-lg-height)] rounded-[var(--kw-control-lg-radius)] px-6 text-[1.06rem]";
  }
  return "h-[var(--kw-control-md-height)] rounded-[var(--kw-control-md-radius)] px-5 text-[0.94rem]";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    asChild = false,
    children,
    onClick,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const buttonClasses = clsx(
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium tracking-[-0.01em] transition-[background-color,color,transform,opacity] duration-200",
    "[&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
    "active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--kw-accent-rgb),0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--kw-bg)]",
    variantClasses(variant),
    sizeClasses(size),
    className,
  );

  if (asChild) {
    const childNodes = Children.toArray(children).filter(
      (child) => !(typeof child === "string" && child.trim().length === 0),
    );

    if (childNodes.length !== 1 || !isValidElement(childNodes[0])) {
      throw new Error("Button with `asChild` requires a single React element child.");
    }

    const child = childNodes[0] as ReactElement<{
      [key: string]: unknown;
      className?: string;
      onClick?: (event: MouseEvent<HTMLElement>) => void;
      tabIndex?: number;
    }>;

    return cloneElement(child, {
      className: clsx(buttonClasses, child.props.className),
      "aria-disabled": isDisabled || undefined,
      tabIndex: isDisabled ? -1 : child.props.tabIndex,
      onClick: (event: MouseEvent<HTMLElement>) => {
        if (isDisabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        onClick?.(event as unknown as MouseEvent<HTMLButtonElement>);
        child.props.onClick?.(event);
      },
    });
  }

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={isDisabled}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          <span className="text-sm opacity-90">Working</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
});
