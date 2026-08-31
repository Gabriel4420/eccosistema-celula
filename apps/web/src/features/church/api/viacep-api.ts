export interface PostalCodeAddress {
  readonly addressLine: string;
  readonly neighborhood: string;
  readonly city: string;
  readonly state: string;
}

export type PostalCodeLookupErrorCode = "INVALID_POSTAL_CODE" | "POSTAL_CODE_NOT_FOUND" | "POSTAL_CODE_SERVICE_UNAVAILABLE";

export class PostalCodeLookupError extends Error {
  constructor(readonly code: PostalCodeLookupErrorCode) {
    super(code);
    this.name = "PostalCodeLookupError";
  }
}

export async function lookupAddressByPostalCode(value: string, signal?: AbortSignal): Promise<PostalCodeAddress> {
  const postalCode = value.replace(/\D/g, "");
  if (!/^\d{8}$/.test(postalCode)) throw new PostalCodeLookupError("INVALID_POSTAL_CODE");

  let response: Response;
  try {
    response = await fetch(`https://viacep.com.br/ws/${postalCode}/json/`, {
      headers: { Accept: "application/json" }, signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new PostalCodeLookupError("POSTAL_CODE_SERVICE_UNAVAILABLE");
  }
  if (!response.ok) throw new PostalCodeLookupError("POSTAL_CODE_SERVICE_UNAVAILABLE");

  const payload: unknown = await response.json().catch(() => null);
  if (!isRecord(payload)) throw new PostalCodeLookupError("POSTAL_CODE_SERVICE_UNAVAILABLE");
  if (payload.erro === true) throw new PostalCodeLookupError("POSTAL_CODE_NOT_FOUND");

  const addressLine = readString(payload, "logradouro");
  const neighborhood = readString(payload, "bairro");
  const city = readString(payload, "localidade");
  const state = readString(payload, "uf").toUpperCase();
  if (city === "" || !/^[A-Z]{2}$/.test(state)) throw new PostalCodeLookupError("POSTAL_CODE_SERVICE_UNAVAILABLE");
  return { addressLine, neighborhood, city, state };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: Record<string, unknown>, key: string): string {
  return typeof value[key] === "string" ? value[key].trim() : "";
}
