import React from "react";

interface SelectionToolbarProps {
  x: number;
  y: number;
  visible: boolean;
  onSaveSelection: () => void;
  onSaveSnippet: () => void;
}

export function SelectionToolbar({
  x,
  y,
  visible,
  onSaveSelection,
  onSaveSnippet,
}: SelectionToolbarProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: y,
        left: x,
        transform: "translate(-50%, calc(-100% - 12px))",
        zIndex: 2147483647,
        display: "flex",
        gap: 8,
        background: "rgba(8, 12, 20, 0.96)",
        color: "#f4f8ff",
        borderRadius: 14,
        border: "1px solid rgba(138, 176, 255, 0.26)",
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.24)",
        padding: 8,
        fontFamily: '"Segoe UI Variable Display", "Segoe UI", sans-serif',
      }}
    >
      <button
        onClick={onSaveSelection}
        style={{
          border: "none",
          borderRadius: 10,
          padding: "10px 12px",
          background: "#4f8cff",
          color: "#08121f",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Save Selection
      </button>
      <button
        onClick={onSaveSnippet}
        style={{
          border: "1px solid rgba(255,255,255,0.16)",
          borderRadius: 10,
          padding: "10px 12px",
          background: "transparent",
          color: "inherit",
          cursor: "pointer",
        }}
      >
        Save Snippet
      </button>
    </div>
  );
}

