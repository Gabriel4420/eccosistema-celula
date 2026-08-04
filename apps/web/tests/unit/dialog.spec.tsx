import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "@/src/shared/components";

describe("Dialog", () => {
  it("renders nothing while closed", () => {
    const { container } = render(
      <Dialog open={false} onClose={jest.fn()} title="Excluir" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("announces the title and focuses the confirm action", () => {
    const onClose = jest.fn();
    render(
      <Dialog open onClose={onClose} title="Confirmar exclusão">
        <p>Tem certeza?</p>
        <button type="button">Confirmar</button>
      </Dialog>
    );
    expect(screen.getByRole("heading", { name: "Confirmar exclusão" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar" })).toHaveFocus();
  });

  it("closes with Escape", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(
      <Dialog open onClose={onClose} title="Confirmar exclusão">
        <button type="button">Confirmar</button>
      </Dialog>
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("traps focus within the dialog", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Outside</button>
        <Dialog open onClose={jest.fn()} title="Confirmar exclusão">
          <button type="button">Cancel</button>
          <button type="button">Confirm</button>
        </Dialog>
      </>
    );
    const cancel = screen.getByRole("button", { name: "Cancel" });
    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(cancel).toHaveFocus();
    await user.tab();
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();
  });

  it("returns focus to the previously focused element on close", () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <>
        <button type="button">Trigger</button>
        <Dialog open={false} onClose={onClose} title="Confirmar" />
      </>
    );
    const trigger = screen.getByRole("button", { name: "Trigger" });
    trigger.focus();
    rerender(
      <>
        <button type="button">Trigger</button>
        <Dialog open onClose={onClose} title="Confirmar">
          <button type="button">OK</button>
        </Dialog>
      </>
    );
    rerender(
      <>
        <button type="button">Trigger</button>
        <Dialog open={false} onClose={onClose} title="Confirmar" />
      </>
    );
    expect(trigger).toHaveFocus();
  });
});
