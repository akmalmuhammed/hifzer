"use client";

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { forwardRef, useId } from "react";
import clsx from "clsx";

type FieldSupportProps = {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  hideLabel?: boolean;
  fieldClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  errorClassName?: string;
};

export type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldSupportProps;
export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldSupportProps;

const fieldLabelClasses =
  "block text-sm font-semibold text-[color:var(--kw-ink)]";
const fieldDescriptionClasses =
  "text-xs leading-6 text-[color:var(--kw-faint)]";
const fieldErrorClasses =
  "text-sm font-medium leading-6 text-[color:var(--kw-rose-600)]";

const inputBaseClasses = [
  "w-full rounded-2xl border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)]",
  "text-[color:var(--kw-ink)] placeholder:text-[color:var(--kw-faint)]",
  "shadow-[var(--kw-shadow-soft)] backdrop-blur transition",
  "focus:bg-[color:var(--kw-surface-strong)] focus:border-[rgba(var(--kw-accent-rgb),0.55)]",
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(var(--kw-accent-rgb),0.16)]",
].join(" ");

function hasFieldContent(value: ReactNode | undefined) {
  return !(value === undefined || value === null || value === false || value === "");
}

function joinDescribedBy(...values: Array<string | undefined>) {
  const tokens = values.flatMap((value) =>
    value ? value.split(/\s+/).filter(Boolean) : [],
  );
  return tokens.length ? [...new Set(tokens)].join(" ") : undefined;
}

function hasInvalidState(
  ariaInvalid: boolean | "true" | "false" | "grammar" | "spelling" | undefined,
  error: ReactNode | undefined,
) {
  return (
    hasFieldContent(error) ||
    ariaInvalid === true ||
    ariaInvalid === "true" ||
    ariaInvalid === "grammar" ||
    ariaInvalid === "spelling"
  );
}

function renderFieldShell(props: {
  id: string;
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  hideLabel?: boolean;
  fieldClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  errorClassName?: string;
  control: ReactNode;
}) {
  const {
    id,
    label,
    description,
    error,
    hideLabel,
    fieldClassName,
    labelClassName,
    descriptionClassName,
    errorClassName,
    control,
  } = props;

  if (!hasFieldContent(label) && !hasFieldContent(description) && !hasFieldContent(error)) {
    return control;
  }

  return (
    <div className={clsx("space-y-2", fieldClassName)}>
      {hasFieldContent(label) ? (
        <label
          htmlFor={id}
          className={clsx(fieldLabelClasses, hideLabel && "sr-only", labelClassName)}
        >
          {label}
        </label>
      ) : null}
      {control}
      {hasFieldContent(description) ? (
        <p id={`${id}-description`} className={clsx(fieldDescriptionClasses, descriptionClassName)}>
          {description}
        </p>
      ) : null}
      {hasFieldContent(error) ? (
        <p
          id={`${id}-error`}
          role="alert"
          aria-live="polite"
          className={clsx(fieldErrorClasses, errorClassName)}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    id,
    label,
    description,
    error,
    hideLabel,
    fieldClassName,
    labelClassName,
    descriptionClassName,
    errorClassName,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? `kw-input-${generatedId}`;
  const invalid = hasInvalidState(ariaInvalid, error);
  const describedBy = joinDescribedBy(
    ariaDescribedBy,
    hasFieldContent(description) ? `${inputId}-description` : undefined,
    hasFieldContent(error) ? `${inputId}-error` : undefined,
  );

  const control = (
    <input
      ref={ref}
      id={inputId}
      aria-describedby={describedBy}
      aria-invalid={hasFieldContent(error) ? true : ariaInvalid}
      data-invalid={invalid ? "true" : undefined}
      className={clsx(
        inputBaseClasses,
        "h-11 px-3 text-sm",
        invalid &&
          "border-[rgba(225,29,72,0.42)] bg-[rgba(225,29,72,0.06)] focus:border-[rgba(225,29,72,0.6)] focus-visible:ring-[rgba(225,29,72,0.18)]",
        className,
      )}
      {...props}
    />
  );

  return renderFieldShell({
    id: inputId,
    label,
    description,
    error,
    hideLabel,
    fieldClassName,
    labelClassName,
    descriptionClassName,
    errorClassName,
    control,
  });
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    className,
    id,
    label,
    description,
    error,
    hideLabel,
    fieldClassName,
    labelClassName,
    descriptionClassName,
    errorClassName,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? `kw-textarea-${generatedId}`;
  const invalid = hasInvalidState(ariaInvalid, error);
  const describedBy = joinDescribedBy(
    ariaDescribedBy,
    hasFieldContent(description) ? `${textareaId}-description` : undefined,
    hasFieldContent(error) ? `${textareaId}-error` : undefined,
  );

  const control = (
    <textarea
      ref={ref}
      id={textareaId}
      aria-describedby={describedBy}
      aria-invalid={hasFieldContent(error) ? true : ariaInvalid}
      data-invalid={invalid ? "true" : undefined}
      className={clsx(
        inputBaseClasses,
        "min-h-[120px] resize-none px-3 py-2 text-sm",
        invalid &&
          "border-[rgba(225,29,72,0.42)] bg-[rgba(225,29,72,0.06)] focus:border-[rgba(225,29,72,0.6)] focus-visible:ring-[rgba(225,29,72,0.18)]",
        className,
      )}
      {...props}
    />
  );

  return renderFieldShell({
    id: textareaId,
    label,
    description,
    error,
    hideLabel,
    fieldClassName,
    labelClassName,
    descriptionClassName,
    errorClassName,
    control,
  });
});
