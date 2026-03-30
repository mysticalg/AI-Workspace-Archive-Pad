import React from "react";

interface SaveButtonProps {
  isBusy: boolean;
  pageLabel: string;
  status: string;
  onSavePage: () => void;
  onOpenSidePanel: () => void;
}

const shellStyle: React.CSSProperties = {
  position: "fixed",
  right: "20px",
  bottom: "20px",
  zIndex: 2147483647,
  width: "280px",
  background:
    "linear-gradient(145deg, rgba(10,18,32,0.96), rgba(22,38,64,0.94))",
  color: "#f8fbff",
  borderRadius: "18px",
  padding: "14px",
  boxShadow: "0 18px 48px rgba(3, 10, 25, 0.28)",
  border: "1px solid rgba(149, 184, 255, 0.22)",
  fontFamily: '"Segoe UI Variable Display", "Segoe UI", sans-serif',
};

const primaryButtonStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderRadius: "12px",
  padding: "12px 14px",
  background: "linear-gradient(135deg, #4f8cff, #72d3ff)",
  color: "#07111f",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: "12px",
  padding: "10px 12px",
  background: "rgba(255,255,255,0.06)",
  color: "inherit",
  cursor: "pointer",
  flex: 1,
};

export function SaveButton({
  isBusy,
  pageLabel,
  status,
  onSavePage,
  onOpenSidePanel,
}: SaveButtonProps) {
  return (
    <div style={shellStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.08em", opacity: 0.72 }}>
            AI WORKSPACE ARCHIVE
          </div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{pageLabel}</div>
        </div>
        <div
          style={{
            fontSize: 12,
            padding: "6px 10px",
            borderRadius: 999,
            background: "rgba(114, 211, 255, 0.14)",
            color: "#9ce6ff",
          }}
        >
          {status}
        </div>
      </div>

      <button disabled={isBusy} onClick={onSavePage} style={primaryButtonStyle}>
        {isBusy ? "Saving..." : "Save Current Chat"}
      </button>

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button onClick={onOpenSidePanel} style={secondaryButtonStyle}>
          Open Workspace
        </button>
        <div
          style={{
            ...secondaryButtonStyle,
            cursor: "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            opacity: 0.8,
          }}
        >
          User-triggered capture only
        </div>
      </div>
    </div>
  );
}

