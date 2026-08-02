import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type { PeopleManagementAuthorization } from "./people-management.authorization";
import { PeopleManagementError } from "./people-management.error";
import type { PeopleManagementRepository } from "./people-management.port";
import type { ListPeopleInput, ManagedPerson, PersonPage } from "./people-management.types";

export class PeopleManagementQueries {
  constructor(
    private readonly people: PeopleManagementRepository,
    private readonly authorization: PeopleManagementAuthorization
  ) {}

  list(principal: AuthenticatedPrincipal, input: ListPeopleInput): Promise<PersonPage> {
    this.authorization.assertList(principal, input.status);
    return this.people.list(principal.churchId, input);
  }

  async get(principal: AuthenticatedPrincipal, personId: string): Promise<ManagedPerson> {
    const person = await this.people.find(principal.churchId, personId);
    if (!person) throw new PeopleManagementError("PERSON_NOT_FOUND", "Person not found");
    this.authorization.assertView(principal, person);
    return person;
  }
}
