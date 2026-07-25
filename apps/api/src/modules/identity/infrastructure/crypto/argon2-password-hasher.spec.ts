import { Argon2PasswordHasher } from "./argon2-password-hasher";

describe("Argon2PasswordHasher", () => {
  const hasher = new Argon2PasswordHasher();

  it("hashes and verifies without retaining plaintext", async () => {
    const password = "safe-test-password-1234";
    const encoded = await hasher.hash(password);
    expect(encoded).toMatch(/^\$argon2id\$/);
    expect(encoded).not.toContain(password);
    await expect(hasher.verify(encoded, password)).resolves.toBe(true);
    await expect(hasher.verify(encoded, "wrong-password")).resolves.toBe(false);
  });
});
