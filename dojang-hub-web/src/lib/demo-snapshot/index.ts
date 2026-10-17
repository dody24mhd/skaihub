import snapshot from "./snapshot.json";

// Static demo mode: public pages read a frozen API snapshot instead of the
// backend. Regenerate with `npm run demo:snapshot` while the local API runs.
export const IS_DEMO_SNAPSHOT = process.env.NEXT_PUBLIC_DEMO_SNAPSHOT === "1";

const SNAPSHOT: Record<string, unknown> = snapshot;

export function readSnapshot<T>(path: string): T | null {
  return (SNAPSHOT[path] as T | undefined) ?? null;
}
