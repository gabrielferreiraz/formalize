"use client";

import React from "react";
import { IconMinus, IconPlus, IconCheck } from "./icons";

// ── Page header with title + doc id pill
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  pillText?: string;
  pillIcon?: React.ReactNode;
  action?: React.ReactNode;
}

export function FPageHeader({ title, subtitle, pillText, pillIcon, action }: PageHeaderProps) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
      padding: "22px 0 18px",
    }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{
          margin: 0,
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          fontSize: 26,
          letterSpacing: "-0.02em",
          color: "#f1f5f9",
          lineHeight: 1.15,
        }}>{title}</h1>
        {subtitle && (
          <div style={{
            marginTop: 4,
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: "#6b7280",
            fontWeight: 400,
          }}>{subtitle}</div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {action}
        {pillText && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            borderRadius: 999,
            background: "rgba(230,184,0,0.08)",
            border: "1px solid rgba(230,184,0,0.25)",
            color: "#f5c842",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap" as const,
          }}>
            {pillIcon}
            {pillText}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Card with optional header and toolbar
interface FCardProps {
  title?: string;
  right?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  padding?: number;
  style?: React.CSSProperties;
}

export function FCard({ title, right, toolbar, children, padding = 18, style = {} }: FCardProps) {
  return (
    <section style={{
      background: "#141824",
      border: "1px solid #252d3d",
      borderRadius: 16,
      padding,
      marginBottom: 14,
      ...style,
    }}>
      {(title || right) && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: toolbar ? 10 : 16,
        }}>
          {title && (
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase" as const,
              color: "#f1f5f9",
            }}>{title}</div>
          )}
          {right}
        </div>
      )}
      {toolbar && (
        <div style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: "1px solid #252d3d",
        }}>{toolbar}</div>
      )}
      {children}
    </section>
  );
}

// ── Label above input
interface LabelProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function FFieldLabel({ children, icon }: LabelProps) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontFamily: "'Inter', sans-serif",
      fontWeight: 600,
      fontSize: 10.5,
      letterSpacing: "0.14em",
      textTransform: "uppercase" as const,
      color: "#6b7280",
      marginBottom: 8,
    }}>
      {icon}
      {children}
    </div>
  );
}

// ── Field (label + input)
interface FFieldProps {
  label: string;
  icon?: React.ReactNode;
  placeholder?: string;
  value?: string;
  suffix?: string;
  type?: string;
  onChange?: (v: string) => void;
}

export function FField({ label, icon, placeholder, value, suffix, type, onChange }: FFieldProps) {
  return (
    <div style={{ marginBottom: 14 }}>
      <FFieldLabel icon={icon}>{label}</FFieldLabel>
      <div style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        height: 48,
        background: "#1a1f2e",
        border: "1px solid #252d3d",
        borderRadius: 10,
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}>
        {icon && (
          <div style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#6b7280",
            display: "flex",
          }}>{icon}</div>
        )}
        <input
          type={type || "text"}
          placeholder={placeholder}
          defaultValue={value}
          value={onChange ? value : undefined}
          onChange={onChange ? e => onChange(e.target.value) : undefined}
          style={{
            position: "absolute",
            inset: 0,
            background: "transparent",
            border: "none",
            outline: "none",
            padding: icon ? "0 14px 0 40px" : "0 14px",
            paddingRight: suffix ? "80px" : "14px",
            color: "#f1f5f9",
            fontSize: 14,
            fontFamily: "'Inter', sans-serif",
            width: "100%",
            height: "100%",
            borderRadius: 10,
          }}
          onFocus={e => {
            e.currentTarget.parentElement!.style.borderColor = "rgba(245,200,66,0.4)";
            e.currentTarget.parentElement!.style.boxShadow = "0 0 0 3px rgba(230,184,0,0.08)";
          }}
          onBlur={e => {
            e.currentTarget.parentElement!.style.borderColor = "#252d3d";
            e.currentTarget.parentElement!.style.boxShadow = "none";
          }}
        />
        {suffix && (
          <div style={{
            position: "absolute",
            right: 14,
            color: "#6b7280",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            pointerEvents: "none",
          }}>{suffix}</div>
        )}
      </div>
    </div>
  );
}

// ── Big stepper (Duração)
interface BigStepperProps {
  value?: string;
  onDecrement?: () => void;
  onIncrement?: () => void;
}

export function FBigStepper({ value = "2h", onDecrement, onIncrement }: BigStepperProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button onClick={onDecrement} style={bigStepBtnStyle()}><IconMinus size={18} /></button>
      <div style={{
        flex: 1,
        height: 56,
        borderRadius: 12,
        background: "linear-gradient(180deg, rgba(230,184,0,0.12), rgba(230,184,0,0.06))",
        border: "1px solid rgba(230,184,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        fontSize: 22,
        color: "#f5c842",
        letterSpacing: "-0.01em",
      }}>{value}</div>
      <button onClick={onIncrement} style={bigStepBtnStyle()}><IconPlus size={18} /></button>
    </div>
  );
}

function bigStepBtnStyle(): React.CSSProperties {
  return {
    width: 56,
    height: 56,
    borderRadius: 12,
    background: "#1a1f2e",
    border: "1px solid #252d3d",
    color: "#94a3b8",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
  };
}

// ── Checkbox row
interface CheckRowProps {
  label: string;
  checked?: boolean;
  onChange?: (v: boolean) => void;
}

export function FCheckRow({ label, checked = false, onChange }: CheckRowProps) {
  return (
    <label style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      cursor: "pointer",
      padding: "4px 0",
    }}>
      <span
        onClick={() => onChange?.(!checked)}
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: checked ? "#e6b800" : "#1a1f2e",
          border: checked ? "1px solid #e6b800" : "1px solid #252d3d",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#1a1200",
          flexShrink: 0,
          cursor: "pointer",
        }}>
        {checked && <IconCheck size={14} />}
      </span>
      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase" as const,
        color: "#f1f5f9",
      }}>{label}</span>
    </label>
  );
}
