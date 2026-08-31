export const PASSWORD_MIN_LENGTH = 12;

export type PasswordStrength = {
  readonly score: number;
  readonly label: "Muito fraca" | "Fraca" | "Média" | "Boa" | "Forte";
  readonly requirements: {
    readonly minimumLength: boolean;
    readonly uppercase: boolean;
    readonly lowercase: boolean;
    readonly number: boolean;
    readonly specialCharacter: boolean;
  };
  readonly isValid: boolean;
};

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    minimumLength: password.length >= PASSWORD_MIN_LENGTH,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    specialCharacter: /[^A-Za-z0-9s]/.test(password)
  };
  const score = Object.values(requirements).filter(Boolean).length;

  return {
    score,
    label: passwordStrengthLabel(score),
    requirements,
    isValid: score === 5
  };
}

function passwordStrengthLabel(score: number): PasswordStrength["label"] {
  if (score === 5) return "Forte";
  if (score === 4) return "Boa";
  if (score === 3) return "Média";
  if (score === 2) return "Fraca";
  return "Muito fraca";
}
