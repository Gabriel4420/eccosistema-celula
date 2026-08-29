import { parseProductionBootstrapEnvironment } from "./production-bootstrap";

const validEnvironment = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://owner:secret@example.com/database",
  AUTH_CHURCH_ID: "10000000-0000-4000-8000-000000000001",
  BOOTSTRAP_CONFIRM: "CREATE_INITIAL_ADMIN",
  BOOTSTRAP_CHURCH_NAME: "Missão Atos",
  BOOTSTRAP_CHURCH_SLUG: "missao-atos",
  BOOTSTRAP_CHURCH_TIMEZONE: "America/Sao_Paulo",
  BOOTSTRAP_ADMIN_FIRST_NAME: "Admin",
  BOOTSTRAP_ADMIN_LAST_NAME: "Principal",
  BOOTSTRAP_ADMIN_EMAIL: "ADMIN@EXAMPLE.COM ",
  BOOTSTRAP_ADMIN_PASSWORD: "correct-horse-battery-staple"
} as const;

describe("production bootstrap environment", () => {
  it("normalizes safe production input", () => {
    expect(parseProductionBootstrapEnvironment(validEnvironment)).toMatchObject({
      BOOTSTRAP_ADMIN_EMAIL: "admin@example.com",
      BOOTSTRAP_CHURCH_TIMEZONE: "America/Sao_Paulo"
    });
  });

  it("requires production mode and explicit confirmation", () => {
    expect(() =>
      parseProductionBootstrapEnvironment({ ...validEnvironment, NODE_ENV: "development" })
    ).toThrow();
    expect(() =>
      parseProductionBootstrapEnvironment({ ...validEnvironment, BOOTSTRAP_CONFIRM: "yes" })
    ).toThrow();
  });

  it("rejects reserved slugs, invalid timezones and placeholder passwords", () => {
    expect(() =>
      parseProductionBootstrapEnvironment({ ...validEnvironment, BOOTSTRAP_CHURCH_SLUG: "admin" })
    ).toThrow();
    expect(() =>
      parseProductionBootstrapEnvironment({
        ...validEnvironment,
        BOOTSTRAP_CHURCH_TIMEZONE: "Invalid/Timezone"
      })
    ).toThrow();
    expect(() =>
      parseProductionBootstrapEnvironment({
        ...validEnvironment,
        BOOTSTRAP_ADMIN_PASSWORD: "replace-with-a-secret"
      })
    ).toThrow();
  });
});
