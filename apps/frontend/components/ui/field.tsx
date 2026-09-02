import type { ReactNode } from "react";

const CONTROL =
  "h-12 w-full border border-line bg-paper px-3.5 text-base text-ink " +
  "transition-colors placeholder:text-ash hover:border-ash focus:border-ink " +
  "disabled:cursor-not-allowed disabled:bg-mist disabled:text-muted";

export const inputClass = CONTROL;
export const selectClass = `${CONTROL} cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%230a0a0a" stroke-width="1.5"><path d="m6 9 6 6 6-6"/></svg>')] bg-[length:20px] bg-[right_0.75rem_center] bg-no-repeat pr-11`;

/**
 * Etiqueta, control y mensaje de error de un campo.
 *
 * La etiqueta siempre es visible y nunca se sustituye por un texto de ejemplo
 * dentro del campo: al escribir, ese texto desaparece y el usuario pierde la
 * referencia de que estaba rellenando.
 */
export function Field({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  const errorId = `${htmlFor}-error`;
  const hintId = `${htmlFor}-hint`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required ? (
          <span className="ml-0.5 text-accent" aria-hidden>
            *
          </span>
        ) : null}
      </label>

      {children}

      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}

      {/* El error se anuncia junto al campo, no agrupado al principio del
          formulario, para que quien usa lector de pantalla sepa cual falla. */}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
