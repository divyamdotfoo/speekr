export type LoadingStepState = "pending" | "active" | "done";

export type LoadingStep<StepId extends string> = {
  id: StepId;
  label: string;
};

export type LoadingChecklistItem<StepId extends string> = {
  id: StepId;
  label: string;
  state: LoadingStepState;
};

export type LoadingStatus = "idle" | "running" | "success" | "error";

export type LoadingState<StepId extends string> = {
  visible: boolean;
  title: string;
  subtitle?: string;
  step: StepId | null;
  message: string;
  hint?: string;
  logs: string[];
  checklist: LoadingChecklistItem<StepId>[];
  status: LoadingStatus;
  errorMessage?: string;
};

export type LoadingShowConfig<StepId extends string> = {
  title: string;
  subtitle?: string;
  steps: ReadonlyArray<LoadingStep<StepId>>;
  initialStep: StepId;
  message: string;
  hint?: string;
  maxLogs?: number;
};

export type LoadingUpdatePatch<StepId extends string> = {
  step?: StepId;
  message?: string;
  hint?: string;
  status?: LoadingStatus;
};

export type LoadingController<StepId extends string> = {
  getState: () => LoadingState<StepId>;
  subscribe: (listener: () => void) => () => void;
  showLoadingUI: (config: LoadingShowConfig<StepId>) => void;
  updateLoadingUI: (patch: LoadingUpdatePatch<StepId>) => void;
  appendLoadingLog: (line: string) => void;
  completeLoadingUI: (patch?: LoadingUpdatePatch<StepId>) => void;
  failLoadingUI: (error: Error, patch?: LoadingUpdatePatch<StepId>) => void;
  hideLoadingUI: () => void;
};

export function createLoadingController<StepId extends string>(): LoadingController<StepId> {
  const listeners = new Set<() => void>();
  let steps: ReadonlyArray<LoadingStep<StepId>> = [];
  let maxLogs = DEFAULT_LOG_LINES;
  let state = createInitialState<StepId>();

  return {
    getState() {
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    showLoadingUI(config) {
      steps = config.steps;
      maxLogs = config.maxLogs ?? DEFAULT_LOG_LINES;
      state = {
        visible: true,
        title: config.title,
        subtitle: config.subtitle,
        step: config.initialStep,
        message: config.message,
        hint: config.hint,
        logs: [],
        checklist: toChecklistItems(steps, config.initialStep),
        status: "running",
        errorMessage: undefined,
      };
      emit(listeners);
    },
    updateLoadingUI(patch) {
      const nextStep = patch.step ?? state.step;
      state = {
        ...state,
        step: nextStep,
        message: patch.message ?? state.message,
        hint: patch.hint ?? state.hint,
        status: patch.status ?? state.status,
        checklist: nextStep ? toChecklistItems(steps, nextStep) : state.checklist,
      };
      emit(listeners);
    },
    appendLoadingLog(line) {
      state = {
        ...state,
        logs: [...state.logs, line].slice(-maxLogs),
      };
      emit(listeners);
    },
    completeLoadingUI(patch) {
      const nextStep = patch?.step ?? state.step;
      state = {
        ...state,
        step: nextStep,
        message: patch?.message ?? state.message,
        hint: patch?.hint,
        status: "success",
        checklist: nextStep
          ? toChecklistItems(steps, nextStep, true)
          : state.checklist,
      };
      emit(listeners);
    },
    failLoadingUI(error, patch) {
      const nextStep = patch?.step ?? state.step;
      state = {
        ...state,
        step: nextStep,
        message: patch?.message ?? state.message,
        hint: patch?.hint ?? state.hint,
        status: "error",
        errorMessage: error.message,
        checklist: nextStep ? toChecklistItems(steps, nextStep) : state.checklist,
      };
      emit(listeners);
    },
    hideLoadingUI() {
      state = {
        ...state,
        visible: false,
      };
      emit(listeners);
    },
  };
}

function createInitialState<StepId extends string>(): LoadingState<StepId> {
  return {
    visible: false,
    title: "",
    subtitle: undefined,
    step: null,
    message: "",
    hint: undefined,
    logs: [],
    checklist: [],
    status: "idle",
    errorMessage: undefined,
  };
}

function toChecklistItems<StepId extends string>(
  steps: ReadonlyArray<LoadingStep<StepId>>,
  activeStep: StepId,
  markActiveDone = false
): LoadingChecklistItem<StepId>[] {
  const activeIndex = steps.findIndex((item) => item.id === activeStep);

  return steps.map((step, index) => {
    if (activeIndex === -1) {
      return { ...step, state: "pending" as const };
    }
    if (index < activeIndex) {
      return { ...step, state: "done" as const };
    }
    if (index === activeIndex) {
      if (markActiveDone) {
        return { ...step, state: "done" as const };
      }
      return { ...step, state: "active" as const };
    }
    return { ...step, state: "pending" as const };
  });
}

function emit(listeners: Set<() => void>) {
  for (const listener of listeners) {
    listener();
  }
}

const DEFAULT_LOG_LINES = 6;
