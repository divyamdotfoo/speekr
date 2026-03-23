import { renderCommandScreen } from "../../components/layout/command-screen.tsx";
import { renderSetupCompleteScreen } from "../../components/setup/setup-complete-screen.tsx";
import { runSetupFlow } from "../../components/setup/setup-wizard.tsx";
import { runConfigFlow } from "../../components/config/config-wizard.tsx";
import { isSetupComplete } from "../../db/queries.ts";

export async function runSetupCommandFlow() {
  if (isSetupComplete()) {
    const wasSaved = await runConfigFlow();
    if (!wasSaved) {
      renderCommandScreen({
        title: "Setup cancelled",
        subtitle: "setup",
        tone: "warning",
        statusLabel: "No changes applied",
        message: "Run `speekr setup` again whenever you are ready.",
      });
      return;
    }

    renderSetupCompleteScreen();
    return;
  }

  const wasSaved = await runRequiredSetupFlow("setup", true);
  if (!wasSaved) {
    return;
  }

  renderSetupCompleteScreen();
}

export async function runRequiredSetupFlow(commandName: string, showStatusScreens: boolean) {
  const wasSaved = await runSetupFlow(commandName);
  if (!wasSaved) {
    if (showStatusScreens) {
      renderCommandScreen({
        title: "Setup cancelled",
        tone: "warning",
        statusLabel: "Configuration incomplete",
        message: "Run `speekr setup` again whenever you are ready.",
      });
    }
    return false;
  }

  return true;
}
