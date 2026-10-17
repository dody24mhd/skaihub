export function shouldRegisterServiceWorker(
  nodeEnv: string | undefined,
  hasServiceWorkerSupport: boolean
): boolean {
  return nodeEnv === "production" && hasServiceWorkerSupport;
}

export function isUpdateAvailable(
  registration: { waiting?: unknown } | null | undefined,
  hasController: boolean
): boolean {
  return Boolean(registration?.waiting && hasController);
}

export function handleApplyUpdate(
  registration: { waiting?: { postMessage: (msg: unknown) => void } | null } | null | undefined
): boolean {
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
    return true;
  }
  return false;
}
