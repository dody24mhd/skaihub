import { describe, expect, it } from "vitest";
import { buildImageRemotePatterns } from "../image-remote-patterns";

const LOCAL_DEFAULTS = [
  { protocol: "http", hostname: "localhost", port: "8000", pathname: "/storage/**" },
  { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/storage/**" },
];

describe("buildImageRemotePatterns", () => {
  it("returns only the local API storage patterns when no env is set", () => {
    expect(buildImageRemotePatterns({})).toEqual(LOCAL_DEFAULTS);
  });

  it("adds the storage path of the production API derived from NEXT_PUBLIC_API_URL", () => {
    const patterns = buildImageRemotePatterns({
      NEXT_PUBLIC_API_URL: "https://skaihub-api.onrender.com/api",
    });

    expect(patterns).toContainEqual({
      protocol: "https",
      hostname: "skaihub-api.onrender.com",
      port: "",
      pathname: "/storage/**",
    });
  });

  it("adds every comma-separated asset host, keeping an optional path prefix", () => {
    const patterns = buildImageRemotePatterns({
      NEXT_PUBLIC_ASSET_HOSTS: " https://pub-abc.r2.dev , https://cdn.example.com/skaihub/ ",
    });

    expect(patterns).toContainEqual({
      protocol: "https",
      hostname: "pub-abc.r2.dev",
      port: "",
      pathname: "/**",
    });
    expect(patterns).toContainEqual({
      protocol: "https",
      hostname: "cdn.example.com",
      port: "",
      pathname: "/skaihub/**",
    });
  });

  it("ignores empty or invalid entries and duplicates", () => {
    const patterns = buildImageRemotePatterns({
      NEXT_PUBLIC_API_URL: "http://localhost:8000/api",
      NEXT_PUBLIC_ASSET_HOSTS: ",not a url,ftp://files.example.com,",
    });

    expect(patterns).toEqual(LOCAL_DEFAULTS);
  });
});
