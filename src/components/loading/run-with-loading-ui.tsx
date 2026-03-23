import { render } from "ink";
import type { ReactElement } from "react";
import { LoadingProvider } from "./loading-provider.tsx";
import type { LoadingController } from "./loading-controller.ts";

export async function runWithLoadingUI<StepId extends string, TResult>(input: {
  controller: LoadingController<StepId>;
  renderContent: (handlers: {
    onSuccess: (result: TResult) => void;
    onError: (error: Error) => void;
  }) => ReactElement;
}) {
  return await new Promise<TResult>((resolve, reject) => {
    const instance = render(
      <LoadingProvider controller={input.controller}>
        {input.renderContent({
          onSuccess(result) {
            instance.unmount();
            resolve(result);
          },
          onError(error) {
            instance.unmount();
            reject(error);
          },
        })}
      </LoadingProvider>
    );
  });
}
