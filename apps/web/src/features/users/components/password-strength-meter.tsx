"use client";

import { evaluatePasswordStrength, PASSWORD_MIN_LENGTH } from "@mission-atos/contracts";

type PasswordStrengthMeterProps = {
  readonly password: string;
};

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = evaluatePasswordStrength(password);
  const requirements = [
    [strength.requirements.minimumLength, `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres`],
    [strength.requirements.uppercase, "Uma letra maiúscula"],
    [strength.requirements.lowercase, "Uma letra minúscula"],
    [strength.requirements.number, "Um número"],
    [strength.requirements.specialCharacter, "Um caractere especial"]
  ] as const;

  return (
    <div className="password-strength" aria-live="polite">
      <div className="password-strength__summary">
        <span>Força da senha</span>
        <strong>{password ? strength.label : "Digite uma senha"}</strong>
      </div>
      <div
        className="password-strength__track"
        role="progressbar"
        aria-label="Força da senha"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={strength.score}
        aria-valuetext={password ? strength.label : "Nenhuma senha digitada"}
      >
        <span style={{ width: `${strength.score * 20}%` }} data-score={strength.score} />
      </div>
      <ul className="password-strength__requirements" aria-label="Requisitos da senha">
        {requirements.map(([met, label]) => (
          <li key={label} data-met={met}>
            <span aria-hidden="true">{met ? "✓" : "○"}</span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
