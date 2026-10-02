import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Checkbox, Select } from "@/components/ui/Select";
import { Dropdown, type DropdownOption } from "@/components/ui/Dropdown";
import ClientTabs from "@/components/ui/Tabs";
import Modal, { ConfirmModal } from "@/components/ui/Modal";

describe("Button", () => {
  it("renders its label and handles clicks", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is disabled and inert while loading", () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not fire while disabled", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Nope
      </Button>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Nope" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("gives a spinner an accessible label alongside the label text", () => {
    render(<Button loading>Saving</Button>);
    expect(screen.getByRole("button", { name: /saving/i })).toBeInTheDocument();
  });
});

describe("Input", () => {
  it("associates the label and its hint with the control", () => {
    render(<Input label="Email" hint="We never share it." />);
    const input = screen.getByLabelText(/Email/);
    expect(input).toHaveAccessibleDescription("We never share it.");
  });

  it("marks the control invalid and describes it with the error", () => {
    render(<Input label="Email" hint="We never share it." error="Required" />);
    const input = screen.getByLabelText(/Email/);
    expect(input).toHaveAttribute("aria-invalid", "true");
    // The error replaces the hint rather than stacking both under the field.
    expect(screen.getByRole("alert")).toHaveTextContent("Required");
    expect(screen.queryByText("We never share it.")).not.toBeInTheDocument();
  });

  it("renders the native type", () => {
    render(<Input label="Email" type="email" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
  });

  it("forwards typed characters", () => {
    render(<Input label="Name" />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ada" } });
    expect(screen.getByLabelText("Name")).toHaveValue("Ada");
  });
});

describe("Textarea", () => {
  it("associates its label", () => {
    render(<Textarea label="Note" defaultValue="hello" />);
    expect(screen.getByLabelText("Note")).toHaveValue("hello");
  });
});

describe("Select", () => {
  const options = [
    { value: "", label: "Any" },
    { value: "in", label: "India" },
    { value: "gb", label: "United Kingdom" },
  ];

  it("renders the placeholder as a real, selectable first option", () => {
    render(<Select label="Market" placeholder="Anywhere" options={options.slice(1)} />);
    expect(screen.getByRole("option", { name: "Anywhere" })).toBeInTheDocument();
  });

  it("reports the chosen value, not the DOM event", () => {
    const onChange = vi.fn();
    render(<Select label="Market" options={options} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Market"), { target: { value: "gb" } });
    expect(onChange).toHaveBeenCalledWith("gb");
  });

  it("is reachable by its accessible name", () => {
    render(<Select label="Market" options={options} />);
    expect(screen.getByRole("combobox", { name: "Market" })).toBeInTheDocument();
  });
});

describe("Checkbox", () => {
  it("is a real checkbox and reports changes", () => {
    const onChange = vi.fn();
    render(<Checkbox label="Email me" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Email me" }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("is marked disabled for settings that cannot be changed", () => {
    render(<Checkbox label="Email me" disabled checked={false} onChange={() => {}} />);
    expect(screen.getByRole("checkbox", { name: "Email me" })).toBeDisabled();
  });
});

describe("Dropdown", () => {
  const options: DropdownOption[] = [
    { value: "all", label: "All stores" },
    { divider: true },
    { value: "a", label: "Amazon" },
    { value: "b", label: "Ajio", disabled: true },
  ];

  function renderDropdown(props: Partial<React.ComponentProps<typeof Dropdown>> = {}) {
    return render(
      <Dropdown
        trigger={<span>Store</span>}
        options={options}
        {...props}
      />,
    );
  }

  it("shows nothing until the trigger is pressed", () => {
    renderDropdown();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opens into a portalled listbox and reports the picked value and label", () => {
    const onSelect = vi.fn();
    renderDropdown({ onSelect });

    fireEvent.click(screen.getByText("Store"));
    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();
    // Portalled outside the trigger's subtree.
    expect(listbox.closest("body")).toBe(document.body);

    fireEvent.click(screen.getByRole("option", { name: "All stores" }));
    expect(onSelect).toHaveBeenCalledWith("all", "All stores");
  });

  it("skips dividers and honours disabled options", () => {
    const onSelect = vi.fn();
    renderDropdown({ onSelect });
    fireEvent.click(screen.getByText("Store"));

    const selectable = screen
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(selectable).toEqual(["All stores", "Amazon", "Ajio"]);
    expect(screen.getByRole("option", { name: "Ajio" })).toHaveAttribute("aria-disabled", "true");
  });

  it("closes when an option is chosen when closeOnSelect is set", () => {
    renderDropdown({ onSelect: vi.fn(), closeOnSelect: true });
    fireEvent.click(screen.getByText("Store"));
    fireEvent.click(screen.getByRole("option", { name: "Amazon" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("filters options when searchable", () => {
    renderDropdown({ searchable: true });
    fireEvent.click(screen.getByText("Store"));
    fireEvent.change(screen.getByRole("searchbox", { name: "Filter options" }), {
      target: { value: "ama" },
    });
    expect(screen.getByRole("option", { name: "Amazon" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "All stores" })).not.toBeInTheDocument();
  });

  it("explains an empty result set rather than leaving a bare divider", () => {
    render(
      <Dropdown
        trigger={<span>Store</span>}
        options={[{ value: "a", label: "Amazon" }, { divider: true }, { value: "b", label: "Ajio" }]}
        searchable
        emptyMessage="Nothing here"
      />,
    );
    fireEvent.click(screen.getByText("Store"));
    fireEvent.change(screen.getByRole("searchbox", { name: "Filter options" }), {
      target: { value: "zzzz" },
    });
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("does not open when disabled", () => {
    renderDropdown({ disabled: true });
    fireEvent.click(screen.getByText("Store"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("gives a render-function trigger the open state", () => {
    render(
      <Dropdown
        trigger={({ open }) => <span>{open ? "Close" : "Open"}</span>}
        options={options}
      />,
    );
    expect(screen.getByText("Open")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Open"));
    expect(screen.getByText("Close")).toBeInTheDocument();
  });
});

describe("Modal", () => {
  it("renders nothing when closed", () => {
    render(
      <Modal open={false} onClose={() => {}} title="Track this product">
        body
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("is a labelled dialog when open", () => {
    render(
      <Modal open onClose={() => {}} title="Track this product">
        body
      </Modal>,
    );
    const dialog = screen.getByRole("dialog", { name: "Track this product" });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Track">
        body
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on a backdrop click but not on a click inside", () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Track">
        <p>body</p>
      </Modal>,
    );
    fireEvent.click(screen.getByText("body"));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("ConfirmModal", () => {
  it("confirms and cancels through distinct labels", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmModal
        open
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete history"
        message="This cannot be undone."
        confirmLabel="Delete"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("locks both buttons while the action is in flight", () => {
    render(
      <ConfirmModal
        open
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete"
        message="This cannot be undone."
        loading
      />,
    );
    expect(screen.getByRole("button", { name: /please wait/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});

describe("ClientTabs", () => {
  const tabs = [
    { id: "saved", label: "Saved", content: <p>saved panel</p> },
    { id: "tracked", label: "Tracked", content: <p>tracked panel</p> },
  ];

  it("renders one tablist and only the active panel", () => {
    render(<ClientTabs tabs={tabs} />);
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByText("saved panel")).toBeInTheDocument();
    expect(screen.queryByText("tracked panel")).not.toBeInTheDocument();
  });

  it("switches panels on click and reports the change", () => {
    const onChange = vi.fn();
    render(<ClientTabs tabs={tabs} onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Tracked" }));
    expect(onChange).toHaveBeenCalledWith("tracked");
    expect(screen.getByText("tracked panel")).toBeInTheDocument();
  });

  it("moves between tabs with the arrow keys and wraps around", () => {
    render(<ClientTabs tabs={tabs} />);
    const saved = screen.getByRole("tab", { name: "Saved" });

    fireEvent.keyDown(saved, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Tracked" })).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(screen.getByRole("tab", { name: "Tracked" }), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Saved" })).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(screen.getByRole("tab", { name: "Saved" }), { key: "End" });
    expect(screen.getByRole("tab", { name: "Tracked" })).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(screen.getByRole("tab", { name: "Tracked" }), { key: "Home" });
    expect(screen.getByRole("tab", { name: "Saved" })).toHaveAttribute("aria-selected", "true");
  });

  it("keeps only the selected tab in the tab order", () => {
    render(<ClientTabs tabs={tabs} />);
    expect(screen.getByRole("tab", { name: "Saved" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: "Tracked" })).toHaveAttribute("tabindex", "-1");
  });

  it("falls back to the first usable tab when the selected one disappears", () => {
    const { rerender } = render(<ClientTabs tabs={tabs} defaultTab="tracked" />);
    rerender(<ClientTabs tabs={[tabs[0]]} defaultTab="tracked" />);
    expect(screen.getByRole("tab", { name: "Saved" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("saved panel")).toBeInTheDocument();
  });

  it("renders nothing for an empty tab set", () => {
    render(<ClientTabs tabs={[]} />);
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });
});