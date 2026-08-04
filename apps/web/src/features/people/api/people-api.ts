import {
  createPersonRequestSchema,
  listPeopleQuerySchema,
  peoplePageEnvelopeSchema,
  personItemEnvelopeSchema,
  updatePersonRequestSchema,
  updatePersonStatusRequestSchema
} from "@mission-atos/contracts";
import type {
  CreatePersonRequest,
  PeoplePageEnvelope,
  PersonResponse,
  UpdatePersonRequest
} from "@mission-atos/contracts";
import type { ApiClient } from "@/src/shared/api/api-client";

export interface PeopleListParams {
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
  readonly status?: "ACTIVE" | "INACTIVE";
  readonly gender?: string;
}

export async function listPeople(
  api: ApiClient,
  params: PeopleListParams
): Promise<PeoplePageEnvelope> {
  const query = listPeopleQuerySchema.parse(params);
  return api.request({
    method: "GET",
    path: "/people",
    query: {
      page: query.page,
      pageSize: query.pageSize,
      search: query.search ?? "",
      status: query.status ?? "ACTIVE",
      gender: query.gender ?? ""
    },
    bearer: true,
    allowRetry: true,
    schema: peoplePageEnvelopeSchema
  });
}

export async function getPerson(api: ApiClient, id: string): Promise<PersonResponse> {
  const envelope = await api.request({
    method: "GET",
    path: `/people/${id}`,
    bearer: true,
    allowRetry: true,
    schema: personItemEnvelopeSchema
  });
  return envelope.data;
}

export async function createPerson(
  api: ApiClient,
  input: CreatePersonRequest
): Promise<PersonResponse> {
  const payload = createPersonRequestSchema.parse(input);
  const envelope = await api.request({
    method: "POST",
    path: "/people",
    body: payload,
    bearer: true,
    schema: personItemEnvelopeSchema
  });
  return envelope.data;
}

export async function updatePerson(
  api: ApiClient,
  id: string,
  input: UpdatePersonRequest
): Promise<PersonResponse> {
  const payload = updatePersonRequestSchema.parse(input);
  const envelope = await api.request({
    method: "PATCH",
    path: `/people/${id}`,
    body: payload,
    bearer: true,
    schema: personItemEnvelopeSchema
  });
  return envelope.data;
}

export async function updatePersonStatus(
  api: ApiClient,
  id: string,
  status: "ACTIVE" | "INACTIVE"
): Promise<void> {
  const payload = updatePersonStatusRequestSchema.parse({ status });
  await api.request({
    method: "PATCH",
    path: `/people/${id}/status`,
    body: payload,
    bearer: true
  });
}
