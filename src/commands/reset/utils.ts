import {
  promptResetConfirmation,
  renderResetOutcomeScreen,
} from "../../components/reset/reset-flow.tsx";
import { setup } from "../../db/queries/index.ts";

export async function runResetCommandFlow() {
  const shouldReset = await promptResetConfirmation();
  if (!shouldReset) {
    renderResetOutcomeScreen({ wasReset: false });
    return;
  }

  setup.resetDatabase();
  renderResetOutcomeScreen({ wasReset: true });
}
