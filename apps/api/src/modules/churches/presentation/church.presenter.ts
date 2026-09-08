import type {
  ManagedChurch,
  ManagedChurchSettings
} from "../application/church-management.types";

export function presentChurch(church: ManagedChurch) {
  return {
    id: church.id,
    name: church.name,
    slug: church.slug,
    email: church.email,
    phone: church.phone,
    address: {
      line: church.addressLine,
      number: church.addressNumber,
      complement: church.addressComplement,
      neighborhood: church.neighborhood,
      city: church.city,
      state: church.state,
      postalCode: church.postalCode,
      country: church.country
    },
    createdAt: church.createdAt.toISOString(),
    updatedAt: church.updatedAt.toISOString()
  };
}

export function presentChurchSettings(settings: ManagedChurchSettings) {
  return {
    timezone: settings.timezone,
    weekStartsOn: settings.weekStartsOn,
    reportDeadlineHours: settings.reportDeadlineHours
  };
}

