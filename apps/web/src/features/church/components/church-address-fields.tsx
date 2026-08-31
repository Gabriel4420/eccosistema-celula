"use client";

import type { ChurchResponse } from "@mission-atos/contracts";
import type { ChangeEvent, FocusEvent } from "react";
import { useRef, useState } from "react";
import { lookupAddressByPostalCode, PostalCodeLookupError } from "@/src/features/church/api/viacep-api";
import { TextField } from "@/src/shared/components";

type LookupState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "success"; readonly message: string }
  | { readonly status: "error"; readonly message: string };

export function ChurchAddressFields({ address }: { readonly address: ChurchResponse["address"] }) {
  const [postalCode, setPostalCode] = useState(address.postalCode ?? "");
  const [addressLine, setAddressLine] = useState(address.line ?? "");
  const [neighborhood, setNeighborhood] = useState(address.neighborhood ?? "");
  const [city, setCity] = useState(address.city ?? "");
  const [state, setState] = useState(address.state ?? "");
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" });
  const activeLookup = useRef<AbortController | null>(null);

  const handlePostalCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    activeLookup.current?.abort();
    setPostalCode(event.target.value);
    setLookup({ status: "idle" });
  };

  const handlePostalCodeBlur = async (event: FocusEvent<HTMLInputElement>) => {
    const normalized = event.currentTarget.value.replace(/\D/g, "");
    if (normalized.length === 0) return;
    if (normalized.length !== 8) {
      setLookup({ status: "error", message: "Informe um CEP com 8 dígitos." });
      return;
    }
    activeLookup.current?.abort();
    const controller = new AbortController();
    activeLookup.current = controller;
    setLookup({ status: "loading" });
    try {
      const result = await lookupAddressByPostalCode(normalized, controller.signal);
      if (result.addressLine !== "") setAddressLine(result.addressLine);
      if (result.neighborhood !== "") setNeighborhood(result.neighborhood);
      setCity(result.city);
      setState(result.state);
      setPostalCode(normalized);
      setLookup({ status: "success", message: "Endereço preenchido pelo CEP." });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      const message = error instanceof PostalCodeLookupError && error.code === "POSTAL_CODE_NOT_FOUND"
        ? "CEP não encontrado. Confira o número ou preencha o endereço manualmente."
        : "Não foi possível consultar o CEP. Preencha o endereço manualmente.";
      setLookup({ status: "error", message });
    } finally {
      if (activeLookup.current === controller) activeLookup.current = null;
    }
  };

  const statusMessage = lookup.status === "loading" ? "Consultando CEP…" : lookup.status === "idle" ? null : lookup.message;
  return <>
    <TextField label="CEP" name="postalCode" value={postalCode} onChange={handlePostalCodeChange} onBlur={(event) => void handlePostalCodeBlur(event)} maxLength={9} inputMode="numeric" autoComplete="postal-code" hint="Ao sair do campo, o endereço será preenchido pelo ViaCEP." aria-busy={lookup.status === "loading"} />
    <div className="field__description" aria-live="polite" role={lookup.status === "error" ? "alert" : "status"}>{statusMessage}</div>
    <TextField label="Logradouro" name="addressLine" value={addressLine} onChange={(event) => setAddressLine(event.target.value)} autoComplete="address-line1" />
    <TextField label="Número" name="addressNumber" defaultValue={address.number ?? ""} autoComplete="address-line2" />
    <TextField label="Complemento" name="addressComplement" defaultValue={address.complement ?? ""} />
    <TextField label="Bairro" name="neighborhood" value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} />
    <TextField label="Cidade" name="city" value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" />
    <TextField label="Estado (UF)" name="state" value={state} onChange={(event) => setState(event.target.value.toUpperCase())} maxLength={2} autoComplete="address-level1" />
    <TextField label="País" name="country" defaultValue={address.country} disabled />
  </>;
}
