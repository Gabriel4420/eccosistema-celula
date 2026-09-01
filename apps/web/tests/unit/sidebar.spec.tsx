import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "@/src/shared/navigation/sidebar";

let mockPathname: string = "/dashboard";

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname
}));

jest.mock("next/link", () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const React = jest.requireActual<typeof import("react")>("react");
  const MockLink = (props: {
    readonly href: string;
    readonly children: React.ReactNode;
    readonly className?: string;
    readonly "aria-current"?: "page" | undefined;
  }) =>
    React.createElement(
      "a",
      { href: props.href, className: props.className, "aria-current": props["aria-current"] },
      props.children
    );
  return { __esModule: true, default: MockLink };
});

jest.mock("next/image", () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const React = jest.requireActual<typeof import("react")>("react");
  const MockImage = (props: { readonly src: string; readonly alt: string }) =>
    React.createElement("img", { src: props.src, alt: props.alt });
  return { __esModule: true, default: MockImage };
});

jest.mock("@/src/shared/auth/guards", () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    Can: ({ children }: { readonly children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children)
  };
});

function mockMatchMedia(matches: boolean): void {
  window.matchMedia = jest.fn<MediaQueryList, [string]>().mockReturnValue({
    matches,
    media: "(max-width: 48rem)",
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn()
  } as unknown as MediaQueryList);
}

describe("Sidebar mobile drawer", () => {
  beforeEach(() => {
    mockPathname = "/dashboard";
    mockMatchMedia(true);
  });

  it("hides the off-canvas drawer from assistive tech and tab order while closed on mobile", () => {
    const { container } = render(<Sidebar />);
    const aside = container.querySelector("#shell-sidebar");
    expect(aside).not.toBeNull();
    expect(aside).toHaveAttribute("aria-hidden", "true");
    expect(aside).toHaveAttribute("inert");
  });

  it("opens the drawer with the hamburger and moves focus to the close button", async () => {
    const user = userEvent.setup();
    const { container } = render(<Sidebar />);
    const toggle = screen.getByRole("button", { name: "Abrir menu" });

    await user.click(toggle);

    const aside = container.querySelector("#shell-sidebar");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(aside?.className).toContain("sidebar--open");
    expect(aside).not.toHaveAttribute("aria-hidden");
    expect(aside).not.toHaveAttribute("inert");
    expect(screen.getByRole("button", { name: "Fechar menu" })).toHaveFocus();
  });

  it("closes with Escape and returns focus to the hamburger", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    const toggle = screen.getByRole("button", { name: "Abrir menu" });

    await user.click(toggle);
    await user.keyboard("{Escape}");

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
  });

  it("closes when the scrim overlay is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<Sidebar />);
    const toggle = screen.getByRole("button", { name: "Abrir menu" });

    await user.click(toggle);
    const scrim = container.querySelector(".sidebar-scrim");
    expect(scrim).not.toBeNull();
    await user.click(scrim as HTMLElement);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("locks the body scroll while open and restores it on close", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    const toggle = screen.getByRole("button", { name: "Abrir menu" });

    await user.click(toggle);
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
  });

  it("traps focus inside the drawer", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByRole("button", { name: "Abrir menu" }));

    const close = screen.getByRole("button", { name: "Fechar menu" });
    expect(close).toHaveFocus();

    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(
      screen.getByRole("link", {
        name: "Precisa de ajuda? Conversar pelo WhatsApp (abre em nova aba)"
      })
    ).toHaveFocus();

    await user.keyboard("{Tab}");
    expect(screen.getByRole("button", { name: "Fechar menu" })).toHaveFocus();
  });

  it("keeps the drawer fully reachable on desktop (no aria-hidden or inert)", () => {
    mockMatchMedia(false);
    const { container } = render(<Sidebar />);
    const aside = container.querySelector("#shell-sidebar");
    expect(aside).not.toHaveAttribute("aria-hidden");
    expect(aside).not.toHaveAttribute("inert");
  });

  it("closes the drawer when the route changes", async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<Sidebar />);
    const toggle = screen.getByRole("button", { name: "Abrir menu" });

    await user.click(toggle);
    expect(container.querySelector("#shell-sidebar")?.className).toContain("sidebar--open");

    mockPathname = "/cells";
    rerender(<Sidebar />);

    expect(container.querySelector("#shell-sidebar")?.className).not.toContain("sidebar--open");
  });
});