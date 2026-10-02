import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Pagination from "@/components/Pagination";

describe("Pagination", () => {
  it("renders nothing when everything fits on one page", () => {
    const { container } = render(
      <Pagination basePath="/" searchParams={{}} skip={0} limit={20} total={10} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the correct range text", () => {
    render(<Pagination basePath="/" searchParams={{}} skip={20} limit={20} total={45} />);
    expect(screen.getByText("21–40 of 45")).toBeInTheDocument();
  });

  it("disables Previous on the first page", () => {
    render(<Pagination basePath="/" searchParams={{}} skip={0} limit={20} total={45} />);
    expect(screen.queryByRole("link", { name: "Previous" })).not.toBeInTheDocument();
    expect(screen.getByText("Previous")).toHaveAttribute("aria-disabled");
  });

  it("disables Next on the last page", () => {
    render(<Pagination basePath="/" searchParams={{}} skip={40} limit={20} total={45} />);
    expect(screen.queryByRole("link", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.getByText("Next")).toHaveAttribute("aria-disabled");
  });

  it("preserves existing search params in Next/Previous links", () => {
    render(
      <Pagination basePath="/" searchParams={{ search: "amazon" }} skip={0} limit={20} total={45} />,
    );
    const next = screen.getByRole("link", { name: "Next" });
    expect(next).toHaveAttribute("href", "/?search=amazon&skip=20");
  });

  it("omits skip=0 from the Previous link rather than writing a redundant param", () => {
    render(<Pagination basePath="/" searchParams={{}} skip={20} limit={20} total={45} />);
    const prev = screen.getByRole("link", { name: "Previous" });
    expect(prev).toHaveAttribute("href", "/");
  });
});
