export type PublicErrorContext = "dashboard" | "hifz" | "worship" | "journal" | "settings" | "assistant" | "general";

export type PublicErrorState = {
  code: "session_expired" | "service_unavailable" | "request_failed";
  message: string;
  canRetry: boolean;
  needsSignIn: boolean;
};

export function mapPublicHttpError(status: number, context: PublicErrorContext = "general"): PublicErrorState {
  if (status === 401 || status === 403) {
    return {
      code: "session_expired",
      message: "Your sign-in has expired. Sign in again to continue; work already saved on this device will stay here.",
      canRetry: false,
      needsSignIn: true,
    };
  }
  if (status === 502 || status === 503 || status === 504) {
    return {
      code: "service_unavailable",
      message: context === "assistant"
        ? "This optional guidance service is unavailable right now. You can still read the Qur'an and open trusted sources."
        : "This account service is temporarily unavailable. Your local work is safe; try again shortly.",
      canRetry: true,
      needsSignIn: false,
    };
  }
  return {
    code: "request_failed",
    message: "We could not finish that request. Your work has been kept where possible; try again.",
    canRetry: true,
    needsSignIn: false,
  };
}

export class PublicRequestError extends Error {
  readonly publicState: PublicErrorState;

  constructor(state: PublicErrorState) {
    super(state.message);
    this.name = "PublicRequestError";
    this.publicState = state;
  }
}
