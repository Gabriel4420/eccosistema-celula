"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Alert, Button, TextareaField, TextField } from "@/src/shared/components";
import { ApiError } from "@/src/shared/api/api-error";
import { cacheStore } from "@/src/shared/cache/cache";
import { useSession } from "@/src/providers/session-provider";
import { createPerson } from "@/src/features/people/api/people-api";

const PEOPLE_CACHE = "people";

export function CreatePersonForm() {
  const { api } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    const formData = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const person = await createPerson(api, {
        fullName: String(formData.get("fullName") ?? "").trim(),
        phone: String(formData.get("phone") ?? "").trim() || undefined,
        email: String(formData.get("email") ?? "").trim() || undefined,
        birthDate: String(formData.get("birthDate") ?? "").trim() || undefined,
        gender: String(formData.get("gender") ?? "").trim() || undefined,
        observations: String(formData.get("observations") ?? "").trim() || undefined
      });
      cacheStore(PEOPLE_CACHE).invalidatePrefix("page");
      router.push(`/people/${person.id}`);
    } catch (error) {
      const message =
        error instanceof ApiError && error.code === "PERSON_DUPLICATE"
          ? "Já existe uma pessoa ativa com dados semelhantes. Verifique o cadastro antes de continuar."
          : "Não foi possível cadastrar a pessoa. Verifique os dados e tente novamente.";
      setFeedback({ kind: "error", message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="create-person-title">
      <div className="page-header">
        <h1 className="page-title" id="create-person-title">
          Nova pessoa
        </h1>
        <p className="page-description">Preencha os dados de contato e identificação.</p>
      </div>

      {feedback ? (
        <Alert variant={feedback.kind} title={feedback.kind === "success" ? "Sucesso" : "Falha"}>
          {feedback.message}
        </Alert>
      ) : null}

      <form className="fieldset" onSubmit={(event) => void handleSubmit(event)}>
        <fieldset className="fieldset">
          <legend className="fieldset__legend">Identificação</legend>
          <TextField label="Nome completo" name="fullName" required hint="Nome e sobrenome, ex.: Maria da Silva." />
          <TextField label="Gênero" name="gender" hint="Ex.: Feminino, Masculino ou como a pessoa se identifica." />
          <TextField label="Data de nascimento" type="date" name="birthDate" />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset__legend">Contato</legend>
          <TextField label="E-mail" type="email" name="email" mask="email" hint="Será normalizado para letras minúsculas." />
          <TextField label="Telefone" name="phone" mask="phone" hint="Formato brasileiro, ex.: (11) 99999-9999." />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset__legend">Observações</legend>
          <TextareaField
            label="Observações"
            name="observations"
            rows={4}
            hint="Informações adicionais. Visível para administradores e pastores."
          />
        </fieldset>

        <div className="toolbar">
          <Button type="submit" loading={busy} loadingLabel="Cadastrando…">
            Cadastrar pessoa
          </Button>
        </div>
      </form>
    </section>
  );
}
