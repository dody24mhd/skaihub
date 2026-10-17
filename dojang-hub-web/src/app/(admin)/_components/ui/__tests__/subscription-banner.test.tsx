import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AkademiSubscriptionStatusResponse, SubscriptionLifecycleState } from "../../../_lib/admin-api";
import SubscriptionBanner from "../subscription-banner";
import { resetSubscriptionStatus, useCanWrite } from "../subscription-status";

const getAkademiSubscriptionStatus = vi.fn();

vi.mock("../../../_lib/admin-api", () => ({
  getAkademiSubscriptionStatus: (token: string) => getAkademiSubscriptionStatus(token),
}));

type StatusFields = Pick<
  AkademiSubscriptionStatusResponse,
  "subscription_state" | "days_left" | "subscription_ends_at" | "effective_student_limit" | "active_students"
>;

function statusResponse(state: SubscriptionLifecycleState, daysLeft: number): StatusFields {
  return {
    subscription_state: state,
    days_left: daysLeft,
    subscription_ends_at: "2026-10-31T23:59:59+07:00",
    effective_student_limit: 100,
    active_students: 10,
  };
}

describe("SubscriptionBanner", () => {
  beforeEach(() => {
    resetSubscriptionStatus();
    getAkademiSubscriptionStatus.mockReset();
    localStorage.setItem("skaihub_admin_token", "token-123");
  });

  it("renders nothing while subscription is active", async () => {
    getAkademiSubscriptionStatus.mockResolvedValue(statusResponse("active", 40));

    const { container } = render(<SubscriptionBanner />);

    await waitFor(() => expect(getAkademiSubscriptionStatus).toHaveBeenCalledWith("token-123"));
    expect(container).toBeEmptyDOMElement();
  });

  it("warns when subscription is expiring", async () => {
    getAkademiSubscriptionStatus.mockResolvedValue(statusResponse("expiring", 9));

    render(<SubscriptionBanner />);

    const banner = await screen.findByTestId("subscription-banner");
    expect(banner).toHaveAttribute("data-state", "expiring");
    expect(banner).toHaveTextContent("berakhir dalam 9 hari");
  });

  it("shows remaining grace days", async () => {
    getAkademiSubscriptionStatus.mockResolvedValue(statusResponse("grace", 3));

    render(<SubscriptionBanner />);

    const banner = await screen.findByTestId("subscription-banner");
    expect(banner).toHaveAttribute("data-state", "grace");
    expect(banner).toHaveTextContent("Masa tenggang tersisa 3 hari");
  });

  it("explains read-only mode keeps viewing and export available", async () => {
    getAkademiSubscriptionStatus.mockResolvedValue(statusResponse("read_only", 0));

    render(<SubscriptionBanner />);

    const banner = await screen.findByTestId("subscription-banner");
    expect(banner).toHaveAttribute("data-state", "read_only");
    expect(banner).toHaveTextContent("Mode baca-saja");
    expect(banner).toHaveTextContent("tetap bisa dilihat dan diekspor");
  });

  it("renders nothing when status cannot be loaded", async () => {
    getAkademiSubscriptionStatus.mockRejectedValue(new Error("Request admin gagal."));

    const { container } = render(<SubscriptionBanner />);

    await waitFor(() => expect(getAkademiSubscriptionStatus).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});

describe("useCanWrite", () => {
  beforeEach(() => {
    resetSubscriptionStatus();
    getAkademiSubscriptionStatus.mockReset();
    localStorage.setItem("skaihub_admin_token", "token-123");
  });

  it("is false when the akademi is read-only", async () => {
    getAkademiSubscriptionStatus.mockResolvedValue(statusResponse("read_only", 0));

    const { result } = renderHook(() => useCanWrite());

    await waitFor(() => expect(result.current).toBe(false));
  });

  it("stays true during grace", async () => {
    getAkademiSubscriptionStatus.mockResolvedValue(statusResponse("grace", 2));

    const { result } = renderHook(() => useCanWrite());

    await waitFor(() => expect(getAkademiSubscriptionStatus).toHaveBeenCalled());
    expect(result.current).toBe(true);
  });

  it("fetches the status only once for several consumers", async () => {
    getAkademiSubscriptionStatus.mockResolvedValue(statusResponse("expiring", 5));

    render(
      <>
        <SubscriptionBanner />
        <SubscriptionBanner />
      </>,
    );

    await screen.findAllByTestId("subscription-banner");
    expect(getAkademiSubscriptionStatus).toHaveBeenCalledTimes(1);
  });
});
