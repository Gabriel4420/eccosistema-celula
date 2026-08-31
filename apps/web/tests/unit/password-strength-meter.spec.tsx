import { render, screen } from "@testing-library/react";
import { PasswordStrengthMeter } from "@/src/features/users/components/password-strength-meter";

describe("PasswordStrengthMeter", () => {
  it("shows progress and the unmet requirements", () => {
    render(<PasswordStrengthMeter password="password" />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getByText("Muito fraca")).toBeInTheDocument();
    expect(screen.getByText("Uma letra minúscula").closest("li")).toHaveAttribute("data-met", "true");
    expect(screen.getByText("Uma letra maiúscula").closest("li")).toHaveAttribute("data-met", "false");
  });

  it("announces a strong password after every requirement is met", () => {
    render(<PasswordStrengthMeter password="Strong-password-123!" />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "5");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "Forte");
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getAllByRole("listitem").every((item) => item.dataset.met === "true")).toBe(true);
  });
});
