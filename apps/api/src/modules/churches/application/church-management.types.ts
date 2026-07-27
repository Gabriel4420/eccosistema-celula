import type {
  ChurchWeekDay,
  UpdateChurchRequest,
  UpdateChurchSettingsRequest
} from "@mission-atos/contracts";

export interface ManagedChurch {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  addressLine: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;
  timezone: string;
  weekStartsOn: ChurchWeekDay;
  createdAt: Date;
  updatedAt: Date;
}

export type UpdateChurchInput = UpdateChurchRequest;
export type UpdateChurchSettingsInput = UpdateChurchSettingsRequest;

