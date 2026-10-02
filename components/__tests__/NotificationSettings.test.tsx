import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NotificationSettings from "@/components/account/NotificationSettings";
import type { ActionResult } from "@/app/account/actions";

/**
 * The push row is the only place in the account area where a browser permission
 * prompt can be raised, which makes its ordering rules the whole test: never ask
 * before we know push can work, never show "on" until the server has it, and
 * never leave the browser and the server disagreeing.
 */

vi.mock("@/lib/push", async () => {
  const actual = await vi.importActual<typeof import("@/lib/push")>("@/lib/push");
  return {
    ...actual,
    checkPushSupport: vi.fn(),
    currentSubscription: vi.fn(),
    subscribePush: vi.fn(),
    unsubscribePush: vi.fn(),
  };
});

import {
  checkPushSupport,
  currentSubscription,
  PushUnsupportedError,
  subscribePush,
  unsubscribePush,
} from "@/lib/push";

const mockCheck = vi.mocked(checkPushSupport);
const mockCurrent = vi.mocked(currentSubscription);
const mockSubscribe = vi.mocked(subscribePush);
const mockUnsubscribe = vi.mocked(unsubscribePush);

const ok = (message: string): ActionResult => ({ message });
const fail = (error: string): ActionResult => ({ error });

const VAPID = "BPublicKey";

type PrefsAction = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

const action = vi.fn<PrefsAction>(async () => ok("Preferences saved."));
const subscribeAction = vi.fn<PrefsAction>(async () =>
  ok("Browser notifications are on for this device."),
);
const unsubscribeAction = vi.fn<PrefsAction>(async () =>
  ok("Browser notifications are off for this device."),
);

function renderSettings(props: Partial<React.ComponentProps<typeof NotificationSettings>> = {}) {
  return render(
    <NotificationSettings
      action={action}
      subscribeAction={subscribeAction}
      unsubscribeAction={unsubscribeAction}
      initial={{ email_enabled: true, push_enabled: false, telegram_enabled: false }}
      vapidKey={VAPID}
      pushConfigured
      hasSession
      {...props}
    />,
  );
}

describe("NotificationSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheck.mockResolvedValue({ kind: "ready" });
    mockCurrent.mockResolvedValue(null);
    action.mockImplementation(async () => ok("Preferences saved."));
    subscribeAction.mockImplementation(async () =>
      ok("Browser notifications are on for this device."),
    );
    unsubscribeAction.mockImplementation(async () =>
      ok("Browser notifications are off for this device."),
    );
  });

  describe("push availability", () => {
    it("offers to turn push on when this device has no subscription", async () => {
      renderSettings();
      expect(await screen.findByRole("button", { name: /turn on for this device/i })).toBeEnabled();
    });

    it("shows the turn-off button when this device is subscribed", async () => {
      mockCurrent.mockResolvedValue({ endpoint: "https://fcm/abc" } as PushSubscription);
      renderSettings();
      expect(await screen.findByRole("button", { name: /turn off on this device/i })).toBeEnabled();
    });

    it("does not ask the browser about a subscription when push is unconfigured", async () => {
      // A consent prompt that leads nowhere is the worst outcome: the user pays
      // for permission and gets nothing.
      renderSettings({ pushConfigured: false, vapidKey: null });

      expect(await screen.findByText(/not configured on this deployment/i)).toBeInTheDocument();
      expect(mockCurrent).not.toHaveBeenCalled();
      expect(screen.queryByRole("button", { name: /turn on/i })).not.toBeInTheDocument();
    });

    it("explains an insecure origin rather than blaming the browser", async () => {
      mockCheck.mockResolvedValue({ kind: "unavailable", reason: "insecure-context" });
      renderSettings();

      expect(await screen.findByText(/push needs https/i)).toBeInTheDocument();
      expect(screen.getByText(/email alerts work everywhere/i)).toBeInTheDocument();
    });

    it("reports a denied permission without offering a dead-end retry", async () => {
      mockCheck.mockResolvedValue({ kind: "unavailable", reason: "denied" });
      renderSettings();

      expect(await screen.findByText(/blocking notifications/i)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /turn on/i })).not.toBeInTheDocument();
    });
  });

  describe("turning push on", () => {
    it("registers the subscription through a Server Action", async () => {
      const user = userEvent.setup();
      mockSubscribe.mockResolvedValue({
        endpoint: "https://fcm/abc",
        keys: { p256dh: "k", auth: "a" },
      });
      renderSettings();

      await user.click(await screen.findByRole("button", { name: /turn on for this device/i }));

      await waitFor(() => expect(subscribeAction).toHaveBeenCalled());
      const formData = subscribeAction.mock.calls[0]![1]!;
      // Passed as JSON rather than re-shaped: the API validates exactly this.
      expect(JSON.parse(formData.get("subscription") as string)).toEqual({
        endpoint: "https://fcm/abc",
        keys: { p256dh: "k", auth: "a" },
      });
    });

    it("shows the turn-off button only after the server has acknowledged", async () => {
      const user = userEvent.setup();
      mockSubscribe.mockResolvedValue({
        endpoint: "https://fcm/abc",
        keys: { p256dh: "k", auth: "a" },
      });
      renderSettings();

      await user.click(await screen.findByRole("button", { name: /turn on for this device/i }));

      expect(await screen.findByRole("button", { name: /turn off on this device/i })).toBeEnabled();
    });

    it("reports a refused permission instead of claiming push is on", async () => {
      const user = userEvent.setup();
      mockSubscribe.mockRejectedValue(new PushUnsupportedError("denied"));
      renderSettings();

      const turnOn = await screen.findByRole("button", { name: /turn on for this device/i });
      await user.click(turnOn);

      expect(await screen.findByText(/blocking notifications/i)).toBeInTheDocument();
      // Nothing was stored, because nothing worked.
      expect(subscribeAction).not.toHaveBeenCalled();
      // And no "on" button is shown — the channel is not on.
      expect(screen.queryByRole("button", { name: /turn off/i })).not.toBeInTheDocument();
    });

    it("stays off when the server rejects the subscription", async () => {
      const user = userEvent.setup();
      mockSubscribe.mockResolvedValue({
        endpoint: "https://fcm/abc",
        keys: { p256dh: "k", auth: "a" },
      });
      subscribeAction.mockImplementation(async () =>
      fail("Push is not configured on this deployment."),
    );
      renderSettings();

      await user.click(await screen.findByRole("button", { name: /turn on for this device/i }));

      expect(await screen.findByRole("alert")).toHaveTextContent(/not configured/i);
      expect(screen.queryByRole("button", { name: /turn off/i })).not.toBeInTheDocument();
    });
  });

  describe("turning push off", () => {
    it("clears both the browser subscription and the server record", async () => {
      const user = userEvent.setup();
      mockCurrent.mockResolvedValue({ endpoint: "https://fcm/abc" } as PushSubscription);
      renderSettings();

      await user.click(await screen.findByRole("button", { name: /turn off on this device/i }));

      await waitFor(() => expect(mockUnsubscribe).toHaveBeenCalled());
      await waitFor(() => expect(unsubscribeAction).toHaveBeenCalled());
    });

    it("clears the server record even when the browser unsubscribe fails", async () => {
      // A stale server-side endpoint is what produces a 410 on every future
      // alert. Not clearing it leaves the alerting broken long after the UI says
      // push is off.
      const user = userEvent.setup();
      mockCurrent.mockResolvedValue({ endpoint: "https://fcm/abc" } as PushSubscription);
      mockUnsubscribe.mockRejectedValue(new Error("already gone"));
      renderSettings();

      await user.click(await screen.findByRole("button", { name: /turn off on this device/i }));

      await waitFor(() => expect(unsubscribeAction).toHaveBeenCalled());
    });
  });

  describe("preference form", () => {
    it("never submits a push flag", async () => {
      // Push is driven by the browser, not by this form. A stale `push_enabled`
      // field would let a plain form submit re-enable a channel the user turned
      // off on the device.
      const user = userEvent.setup();
      renderSettings();

      await user.click(await screen.findByRole("button", { name: /turn on for this device/i }));
      await user.click(screen.getByRole("button", { name: /save preferences/i }));

      const formData = action.mock.calls[0]![1];
      expect(formData.get("push_enabled")).toBeNull();
    });

    it("submits the email and telegram toggles", async () => {
      const user = userEvent.setup();
      renderSettings();

      await user.click(screen.getByRole("button", { name: /save preferences/i }));

      const formData = action.mock.calls[0]![1];
      expect(formData.get("email_enabled")).toBe("true");
      expect(formData.get("telegram_enabled")).toBe("false");
    });
  });
});
