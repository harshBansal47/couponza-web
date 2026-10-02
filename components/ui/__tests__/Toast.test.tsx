import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ToastProvider, { useToast } from "@/components/ui/Toast";

const onUndo = vi.fn();

function Harness() {
  const { toast } = useToast();
  return (
    <>
      <button type="button" onClick={() => toast("Copied")}>
        show
      </button>
      <button
        type="button"
        onClick={() => toast("Could not save", { type: "error", duration: 0 })}
      >
        show error
      </button>
      <button
        type="button"
        onClick={() => toast("Deleted", { action: { label: "Undo", onClick: onUndo } })}
      >
        show with action
      </button>
    </>
  );
}

function renderWithProvider() {
  return render(
    <ToastProvider>
      <Harness />
    </ToastProvider>,
  );
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("ToastProvider", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders nothing until a toast is raised", () => {
    renderWithProvider();
    expect(screen.queryByText("Copied")).not.toBeInTheDocument();
  });

  it("shows a toast when asked", () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole("button", { name: "show" }));
    expect(screen.getByText("Copied")).toBeInTheDocument();
  });

  it("announces errors as alerts", () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole("button", { name: "show error" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Could not save");
  });

  it("keeps a toast with duration 0 on screen until it is dismissed", () => {
    vi.useFakeTimers();
    renderWithProvider();
    fireEvent.click(screen.getByRole("button", { name: "show error" }));

    advance(60_000);
    expect(screen.getByText("Could not save")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByText("Could not save")).not.toBeInTheDocument();
  });

  it("auto-dismisses a toast after its duration", () => {
    vi.useFakeTimers();
    renderWithProvider();
    fireEvent.click(screen.getByRole("button", { name: "show" }));
    expect(screen.getByText("Copied")).toBeInTheDocument();

    advance(3100);
    expect(screen.queryByText("Copied")).not.toBeInTheDocument();
  });

  it("stops counting down while the toast is hovered, and resumes after", () => {
    vi.useFakeTimers();
    renderWithProvider();
    fireEvent.click(screen.getByRole("button", { name: "show" }));

    const row = screen.getByText("Copied").closest("[data-toast-id]");
    expect(row).not.toBeNull();

    fireEvent.mouseEnter(row!);
    advance(10_000);
    expect(screen.getByText("Copied")).toBeInTheDocument();

    fireEvent.mouseLeave(row!);
    advance(3100);
    expect(screen.queryByText("Copied")).not.toBeInTheDocument();
  });

  it("runs an action and removes the toast", () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole("button", { name: "show with action" }));
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(onUndo).toHaveBeenCalledOnce();
    expect(screen.queryByText("Deleted")).not.toBeInTheDocument();
  });

  it("throws a helpful error when used outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Harness />)).toThrow(/within a ToastProvider/);
    spy.mockRestore();
  });
});