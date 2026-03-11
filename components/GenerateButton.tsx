"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface GenerateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export default function GenerateButton({ onClick, disabled, isLoading }: GenerateButtonProps) {
  return (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        size="lg"
        className="w-full"
      >
        {isLoading ? "Generating..." : "Generate & Download"}
      </Button>
    </motion.div>
  );
}
