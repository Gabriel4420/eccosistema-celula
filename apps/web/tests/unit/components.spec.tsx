import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, Pagination, Alert, FieldError, EmptyState, ErrorState, Skeleton } from "@/src/shared/components";
import { ThemeToggle } from "@/src/shared/theme/theme-toggle";
import { renderWithI18n } from "./helpers/render-with-i18n";

describe("Button", () => {
  it("supports a compact accessible touch target variant", () => {
    renderWithI18n(<Button size="sm">Remover</Button>);
    expect(screen.getByRole("button", { name: "Remover" })).toHaveClass("button--sm");
  });
  it("disables and shows loading state while busy", () => {
    renderWithI18n(<Button loading>Salvar</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("shows the loading label instead of children while loading", () => {
    renderWithI18n(<Button loading loadingLabel="Salvando…">Salvar</Button>);
    expect(screen.getByText("Salvando…")).toBeInTheDocument();
    expect(screen.queryByText("Salvar")).not.toBeInTheDocument();
  });
});

describe("ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = "light";
    localStorage.clear();
  });

  it("switches theme, updates the accessible name and persists the choice", async () => {
    const user = userEvent.setup();
    renderWithI18n(<ThemeToggle />);

    const toggle = screen.getByRole("button", { name: "Ativar tema escuro" });
    await user.click(toggle);

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem("mission-atos-theme")).toBe("dark");
    expect(toggle).toHaveAccessibleName("Ativar tema claro");
  });
});

describe("Pagination", () => {
  const base = { page: 1, pageSize: 20, totalItems: 25, totalPages: 2 };

  it("disables previous on the first page and reports ranges", () => {
    renderWithI18n(<Pagination {...base} onPageChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próxima" })).toBeEnabled();
    expect(screen.getByText(/1–20 de 25/)).toBeInTheDocument();
  });

  it("disables next on the last page", () => {
    renderWithI18n(
      <Pagination {...base} page={2} onPageChange={jest.fn()} />
    );
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
  });

  it("calls onPageChange with the next page", async () => {
    const onPageChange = jest.fn();
    const user = userEvent.setup();
    renderWithI18n(<Pagination {...base} onPageChange={onPageChange} />);
    await user.click(screen.getByRole("button", { name: "Próxima" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});

describe("feedback components", () => {
  it("renders an error alert with role alert", () => {
    renderWithI18n(<Alert variant="error" title="Falha">Detalhe</Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent("Falha");
  });

  it("omits FieldError when there is no message", () => {
    const { container } = renderWithI18n(<FieldError>{undefined}</FieldError>);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders empty and error states", () => {
    renderWithI18n(<EmptyState title="Nenhum registro" />);
    expect(screen.getByText("Nenhum registro")).toBeInTheDocument();

    const onRetry = jest.fn();
    renderWithI18n(<ErrorState title="Falha ao carregar" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Falha ao carregar");
  });

  it("renders a decorative skeleton without accessible name", () => {
    const { container } = renderWithI18n(<Skeleton width="4rem" />);
    expect(container.querySelector(".skeleton")).not.toBeNull();
  });
});
