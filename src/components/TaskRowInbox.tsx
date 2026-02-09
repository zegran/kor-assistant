import React from "react";
import { InboxRow } from "../selectors/inbox";

type TaskRowInboxProps = {
  row: InboxRow;
  onOpen: (id: string) => void;
};

export const TaskRowInbox: React.FC<TaskRowInboxProps> = ({ row, onOpen }) => {
  const line = `${row.nodeTitle} | ${row.reminder} | ${row.statusLabel} | ${row.due}`;

  return (
    <button
      type="button"
      onClick={() => onOpen(row.id)}
      style={{
        height: "56px",
        width: "100%",
        display: "flex",
        alignItems: "center",
        border: "none",
        background: "transparent",
        textAlign: "left",
      }}
    >
      <span className="marquee-on-overflow">{line}</span>
    </button>
  );
};
