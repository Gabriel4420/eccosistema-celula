import type { ManagedPerson, PersonPage } from "../application/people-management.types";
import type { PeoplePageEnvelope, PersonResponse } from "@mission-atos/contracts";

export function presentPerson(person: ManagedPerson, includeObservations: boolean): PersonResponse {
  const base = {
    id: person.id, fullName: person.fullName, phone: person.phone, email: person.email,
    birthDate: person.birthDate?.toISOString().slice(0, 10) ?? null,
    gender: person.gender,
    status: person.deletedAt ? "INACTIVE" as const : "ACTIVE" as const,
    createdAt: person.createdAt.toISOString(), updatedAt: person.updatedAt.toISOString()
  };
  return includeObservations
    ? { ...base, observations: person.observations } : base;
}

export function presentPersonPage(page: PersonPage, includeObservations: boolean, pageNumber: number, pageSize: number): PeoplePageEnvelope {
  return {
    data: page.items.map((person) => presentPerson(person, includeObservations)),
    meta: { page: pageNumber, pageSize, totalItems: page.totalItems, totalPages: Math.ceil(page.totalItems / pageSize) }
  };
}
