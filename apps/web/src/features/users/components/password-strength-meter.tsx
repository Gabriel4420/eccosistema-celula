"use client";

import { evaluatePasswordStrength, PASSWORD_MIN_LENGTH } from "@mission-atos/contracts";
import { useI18n } from "@/src/shared/i18n/language-provider";
import type { TranslationKey, TranslationParams } from "@/src/shared/i18n/dictionaries";

type PasswordStrengthMeterProps = {
  readonly password: string;
};

function strengthLabel(score: number, t: (key: TranslationKey, params?: TranslationParams) => string): string {
  if (score === 5) return t("users.strength.strong");
  if (score === 4) return t("users.strength.good");
  if (score === 3) return t("users.strength.fair");
  if (score === 2) return t("users.strength.weak");
  return t("users.strength.veryWeak");
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { t } = useI18n();
  const strength = evaluatePasswordStrength(password);
  const requirements = [
    [strength.requirements.minimumLength, t("users.strength.require.length", { min: PASSWORD_MIN_LENGTH })],
    [strength.requirements.uppercase, t("users.strength.require.uppercase")],
    [strength.requirements.lowercase, t("users.strength.require.lowercase")],
    [strength.requirements.number, t("users.strength.require.number")],
    [strength.requirements.specialCharacter, t("users.strength.require.special")]
  ] as const;

  return (
    <div className="password-strength" aria-live="polite">
      <div className="password-strength__summary">
        <span>{t("users.strength.label")}</span>
        <strong>{password ? strengthLabel(strength.score, t) : t("users.strength.empty")}</strong>
      </div>
      <div
        className="password-strength__track"
        role="progressbar"
        aria-label={t("users.strength.require.aria")}
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={strength.score}
        aria-valuetext={password ? strengthLabel(strength.score, t) : t("users.strength.emptyAria")}
      >
        <span style={{ width: `${strength.score * 20}%` }} data-score={strength.score} />
      </div>
      <ul className="password-strength__requirements" aria-label={t("users.strength.requirementsAria")}>
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
