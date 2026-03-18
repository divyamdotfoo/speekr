import { render } from "ink";
import { runInitialSetup } from "../../db/queries.ts";
import type { ProficiencyLevel } from "../../types/index.ts";
import { SetupWizard } from "../../components/setup/setup-wizard.tsx";

type SetupInput = {
  username: string;
  language: string;
  proficiency: ProficiencyLevel;
};

export async function runSetupFlow(commandName: string): Promise<boolean> {
  if (!process.stdin.isTTY) {
    return false;
  }

  return await new Promise<boolean>((resolve) => {
    const instance = render(
      <SetupWizard
        commandName={commandName}
        onCancel={() => {
          instance.unmount();
          resolve(false);
        }}
        onSubmit={async (answers: SetupInput) => {
          runInitialSetup(answers);
          instance.unmount();
          resolve(true);
        }}
      />,
    );
  });
}
