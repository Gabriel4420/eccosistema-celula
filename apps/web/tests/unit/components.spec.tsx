import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, Pagination, Alert, FieldError, EmptyState, ErrorState, Skeleton } from "@/src/shared/components";

describe("Button", () => {
  it("disables and shows loading state while busy", () => {
    render(<Button loading>Salvar</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("shows the loading label instead of children while loading", () => {
    render(<Button loading loadingLabel="Salvando…">Salvar</Button>);
    expect(screen.getByText("Salvando…")).toBeInTheDocument();
    expect(screen.queryByText("Salvar")).not.toBeInTheDocument();
  });
});

describe("Pagination", () => {
  const base = { page: 1, pageSize: 20, totalItems: 25, totalPages: 2 };

  it("disables previous on the first page and reports ranges", () => {
    render(<Pagination {...base} onPageChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próxima" })).toBeEnabled();
    expect(screen.getByText(/1–20 de 25/)).toBeInTheDocument();
  });

  it("disables next on the last page", () => {
    render(
      <Pagination {...base} page={2} onPageChange={jest.fn()} />
    );
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
  });

  it("calls onPageChange with the next page", async () => {
    const onPageChange = jest.fn();
    const user = userEvent.setup();
    render(<Pagination {...base} onPageChange={onPageChange} />);
    await user.click(screen.getByRole("button", { name: "Próxima" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});

describe("feedback components", () => {
  it("renders an error alert with role alert", () => {
    render(<Alert variant="error" title="Falha">Detalhe</Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent("Falha");
  });

  it("omits FieldError when there is no message", () => {
    const { container } = render(<FieldError>{undefined}</FieldError>);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders empty and error states", () => {
    render(<EmptyState title="Nenhum registro" />);
    expect(screen.getByText("Nenhum registro")).toBeInTheDocument();

    const onRetry = jest.fn();
    render(<ErrorState title="Falha ao carregar" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Falha ao carregar");
  });

  it("renders a decorative skeleton without accessible name", () => {
    const { container } = render(<Skeleton width="4rem" />);
    expect(container.querySelector(".skeleton")).not.toBeNull();
  });
});
