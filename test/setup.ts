// React's cache() is a Next.js server-only API. Replace with identity for tests.
import { vi } from "vitest";
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return { ...react, cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn };
});
