"use client";

import { motion } from "framer-motion";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface ActionButtonProps extends Omit<ButtonProps, "children"> {
  label: string;
  loadingLabel?: string;
  isLoading?: boolean;
}

export default function ActionButton({
  label,
  loadingLabel,
  isLoading = false,
  disabled,
  className,
  ...props
}: ActionButtonProps) {
  return (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
      <Button
        {...props}
        disabled={disabled || isLoading}
        className={cn("w-full", className)}
      >
        {isLoading ? loadingLabel ?? label : label}
      </Button>
    </motion.div>
  );
}
