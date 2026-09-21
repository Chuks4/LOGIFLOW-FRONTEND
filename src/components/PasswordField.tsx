"use client";

import { useState, type ReactNode } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import styles from "./PasswordField.module.css";

type PasswordFieldProps = {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  labelExtra?: ReactNode;
  className?: string;
};

export default function PasswordField({
  id,
  name,
  label,
  placeholder,
  autoComplete,
  minLength,
  required,
  labelExtra,
  className,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={`${styles.field} ${className ?? ""}`}>
      <div className={styles.labelRow}>
        <label htmlFor={id}>{label}</label>
        {labelExtra}
      </div>
      <div className={styles.inputWrapper}>
        <input
          autoComplete={autoComplete}
          id={id}
          minLength={minLength}
          name={name}
          placeholder={placeholder}
          required={required}
          type={isVisible ? "text" : "password"}
        />
        <button
          aria-label={isVisible ? "Hide password" : "Show password"}
          className={styles.toggle}
          onClick={() => setIsVisible((visible) => !visible)}
          type="button"
          title={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
