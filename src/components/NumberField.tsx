"use client";
import { forwardRef, useEffect, useRef, useState } from "react";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: number;
  onChange: (n: number) => void;
  step?: number | string;
  min?: number;
  max?: number;
  allowEmptyAsZero?: boolean;
};

/**
 * Input numerico controlado que NAO fica preso com "0" inicial:
 * - exibe string vazia quando o valor e 0 (zero so aparece depois que voce digita)
 * - seleciona o conteudo ao focar pra trocar rapido
 * - aceita string parcial ("", ".", "-") sem perder o foco
 */
const NumberField = forwardRef<HTMLInputElement, Props>(function NumberField(
  { value, onChange, allowEmptyAsZero = true, onBlur, onFocus, className, ...rest },
  ref
) {
  const focused = useRef(false);
  const [str, setStr] = useState<string>(() => (value === 0 ? "" : String(value)));

  useEffect(() => {
    if (focused.current) return;
    const next = value === 0 ? "" : String(value);
    if (next !== str) setStr(next);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <input
      ref={ref}
      {...rest}
      type="number"
      inputMode="decimal"
      value={str}
      className={className}
      onFocus={(e) => {
        focused.current = true;
        e.currentTarget.select();
        onFocus?.(e);
      }}
      onChange={(e) => {
        const v = e.target.value;
        setStr(v);
        if (v === "" || v === "-" || v === ".") {
          if (allowEmptyAsZero) onChange(0);
          return;
        }
        const n = Number(v);
        if (!Number.isNaN(n)) onChange(n);
      }}
      onBlur={(e) => {
        focused.current = false;
        if (str === "" || str === "-" || str === ".") setStr("");
        onBlur?.(e);
      }}
    />
  );
});

export default NumberField;
