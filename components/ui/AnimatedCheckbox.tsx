"use client";
import React from "react";
import { motion, AnimatePresence } from "motion/react";

type Color = "primary" | "emerald" | "rose" | "fuchsia" | "blue" | "teal";

interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: Color;
}

const colorMap: Record<Color, { box: string; glow: string; tick: string }> = {
  primary: { box: "bg-primary border-primary", glow: "shadow-primary/40", tick: "text-white" },
  emerald: { box: "bg-emerald-500 border-emerald-500", glow: "shadow-emerald-500/40", tick: "text-white" },
  rose: { box: "bg-rose-500 border-rose-500", glow: "shadow-rose-500/40", tick: "text-white" },
  fuchsia: { box: "bg-fuchsia-500 border-fuchsia-500", glow: "shadow-fuchsia-500/40", tick: "text-white" },
  blue: { box: "bg-blue-500 border-blue-500", glow: "shadow-blue-500/40", tick: "text-white" },
  teal: { box: "bg-teal-500 border-teal-500", glow: "shadow-teal-500/40", tick: "text-white" },
};

export const AnimatedCheckbox = ({
  checked,
  onChange,
  color = "primary",
}: AnimatedCheckboxProps) => {
  const c = colorMap[color];

  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={() => onChange(!checked)}
      className="relative shrink-0 flex items-center justify-center size-4.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b10] focus-visible:ring-primary/60"
    >
      {/* Box */}
      <motion.span
        className={[
          "absolute inset-0 rounded-[5px] border transition-colors duration-200",
          checked
            ? `${c.box} shadow-[0_0_10px_2px_var(--tw-shadow-color)] ${c.glow}`
            : "border-[#3b3b4f] bg-[#0b0b10]",
        ].join(" ")}
        animate={{ scale: checked ? [1, 0.82, 1] : 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      />

      {/* Tick */}
      <AnimatePresence initial={false}>
        {checked && (
          <motion.svg
            key="tick"
            className={`absolute w-2.5 h-2.5 ${c.tick} pointer-events-none`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3.5}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <motion.path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </button>
  );
};
