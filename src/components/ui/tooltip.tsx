import React, { ReactNode } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <div className="relative group">
      {children}
      <div
        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-sm p-1 rounded w-40 text-center"
        style={{ color: "#374151", backgroundColor: "#e5e7eb" }}
      >
        {content}
      </div>
    </div>
  );
}
