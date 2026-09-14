export type PersonStatus = "ACTIVE" | "INACTIVE";

export interface PersonCellLink {
  id: string;
  code: string;
  name: string;
}

export interface ManagedPerson {
  id: string;
  churchId: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  birthDate: Date | null;
  gender: string | null;
  observations: string | null;
  currentCell: PersonCellLink | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListPeopleInput {
  page: number;
  pageSize: number;
  search?: string;
  status: PersonStatus;
  gender?: string;
}

export interface PersonPage {
  items: ManagedPerson[];
  totalItems: number;
}

export interface PersonWriteInput {
  fullName: string;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
  gender: string | null;
  observations: string | null;
}

export type PersonPatchInput = Partial<PersonWriteInput>;
