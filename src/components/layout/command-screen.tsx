import { render } from "ink";
import { MessagePanel } from "../feedback/message-panel.tsx";
import { StatusBadge } from "../feedback/status-badge.tsx";
import { AppFrame } from "./app-frame.tsx";

export function renderCommandScreen(input: {
  title: string;
  subtitle?: string;
  tone: "info" | "success" | "warning" | "danger";
  statusLabel: string;
  message: string;
}) {
  const { title, subtitle, tone, statusLabel, message } = input;
  render(
    <AppFrame title={title} subtitle={subtitle}>
      <StatusBadge tone={tone} label={statusLabel} />
      <MessagePanel tone={tone} title="Details">
        {message}
      </MessagePanel>
    </AppFrame>
  );
}
