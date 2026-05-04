import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...rest }, ref) {
    return (
      <input
        ref={ref}
        {...rest}
        className={`bg-bg-0 border-line text-fg-0 focus:border-accent w-full rounded-[4px] border px-3 py-2.5 outline-none ${className}`}
      />
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = "", ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        {...rest}
        className={`bg-bg-0 border-line text-fg-0 focus:border-accent w-full rounded-[4px] border px-3 py-2.5 outline-none ${className}`}
      />
    );
  },
);
