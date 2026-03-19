import { renderCommandScreen } from "../../components/layout/command-screen.tsx";
import { renderSetupCompleteScreen } from "../../components/setup/setup-complete-screen.tsx";
import { runSetupFlow } from "../../components/setup/setup-wizard.tsx";

export async function runSetupCommandFlow() {
  const wasSaved = await runSetupFlow("setup");
  if (!wasSaved) {
    renderCommandScreen({
      title: "Setup cancelled",
      tone: "warning",
      statusLabel: "Configuration incomplete",
      message: "Run `speekr setup` again whenever you are ready.",
    });
    return;
  }

  renderSetupCompleteScreen();
}
