import { formatPhone } from "@/src/features/people/lib/format";

describe("formatPhone", () => {
  it("formats an E.164 mobile number", () => {
    expect(formatPhone("5517999999999")).toBe("(+55) 17 99999-9999");
  });

  it("formats a mobile number with country code and separators", () => {
    expect(formatPhone("+55 17 99999-9999")).toBe("(+55) 17 99999-9999");
  });

  it("formats a mobile number without country code", () => {
    expect(formatPhone("(17) 99999-9999")).toBe("(+55) 17 99999-9999");
    expect(formatPhone("17 99999-9999")).toBe("(+55) 17 99999-9999");
    expect(formatPhone("17999999999")).toBe("(+55) 17 99999-9999");
  });

  it("formats a landline number", () => {
    expect(formatPhone("551722222222")).toBe("(+55) 17 2222-2222");
    expect(formatPhone("1722222222")).toBe("(+55) 17 2222-2222");
  });

  it("formats a number that already has the +55 prefix", () => {
    expect(formatPhone("+5511999999999")).toBe("(+55) 11 99999-9999");
  });

  it("returns a dash for null, undefined and empty values", () => {
    expect(formatPhone(null)).toBe("—");
    expect(formatPhone(undefined)).toBe("—");
    expect(formatPhone("")).toBe("—");
    expect(formatPhone("   ")).toBe("—");
  });

  it("returns the original value for invalid phone numbers", () => {
    expect(formatPhone("123")).toBe("123");
    expect(formatPhone("abc")).toBe("abc");
  });
});