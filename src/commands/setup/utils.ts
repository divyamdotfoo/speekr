import { renderCommandScreen } from "../../components/layout/command-screen.tsx";
import { renderSetupCompleteScreen } from "../../components/setup/setup-complete-screen.tsx";
import { runSetupFlow } from "../../components/setup/setup-wizard.tsx";

export async function runSetupCommandFlow() {
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
