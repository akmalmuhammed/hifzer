import type { ConsoleMessage, Page } from "@playwright/test";

export type PageErrorCapture = {
  consoleErrors: string[];
  pageErrors: string[];
  detach: () => void;
};

function formatConsoleMessage(message: ConsoleMessage): string {
  const location = message.location();
  const locationText = location.url ? `${location.url}:${location.lineNumber ?? 0}` : "unknown";
  return `[console.${message.type()}] ${message.text()} (${locationText})`;
}

export function capturePageErrors(page: Page): PageErrorCapture {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  const onConsole = (message: ConsoleMessage) => {
    if (message.type() === "error") {
      consoleErrors.push(formatConsoleMessage(message));
    }
  };

  const onPageError = (error: Error) => {
    pageErrors.push(error.message);
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  return {
    consoleErrors,
    pageErrors,
    detach() {
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
    },
  };
}

