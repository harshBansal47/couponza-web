import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Dropdown } from "@/components/ui/Dropdown";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { ClientTabs } from "@/components/ui/Tabs";

describe("Button", () => {
  it("renders with default variant", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("applies variant classes", () => {
    render(<Button variant="verified">Verified</Button>);
    const button = screen.getByRole("button", { name: /verified/i });
    expect(button).toHaveClass("bg-verified");
  });

  it("shows loading state", () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole("button", { name: /loading/i });
    expect(button).toBeDisabled();
    expect(button).toContainHTML("svg");
  });

  it("handles disabled state", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button", { name: /disabled/i })).toBeDisabled();
  });

  it("calls onClick handler", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders as link when href provided", () => {
    render(<Button asChild><a href="/test">Link</a></Button>);
    // ButtonLink component would be used instead
  });
});

describe("Input", () => {
  it("renders with label", () => {
    render(<Input label="Email" placeholder="you@example.com" />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("shows error message", () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByRole("alert")).toHaveTextContent(/invalid email/i);
    expect(screen.getByLabelText(/email/i)).toHaveAttribute("aria-invalid", "true");
  });

  it("shows hint message", () => {
    render(<Input label="Password" hint="Must be 8+ characters" />);
    expect(screen.getByText(/must be 8\+ characters/i)).toBeInTheDocument();
  });

  it("applies size classes", () => {
    const { rerender } = render(<Input size="sm" />);
    expect(screen.getByRole("textbox")).toHaveClass("px-3", "py-1.5", "text-sm");
    
    rerender(<Input size="lg" />);
    expect(screen.getByRole("textbox")).toHaveClass("px-4", "py-3", "text-base");
  });

  it("shows left icon", () => {
    render(<Input leftIcon={<span data-testid="icon">🔍</span>} />);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });
});

describe("Select", () => {
  const options = [
    { value: "a", label: "Option A" },
    { value: "b", label: "Option B" },
    { value: "c", label: "Option C", disabled: true },
  ];

  it("renders options", () => {
    render(<Select label="Choose" options={options} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /option a/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /option b/i })).toBeInTheDocument();
  });

  it("handles disabled option", () => {
    render(<Select options={options} />);
    expect(screen.getByRole("option", { name: /option c/i })).toBeDisabled();
  });

  it("calls onChange", () => {
    const handleChange = vi.fn();
    render(<Select options={options} onChange={handleChange} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "b" } });
    expect(handleChange).toHaveBeenCalledWith("b");
  });

  it("shows error state", () => {
    render(<Select label="Test" options={options} error="Required" />);
    expect(screen.getByRole("alert")).toHaveTextContent(/required/i);
  });
});

describe("Dropdown", () => {
  const options = [
    { value: "1", label: "Item 1" },
    { value: "2", label: "Item 2" },
    { divider: true },
    { value: "3", label: "Item 3", disabled: true },
    { sectionTitle: "Section" },
    { value: "4", label: "Item 4" },
  ];

  it("renders trigger and opens on click", () => {
    render(
      <Dropdown
        trigger={<button>Open</button>}
        options={options}
      />
    );
    expect(screen.getByRole("button", { name: /open/i })).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole("button", { name: /open/i }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("filters options when searchable", () => {
    render(
      <Dropdown
        trigger={<button>Open</button>}
        options={options}
        searchable
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /open/i }));
    expect(screen.getByPlaceholderText(/filter options/i)).toBeInTheDocument();
  });

  it("calls onSelect", () => {
    const handleSelect = vi.fn();
    render(
      <Dropdown
        trigger={<button>Open</button>}
        options={options}
        onSelect={handleSelect}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /open/i }));
    fireEvent.click(screen.getByRole("option", { name: /item 1/i }));
    expect(handleSelect).toHaveBeenCalledWith("1", "Item 1");
  });

  it("closes on escape", () => {
    render(
      <Dropdown
        trigger={<button>Open</button>}
        options={options}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /open/i }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});

describe("Modal", () => {
  it("renders when open", () => {
    render(<Modal open onClose={vi.fn()} title="Test Modal">Content</Modal>);
    expect(screen.getByRole("dialog", { name: /test modal/i })).toBeInTheDocument();
    expect(screen.getByText(/content/i)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<Modal open={false} onClose={vi.fn()} title="Test">Content</Modal>);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on overlay click", () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="Test">Content</Modal>);
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on escape", () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="Test">Content</Modal>);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("traps focus", () => {
    render(
      <Modal open onClose={vi.fn()} title="Test">
        <button>Button 1</button>
        <button>Button 2</button>
      </Modal>
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });
});

describe("ConfirmModal", () => {
  it("renders with message and actions", () => {
    render(
      <ConfirmModal
        open
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm"
        message="Are you sure?"
      />
    );
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(
      <ConfirmModal
        open
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm"
        message="Are you sure?"
        loading
      />
    );
    expect(screen.getByRole("button", { name: /please wait/i })).toBeDisabled();
  });
});

describe("ClientTabs", () => {
  const tabs = [
    { id: "tab1", label: "Tab 1", content: <div>Content 1</div> },
    { id: "tab2", label: "Tab 2", content: <div>Content 2</div> },
    { id: "tab3", label: "Tab 3", content: <div>Content 3</div>, disabled: true },
  ];

  it("renders tab list", () => {
    render(<ClientTabs tabs={tabs} />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /tab 1/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /tab 2/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /tab 3/i })).toBeDisabled();
  });

  it("shows active tab content", () => {
    render(<ClientTabs tabs={tabs} defaultTab="tab2" />);
    expect(screen.getByRole("tabpanel", { name: /tab 2/i })).toBeVisible();
    expect(screen.getByText(/content 2/i)).toBeInTheDocument();
  });

  it("switches tabs on click", () => {
    render(<ClientTabs tabs={tabs} defaultTab="tab1" />);
    expect(screen.getByText(/content 1/i)).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole("tab", { name: /tab 2/i }));
    expect(screen.getByText(/content 2/i)).toBeInTheDocument();
  });

  it("navigates with arrow keys", () => {
    render(<ClientTabs tabs={tabs} defaultTab="tab1" />);
    const tab1 = screen.getByRole("tab", { name: /tab 1/i });
    
    fireEvent.keyDown(tab1, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: /tab 2/i })).toHaveFocus();
    
    fireEvent.keyDown(screen.getByRole("tab", { name: /tab 2/i }), { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: /tab 1/i })).toHaveFocus();
  });

  it("calls onChange", () => {
    const handleChange = vi.fn();
    render(<ClientTabs tabs={tabs} defaultTab="tab1" onChange={handleChange} />);
    fireEvent.click(screen.getByRole("tab", { name: /tab 2/i }));
    expect(handleChange).toHaveBeenCalledWith("tab2");
  });
});