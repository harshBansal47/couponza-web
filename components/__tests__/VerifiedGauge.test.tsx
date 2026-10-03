import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import VerifiedGauge from "@/components/VerifiedGauge";

describe("VerifiedGauge", () => {
  it("shows an honest 'not verified' state when nobody has reported", () => {
    render(<VerifiedGauge rate={null} reports={0} />);
    expect(screen.getByRole("img", { name: /not verified yet/i })).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("does not invent a rate when reports are zero even if a rate is passed", () => {
    render(<VerifiedGauge rate={0.9} reports={0} />);
    expect(screen.getByRole("img", { name: /not verified yet/i })).toBeInTheDocument();
  });

  it("describes the real numbers for assistive tech", () => {
    render(<VerifiedGauge rate={0.92} reports={48} />);
    expect(screen.getByRole("img", { name: "92% of 48 reports say it worked" })).toBeInTheDocument();
  });

  it("uses the singular for a single report", () => {
    render(<VerifiedGauge rate={1} reports={1} />);
    expect(screen.getByRole("img", { name: "100% of 1 report say it worked" })).toBeInTheDocument();
  });

  it("counts up to the final value", async () => {
    render(<VerifiedGauge rate={0.8} reports={10} />);
    await waitFor(() => expect(screen.getByText("80%")).toBeInTheDocument(), { timeout: 2000 });
  });
});
