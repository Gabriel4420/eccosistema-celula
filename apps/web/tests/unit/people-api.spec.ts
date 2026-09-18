import type { ApiClient } from "@/src/shared/api/api-client";
import {
  createPerson,
  getPerson,
  listPeople,
  updatePersonStatus
} from "@/src/features/people/api/people-api";

const requestMock = jest.fn();
const api = { request: requestMock } as unknown as ApiClient;

const PERSON_ID = "11111111-1111-4111-8111-111111111111";
const PAGE_META = { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 };

function requestOptions() {
  return requestMock.mock.calls[0]?.[0];
}

describe("people-api", () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it("lists people with pagination, filters and sort criteria", async () => {
    requestMock.mockResolvedValue({
      data: { data: [{ id: PERSON_ID }], meta: PAGE_META },
      meta: {}
    });

    const result = await listPeople(api, {
      page: 2,
      pageSize: 20,
      search: "maria",
      status: "ACTIVE",
      gender: "Feminino",
      sortBy: "birthDate",
      sortOrder: "desc"
    });

    expect(result.data).toEqual({ data: [{ id: PERSON_ID }], meta: PAGE_META });
    expect(requestOptions()).toMatchObject({
      method: "GET",
      path: "/people",
      bearer: true,
      allowRetry: true,
      query: {
        page: 2,
        pageSize: 20,
        search: "maria",
        status: "ACTIVE",
        gender: "Feminino",
        sortBy: "birthDate",
        sortOrder: "desc"
      }
    });
  });

  it("defaults to name ascending and active status when filters are omitted", async () => {
    requestMock.mockResolvedValue({
      data: { data: [], meta: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } },
      meta: {}
    });

    await listPeople(api, { page: 1, pageSize: 20 });

    expect(requestOptions()).toMatchObject({
      path: "/people",
      query: {
        page: 1,
        pageSize: 20,
        search: "",
        status: "ACTIVE",
        gender: "",
        sortBy: "fullName",
        sortOrder: "asc"
      }
    });
  });

  it("gets a single person by id", async () => {
    requestMock.mockResolvedValue({ data: { id: PERSON_ID }, meta: {} });
    const result = await getPerson(api, PERSON_ID);
    expect(result).toEqual({ id: PERSON_ID });
    expect(requestOptions()).toMatchObject({ method: "GET", path: `/people/${PERSON_ID}` });
  });

  it("creates a person", async () => {
    requestMock.mockResolvedValue({ data: { id: PERSON_ID }, meta: {} });
    const result = await createPerson(api, {
      fullName: "Maria da Silva",
      email: "maria@example.com"
    });
    expect(result).toEqual({ id: PERSON_ID });
    expect(requestOptions()).toMatchObject({
      method: "POST",
      path: "/people",
      body: { fullName: "Maria da Silva", email: "maria@example.com" }
    });
  });

  it("updates the person status", async () => {
    requestMock.mockResolvedValue({ data: null, meta: {} });
    await updatePersonStatus(api, PERSON_ID, "INACTIVE");
    expect(requestOptions()).toMatchObject({
      method: "PATCH",
      path: `/people/${PERSON_ID}/status`,
      body: { status: "INACTIVE" }
    });
  });
});