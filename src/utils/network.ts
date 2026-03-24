export const OFFLINE_MESSAGE =
  "No internet connection. Please check your network and try again.";

export function isBrowserOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(
        new Error(isBrowserOffline() ? OFFLINE_MESSAGE : timeoutMessage)
      );
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

export function getOfflineAwareMessage(
  error: unknown,
  fallbackMessage: string
) {
  if (isBrowserOffline()) {
    return OFFLINE_MESSAGE;
  }

  if (error instanceof Error && error.message.trim()) {
    const loweredMessage = error.message.toLowerCase();

    if (
      loweredMessage.includes("offline") ||
      loweredMessage.includes("internet") ||
      loweredMessage.includes("network")
    ) {
      return OFFLINE_MESSAGE;
    }

    return error.message;
  }

  return fallbackMessage;
}
