"use client";

import type { ChurchResponse } from "@mission-atos/contracts";
import type { ChangeEvent, FocusEvent } from "react";
import { useRef, useState } from "react";
import { lookupAddressByPostalCode, PostalCodeLookupError } from "@/src/features/church/api/viacep-api";
import { TextField } from "@/src/shared/components";
import { useI18n } from "@/src/shared/i18n/language-provider";

type LookupState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "success"; readonly message: string }
  | { readonly status: "error"; readonly message: string };

export function ChurchAddressFields({ address }: { readonly address: ChurchResponse["address"] }) {
  const { t } = useI18n();
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
      setLookup({ status: "error", message: t("church.address.cep.digits") });
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
      setLookup({ status: "success", message: t("church.address.lookupSuccess") });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      const message = error instanceof PostalCodeLookupError && error.code === "POSTAL_CODE_NOT_FOUND"
        ? t("church.address.lookupNotFound")
        : t("church.address.lookupError");
      setLookup({ status: "error", message });
    } finally {
      if (activeLookup.current === controller) activeLookup.current = null;
    }
  };

  const statusMessage = lookup.status === "loading" ? t("church.address.lookupLoading") : lookup.status === "idle" ? null : lookup.message;
  return <>
    <TextField label={t("church.label.cep")} name="postalCode" value={postalCode} onChange={handlePostalCodeChange} onBlur={(event) => void handlePostalCodeBlur(event)} maxLength={9} inputMode="numeric" autoComplete="postal-code" hint={t("church.address.cep.hint")} aria-busy={lookup.status === "loading"} />
    <div className="field__description" aria-live="polite" role={lookup.status === "error" ? "alert" : "status"}>{statusMessage}</div>
    <TextField label={t("church.label.street")} name="addressLine" value={addressLine} onChange={(event) => setAddressLine(event.target.value)} autoComplete="address-line1" />
    <TextField label={t("church.label.number")} name="addressNumber" defaultValue={address.number ?? ""} autoComplete="address-line2" />
    <TextField label={t("church.label.complement")} name="addressComplement" defaultValue={address.complement ?? ""} />
    <TextField label={t("church.label.neighborhood")} name="neighborhood" value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} />
    <TextField label={t("church.label.city")} name="city" value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" />
    <TextField label={t("church.label.stateUf")} name="state" value={state} onChange={(event) => setState(event.target.value.toUpperCase())} maxLength={2} autoComplete="address-level1" />
    <TextField label={t("church.address.field.country")} name="country" defaultValue={address.country} disabled />
  </>;
}
