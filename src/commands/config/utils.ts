import { renderCommandScreen } from "../../components/layout/command-screen.tsx";
import { runConfigFlow } from "../../components/config/config-wizard.tsx";

export async function runConfigCommandFlow() {
  const wasSaved = await runConfigFlow();
  if (!wasSaved) {
    renderCommandScreen({
      title: "Config cancelled",
      subtitle: "config",
      tone: "warning",
      statusLabel: "No changes applied",
      message: "Run `speekr config` again whenever you are ready.",
    });
    return;
  }
}
