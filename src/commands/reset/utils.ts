import {
  promptResetConfirmation,
  renderResetOutcomeScreen,
} from "../../components/reset/reset-flow.tsx";
import { resetDatabase } from "../../db/queries.ts";

export async function runResetCommandFlow() {
  const shouldReset = await promptResetConfirmation();
  if (!shouldReset) {
    renderResetOutcomeScreen({ wasReset: false });
    return;
  }

  resetDatabase();
  renderResetOutcomeScreen({ wasReset: true });
}
