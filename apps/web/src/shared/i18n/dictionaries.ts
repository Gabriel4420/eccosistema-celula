import type { SettingsLocale } from "@mission-atos/contracts";

export const APP_LOCALES = ["pt-BR", "en", "es"] as const satisfies readonly SettingsLocale[];

export type AppLocale = (typeof APP_LOCALES)[number];

export type TranslationKey =
  | "app.title"
  | "app.meta.description"
  | "app.tagline"
  | "app.tagline.sub"
  | "app.tagline.description"
  // ----- common labels / actions -----
  | "common.cancel"
  | "common.save"
  | "common.saving"
  | "common.back"
  | "common.edit"
  | "common.close"
  | "common.search"
  | "common.actions"
  | "common.loading"
  | "common.retry"
  | "common.prev"
  | "common.next"
  | "common.all"
  | "common.select"
  | "common.add"
  | "common.create"
  | "common.details"
  | "common.status"
  | "common.optional"
  | "common.upload"
  | "common.remove"
  | "common.error"
  | "common.loadingContent"
  // ----- generic form labels -----
  | "label.firstName"
  | "label.lastName"
  | "label.name"
  | "label.email"
  | "label.phone"
  | "label.address"
  | "label.status"
  | "label.password"
  // ----- navigation -----
  | "nav.dashboard"
  | "nav.profile"
  | "nav.settings"
  | "nav.people"
  | "nav.cells"
  | "nav.reports"
  | "nav.users"
  | "nav.workspace"
  | "nav.openMenu"
  | "nav.closeMenu"
  | "nav.main"
  | "nav.help"
  | "nav.helpAction"
  | "nav.helpAria"
  | "breadcrumb.dashboard"
  | "breadcrumb.profile"
  | "breadcrumb.users"
  | "breadcrumb.usersImport"
  | "breadcrumb.usersNew"
  | "breadcrumb.usersDetail"
  | "breadcrumb.church"
  | "breadcrumb.churchSettings"
  | "breadcrumb.people"
  | "breadcrumb.peopleImport"
  | "breadcrumb.peopleNew"
  | "breadcrumb.peopleDetail"
  | "breadcrumb.cells"
  | "breadcrumb.cellsImport"
  | "breadcrumb.cellsNew"
  | "breadcrumb.cellsMeetingNew"
  | "breadcrumb.cellsMeetingDetail"
  | "breadcrumb.cellsMeetings"
  | "breadcrumb.cellsDetail"
  | "breadcrumb.meetings"
  | "breadcrumb.aria"
  | "breadcrumb.backToMeetings"
  | "shell.section"
  | "shell.skip"
  | "shell.loadingSession"
  | "theme.toggleDark"
  | "theme.toggleLight"
  // ----- user menu -----
  | "userMenu.fallback"
  | "userMenu.photoHint"
  | "userMenu.profile"
  | "userMenu.profileDesc"
  | "userMenu.settings"
  | "userMenu.settingsDesc"
  | "userMenu.signout"
  | "userMenu.signingOut"
  | "userMenu.signoutTitle"
  | "userMenu.open"
  | "userMenu.dialog"
  | "userMenu.close"
  // ----- shared components -----
  | "states.retry"
  | "pagination.aria"
  | "pagination.prev"
  | "pagination.next"
  | "pagination.info"
  | "statusBadge.active"
  | "statusBadge.inactive"
  | "statusBadge.blocked"
  | "toast.ariaNotifications"
  | "toast.closeNotification"
  | "field.showPassword"
  | "field.hidePassword"
  // ----- generic API / session errors -----
  | "api.generic"
  | "api.timeout"
  | "api.network"
  | "api.unauthorized"
  | "api.forbidden"
  | "api.notFound"
  | "api.conflict"
  | "api.rateLimited"
  // ----- roles -----
  | "role.admin"
  | "role.pastor"
  | "role.supervisor"
  | "role.leader"
  // ----- public bootstrap / login -----
  | "bootstrap.loading"
  | "bootstrap.verifying"
  | "bootstrap.aria"
  | "login.title"
  | "login.subtitle"
  | "login.alertTitle"
  | "login.emailLabel"
  | "login.passwordLabel"
  | "login.invalidEmail"
  | "login.requiredPassword"
  | "login.invalidCredentials"
  | "login.rateLimited"
  | "login.submit"
  | "login.submitting"
  | "login.genericError"
  | "login.toastTitle"
  | "login.presentationAria"
  | "login.brandAlt"
  // ----- error / not found / access denied pages -----
  | "accessDenied.title"
  | "accessDenied.description"
  | "accessDenied.back"
  | "errorPage.title"
  | "errorPage.description"
  | "errorPage.retry"
  | "notFound.title"
  | "notFound.description"
  | "notFound.home"
  // ----- dashboard -----
  | "dash.title"
  | "dash.overview"
  | "dash.description"
  | "dash.access"
  | "dash.quickAccess"
  | "dash.quickAccess.hint"
  | "dash.quickAccess.choose"
  | "dash.shortcut.profile"
  | "dash.shortcut.settings"
  | "dash.shortcut.people"
  | "dash.shortcut.cells"
  | "dash.shortcut.users"
  | "dash.loading"
  // ----- settings (pessoais) -----
  | "settings.page.title"
  | "settings.page.description"
  | "settings.section.regional"
  | "settings.section.operacional"
  | "settings.section.preferencias"
  | "settings.section.accessibility"
  | "settings.field.timezone"
  | "settings.field.timezone.hint"
  | "settings.field.weekStartsOn"
  | "settings.field.deadlineHours"
  | "settings.field.deadlineHours.hint"
  | "settings.field.language"
  | "settings.field.displayTimezone"
  | "settings.field.displayTimezone.null"
  | "settings.field.displayTimezone.hint"
  | "settings.field.dateFormat"
  | "settings.field.theme"
  | "settings.field.accessibilityContrast"
  | "settings.field.accessibilityTextScale"
  | "settings.field.accessibilityMotion"
  | "settings.field.accessibilityFocus"
  | "settings.accessibility.shortcut.contrast"
  | "settings.accessibility.shortcut.scale"
  | "settings.accessibility.system"
  | "settings.accessibility.standard"
  | "settings.accessibility.high"
  | "settings.accessibility.large"
  | "settings.accessibility.extraLarge"
  | "settings.accessibility.reduce"
  | "settings.accessibility.enhanced"
  | "settings.theme.light"
  | "settings.theme.dark"
  | "settings.theme.system"
  | "settings.locale.pt-BR"
  | "settings.locale.en"
  | "settings.locale.es"
  | "settings.btn.save"
  | "settings.btn.saving"
  | "settings.toast.saved"
  | "settings.toast.saved.desc"
  | "settings.toast.noop"
  | "settings.toast.noop.desc"
  | "settings.toast.error"
  | "settings.loading"
  | "settings.load.error"
  | "settings.load.retry"
  | "settings.unavailable"
  | "settings.unavailable.desc"
  // ----- church settings (institucional) -----
  | "church.title"
  | "church.section.info"
  | "church.section.address"
  | "church.section.regional"
  | "church.section.operacional"
  | "church.label.name"
  | "church.label.phone"
  | "church.label.cnpj"
  | "church.label.cep"
  | "church.label.street"
  | "church.label.number"
  | "church.label.neighborhood"
  | "church.label.city"
  | "church.label.state"
  | "church.label.complement"
  | "church.cep.placeholder"
  | "church.cep.invalid"
  | "church.save"
  | "church.saving"
  | "church.toast.saved"
  | "church.toast.error"
  | "church.loading"
  // ----- profile -----
  | "profile.title"
  | "profile.subtitle"
  | "profile.photoHint"
  | "profile.section.personal"
  | "profile.section.password"
  | "profile.passwordHint"
  | "profile.field.currentPassword"
  | "profile.field.newPassword"
  | "profile.field.confirmPassword"
  | "profile.passwordMin"
  | "profile.passwordMinHint"
  | "profile.passwordMismatch"
  | "profile.save"
  | "profile.saving"
  | "profile.requestChange"
  | "profile.confirm.title"
  | "profile.confirm.description"
  | "profile.confirm.action"
  | "profile.confirm.cancel"
  | "profile.confirm.changing"
  | "profile.toast.saved"
  | "profile.toast.saved.desc"
  | "profile.toast.error"
  | "profile.toast.passwordError"
  | "profile.load.error"
  | "profile.load.retry"
  | "profile.unavailable"
  | "profile.unavailable.desc"
  | "profile.photo.upload"
  | "profile.photo.remove"
  | "profile.photo.aria"
  | "profile.loading"
  // ----- people -----
  | "people.title"
  | "people.subtitle"
  | "people.add"
  | "people.import"
  | "people.search"
  | "people.empty"
  | "people.emptyState"
  | "people.error"
  | "people.loading"
  | "people.column.name"
  | "people.column.email"
  | "people.column.cell"
  | "people.column.status"
  | "people.column.actions"
  | "people.import.title"
  | "people.import.subtitle"
  | "people.detail.title"
  | "people.detail.section.info"
  | "people.detail.section.contact"
  | "people.detail.section.address"
  | "people.detail.section.links"
  | "people.detail.withoutCell"
  | "people.detail.field.birthDate"
  | "people.detail.field.notes"
  | "people.toast.updated"
  | "people.toast.error"
  | "people.new.title"
  | "people.new.subtitle"
  | "people.field.error.required"
  | "people.field.error.email"
  // ----- cells -----
  | "cells.title"
  | "cells.subtitle"
  | "cells.add"
  | "cells.import"
  | "cells.search"
  | "cells.filter.status"
  | "cells.filter.all"
  | "cells.filter.allStatuses"
  | "cells.filter.leader"
  | "cells.filter.supervisor"
  | "cells.filter.meetingDay"
  | "cells.filter.minMembers"
  | "cells.filter.maxMembers"
  | "cells.filter.allLeaders"
  | "cells.filter.allSupervisors"
  | "cells.filter.allDays"
  | "cells.filter.filtersAria"
  | "cells.empty"
  | "cells.emptyState"
  | "cells.error"
  | "cells.loading"
  | "cells.column.cell"
  | "cells.column.day"
  | "cells.column.time"
  | "cells.column.leader"
  | "cells.column.members"
  | "cells.column.status"
  | "cells.column.actions"
  | "cells.import.title"
  | "cells.import.subtitle"
  | "cells.new.title"
  | "cells.new.subtitle"
  | "cells.new.field.name"
  | "cells.new.field.day"
  | "cells.new.field.time"
  | "cells.new.field.address"
  | "cells.new.field.status"
  | "cells.toast.created"
  | "cells.toast.error"
  | "cells.detail.title"
  | "cells.detail.newMeeting"
  | "cells.detail.print"
  | "cells.detail.section.info"
  | "cells.detail.section.actions"
  | "cells.detail.section.leader"
  | "cells.detail.section.members"
  | "cells.members.loading"
  | "cells.members.empty"
  | "cells.members.empty.desc"
  | "cells.members.add"
  | "cells.members.add.title"
  | "cells.members.add.desc"
  | "cells.members.search"
  | "cells.members.search.hint"
  | "cells.members.reason"
  | "cells.members.reason.hint"
  | "cells.members.reason.required"
  | "cells.members.error.reasonRequired"
  | "cells.members.noCandidates"
  | "cells.members.searchFailed"
  | "cells.members.transferHint"
  | "cells.members.column.joined"
  | "cells.members.remove"
  | "cells.members.remove.title"
  | "cells.members.remove.desc"
  | "cells.members.toast.added"
  | "cells.members.toast.added.desc"
  | "cells.members.toast.removed"
  | "cells.members.toast.removed.desc"
  | "cells.members.error.load"
  | "cells.members.error.alreadyMember"
  | "cells.members.error.generic"
  | "cells.members.status.all"
  | "cells.members.status.active"
  | "cells.members.status.inactive"
  | "cells.members.status.transferred"
  | "cells.members.rowActions"
  | "cells.detail.section.recentMeetings"
  | "cells.detail.field.code"
  | "cells.status.formative"
  | "cells.status.active"
  | "cells.status.suspended"
  | "cells.status.closed"
  | "cells.day.monday"
  | "cells.day.tuesday"
  | "cells.day.wednesday"
  | "cells.day.thursday"
  | "cells.day.friday"
  | "cells.day.saturday"
  | "cells.day.sunday"
  | "cells.leader.label"
  | "cells.leader.none"
  // ----- meetings -----
  | "meetings.title"
  | "meetings.subtitle"
  | "meetings.add"
  | "meetings.empty"
  | "meetings.emptyState"
  | "meetings.error"
  | "meetings.loading"
  | "meetings.column.date"
  | "meetings.column.theme"
  | "meetings.column.participants"
  | "meetings.column.status"
  | "meetings.column.actions"
  | "meetings.new.title"
  | "meetings.new.subtitle"
  | "meetings.new.field.date"
  | "meetings.new.field.time"
  | "meetings.new.field.theme"
  | "meetings.new.field.notes"
  | "meetings.toast.created"
  | "meetings.toast.error"
  | "meetings.detail.title"
  | "meetings.detail.titleWithDate"
  | "meetings.detail.saveDate"
  | "meetings.detail.saving"
  | "meetings.detail.error.security"
  | "meetings.detail.attendance"
  | "meetings.detail.section.info"
  | "meetings.detail.section.participants"
  | "meetings.detail.section.report"
  | "meetings.detail.field.present"
  | "meetings.detail.field.visitors"
  | "meetings.status.scheduled"
  | "meetings.status.completed"
  | "meetings.status.cancelled"
  // ----- attendance -----
  | "attendance.title"
  | "attendance.present"
  | "attendance.absent"
  | "attendance.excused"
  | "attendance.unmarked"
  | "attendance.save"
  | "attendance.saving"
  | "attendance.visitor.dialogTitle"
  | "attendance.visitor.dialogDescription"
  | "attendance.visitor.source"
  | "attendance.visitor.sourceQuick"
  | "attendance.visitor.sourceExisting"
  | "attendance.visitor.person"
  | "attendance.visitor.name"
  | "attendance.visitor.phoneOptional"
  | "attendance.visitor.invitedBy"
  | "attendance.visitor.notInformed"
  | "attendance.visitor.add"
  | "attendance.toast.saved"
  | "attendance.toast.error"
  // ----- analytics -----
  | "analytics.title"
  | "analytics.legend"
  | "analytics.cellActive"
  | "analytics.members"
  | "analytics.meetingsMonth"
  | "analytics.avgAttendance"
  | "analytics.updated"
  | "analytics.loading"
  | "analytics.forbidden"
  | "analytics.unavailable"
  | "analytics.unavailable.desc"
  | "analytics.subtitle"
  | "analytics.empty"
  | "analytics.empty.desc"
  | "analytics.people"
  | "analytics.forming"
  | "analytics.attendanceRate"
  | "analytics.noData"
  | "analytics.averagePresent"
  | "analytics.completionRate"
  | "analytics.meetingsShort"
  | "analytics.visitors"
  | "analytics.vsPrevious"
  | "analytics.evolution"
  | "analytics.evolution.empty"
  | "analytics.evolution.empty.desc"
  | "analytics.meetingsChartAria"
  | "analytics.presentMembersShort"
  | "analytics.visitorsShort"
  | "analytics.attendanceChartAria"
  | "analytics.cellAlerts"
  | "analytics.emptyCells"
  | "analytics.emptyCells.desc"
  | "analytics.withoutRecentMeeting"
  | "analytics.clickToSeeCells"
  | "analytics.allRecent"
  | "analytics.last"
  | "analytics.noCompleteMeeting"
  | "analytics.statusUnknown"
  // ----- users -----
  | "users.title"
  | "users.subtitle"
  | "users.add"
  | "users.import"
  | "users.search"
  | "users.empty"
  | "users.emptyState"
  | "users.error"
  | "users.loading"
  | "users.column.user"
  | "users.column.email"
  | "users.column.role"
  | "users.column.status"
  | "users.column.actions"
  | "users.import.title"
  | "users.import.subtitle"
  | "users.new.title"
  | "users.new.field.password"
  | "users.new.field.confirmPassword"
  | "users.new.passwordMin"
  | "users.new.create"
  | "users.detail.title"
  | "users.detail.field.phone"
  | "users.detail.field.createdAt"
  | "users.detail.activate"
  | "users.detail.deactivate"
  | "users.detail.resetPassword"
  | "users.toast.created"
  | "users.toast.updated"
  | "users.toast.error"
  | "users.strength.label"
  | "users.strength.weak"
  | "users.strength.fair"
  | "users.strength.strong"
  | "users.strength.veryWeak"
  | "users.strength.good"
  | "users.strength.empty"
  | "users.strength.require.length"
  | "users.strength.require.alphanum"
  // ----- reports -----
  | "reports.title"
  | "reports.subtitle"
  | "reports.loading"
  | "reports.card.visitors"
  | "reports.card.meetings"
  | "reports.card.attendance"
  | "reports.card.pending"
  | "reports.visitors.title"
  | "reports.visitors.empty"
  | "reports.visitors.column.visitor"
  | "reports.visitors.column.cell"
  | "reports.visitors.column.meeting"
  | "reports.visitors.column.date"
  | "reports.visitors.column.status"
  | "reports.visitors.column.invitedBy"
  | "reports.pending.title"
  | "reports.pending.column.cell"
  | "reports.pending.column.leader"
  | "reports.pending.column.meeting"
  | "reports.pending.column.deadline"
  | "reports.pending.column.status"
  | "reports.pending.status.pending"
  | "reports.pending.status.onTime"
  | "reports.pending.status.late"
  | "reports.pending.link"
  | "reports.pending.empty"
  | "reports.meetings.title"
  | "reports.meetings.column.date"
  | "reports.meetings.column.cell"
  | "reports.meetings.column.theme"
  | "reports.meetings.column.participants"
  | "reports.meetings.column.visitors"
  | "reports.attendance.title"
  | "reports.attendance.column.person"
  | "reports.attendance.column.present"
  | "reports.attendance.column.absent"
  | "reports.attendance.column.excused"
  | "reports.attendance.column.percentage"
  | "reports.attendance.details"
  | "reports.attendanceDetail.title"
  | "reports.attendanceDetail.column.person"
  | "reports.attendanceDetail.column.status"
  | "reports.attendanceDetail.column.marked"
  | "reports.attendanceDetail.empty"
  | "reports.export.csv"
  | "reports.export.exporting"
  | "reports.export.aria"
  | "reports.export.language"
  | "reports.period.default"
  | "reports.period.last30"
  | "reports.period.last60"
  | "reports.period.thisMonth"
  // ----- bulk import -----
  | "bulk.label.file"
  | "bulk.label.fileField"
  | "bulk.label.downloadModel"
  | "bulk.label.structure"
  | "bulk.label.send"
  | "bulk.label.sending"
  | "bulk.label.submit"
  | "bulk.success"
  | "bulk.imported"
  | "bulk.errorRows"
  | "bulk.downloadErrors"
  | "bulk.guide.title"
  | "bulk.guide.step1"
  | "bulk.guide.step2"
  | "bulk.guide.step3"
  | "bulk.guide.note.cellCode"
  | "bulk.guide.note.roles"
  | "bulk.guide.note.initialPassword"
  | "bulk.guide.eyebrow"
  | "bulk.guide.heading"
  | "bulk.guide.intro"
  | "bulk.guide.stepDownload"
  | "bulk.guide.stepFill"
  | "bulk.guide.stepSend"
  | "bulk.guide.namesAlertTitle"
  | "bulk.guide.namesAlertDesc"
  | "bulk.guide.columnsTitle"
  | "bulk.guide.columnsTableLabel"
  | "bulk.guide.column.name"
  | "bulk.guide.column.requirement"
  | "bulk.guide.column.guidance"
  | "bulk.guide.daysTitle"
  | "bulk.guide.formatsTitle"
  | "bulk.guide.format.excel.label"
  | "bulk.guide.format.excel.body"
  | "bulk.guide.format.csv.label"
  | "bulk.guide.format.csv.body"
  | "bulk.guide.format.json.label"
  | "bulk.guide.format.json.intro"
  | "bulk.guide.format.json.keys"
  | "bulk.guide.format.json.count"
  | "bulk.guide.jsonExample"
  | "bulk.guide.afterTitle"
  | "bulk.guide.afterDesc"
  | "bulk.guide.records.people"
  | "bulk.guide.records.cells"
  | "bulk.guide.records.users"
  | "bulk.guide.permission.adminPastor"
  | "bulk.guide.permission.adminOnly"
  | "bulk.guide.duplicate.people"
  | "bulk.guide.duplicate.cells"
  | "bulk.guide.duplicate.users"
  | "bulk.guide.rolesNote"
  | "bulk.guide.req.requiredF"
  | "bulk.guide.req.requiredM"
  | "bulk.guide.req.optional"
  | "bulk.guide.req.conditional"
  | "bulk.guide.day.monday"
  | "bulk.guide.day.tuesday"
  | "bulk.guide.day.wednesday"
  | "bulk.guide.day.thursday"
  | "bulk.guide.day.friday"
  | "bulk.guide.day.saturday"
  | "bulk.guide.day.sunday"
  | "bulk.guide.col.people.fullName"
  | "bulk.guide.col.people.phone"
  | "bulk.guide.col.people.email"
  | "bulk.guide.col.people.birthDate"
  | "bulk.guide.col.people.gender"
  | "bulk.guide.col.people.observations"
  | "bulk.guide.col.people.cellCode"
  | "bulk.guide.col.cells.code"
  | "bulk.guide.col.cells.name"
  | "bulk.guide.col.cells.status"
  | "bulk.guide.col.cells.leaderId"
  | "bulk.guide.col.cells.supervisorId"
  | "bulk.guide.col.cells.traineeLeaderId"
  | "bulk.guide.col.cells.meetingDay"
  | "bulk.guide.col.cells.meetingTime"
  | "bulk.guide.col.cells.address"
  | "bulk.guide.col.users.firstName"
  | "bulk.guide.col.users.lastName"
  | "bulk.guide.col.users.email"
  | "bulk.guide.col.users.initialPassword"
  | "bulk.guide.col.users.roles"
  | "users.import.label.initialPassword"
  | "users.import.label.roleNames"
  // ----- people (additional) -----
  | "people.column.phone"
  | "people.column.birthDate"
  | "people.column.gender"
  | "people.filter.all"
  | "people.filter.active"
  | "people.filter.inactive"
  | "people.gender.male"
  | "people.gender.female"
  | "people.gender.other"
  | "people.field.gender"
  | "people.search.hint"
  | "people.action.clearFilters"
  | "people.action.reactivate"
  | "people.action.viewDetails"
  | "people.sort.label"
  | "people.sort.nameAsc"
  | "people.sort.nameDesc"
  | "people.sort.birthDateDesc"
  | "people.sort.birthDateAsc"
  | "people.sort.createdAtDesc"
  | "people.sort.createdAtAsc"
  | "people.emptyState.desc"
  | "people.error.retry"
  | "people.alert.success"
  | "people.alert.failure"
  | "people.toast.reactivated"
  | "people.toast.reactivated.desc"
  | "people.toast.reactivateError"
  | "people.detail.loading"
  | "people.error.load"
  | "people.detail.empty"
  | "people.detail.empty.desc"
  | "people.toast.noChange"
  | "people.toast.noChange.desc"
  | "people.detail.saved.desc"
  | "people.detail.error.save"
  | "people.detail.error.invalidDate"
  | "people.toast.inactivated"
  | "people.toast.inactivated.desc"
  | "people.detail.error.inactivate"
  | "people.detail.back"
  | "people.detail.label.gender"
  | "people.detail.label.registration"
  | "people.detail.edit"
  | "people.detail.field.fullName"
  | "people.detail.saveChanges"
  | "people.detail.inactivatePerson"
  | "people.detail.inactivate.title"
  | "people.detail.inactivate.desc"
  | "people.detail.inactivate.inactivating"
  | "people.detail.inactivate.action"
  | "people.toast.created"
  | "people.new.description"
  | "people.new.legend.identification"
  | "people.new.legend.contact"
  | "people.new.legend.observations"
  | "people.new.hint.name"
  | "people.new.hint.gender"
  | "people.new.hint.email"
  | "people.new.hint.phone"
  | "people.new.hint.observations"
  | "people.new.submit"
  | "people.new.submitting"
  | "people.new.error.duplicate"
  | "people.new.error.generic"
  | "people.new.error.invalidDate"
  // ----- cells (additional) -----
  | "cells.page.subtitle"
  | "cells.action.clearFilters"
  | "cells.error.retry"
  | "cells.emptyState.desc"
  | "cells.column.code"
  | "cells.column.supervisor"
  | "cells.column.meeting"
  | "cells.action.viewDetails"
  | "cells.search.hint"
  | "cells.detail.loading"
  | "cells.error.load"
  | "cells.detail.empty"
  | "cells.detail.empty.desc"
  | "cells.detail.error.form"
  | "cells.detail.toast.updated"
  | "cells.detail.toast.saved.desc"
  | "cells.detail.toast.activated"
  | "cells.detail.toast.suspended"
  | "cells.detail.toast.activated.desc"
  | "cells.detail.toast.suspended.desc"
  | "cells.detail.toast.leadership"
  | "cells.detail.toast.leadership.desc"
  | "cells.detail.toast.trainee"
  | "cells.detail.toast.trainee.desc"
  | "cells.detail.error.leaderRequired"
  | "cells.detail.status.suspend"
  | "cells.detail.status.activate"
  | "cells.detail.status.reactivate"
  | "cells.detail.status.suspend.desc"
  | "cells.detail.status.activate.desc"
  | "cells.detail.back"
  | "cells.detail.viewMeetings"
  | "cells.detail.label.supervisor"
  | "cells.detail.label.trainee"
  | "cells.detail.label.meeting"
  | "cells.detail.label.address"
  | "cells.detail.label.created"
  | "cells.detail.label.updated"
  | "cells.detail.edit"
  | "cells.detail.field.name"
  | "cells.detail.field.meetingDay"
  | "cells.detail.field.time"
  | "cells.detail.field.address"
  | "cells.detail.time.hint"
  | "cells.detail.saveChanges"
  | "cells.detail.suspend"
  | "cells.detail.changeLeader"
  | "cells.detail.changeTrainee"
  | "cells.detail.removeTrainee"
  | "cells.detail.assignTrainee"
  | "cells.detail.noManage"
  | "cells.detail.dialog.confirming"
  | "cells.detail.dialog.confirm"
  | "cells.detail.dialog.changeLeader.title"
  | "cells.detail.dialog.changeLeader.desc"
  | "cells.detail.dialog.trainee.title"
  | "cells.detail.dialog.trainee.desc"
  | "cells.detail.dialog.removeTrainee.title"
  | "cells.detail.dialog.removeTrainee.desc"
  | "cells.detail.dialog.removeTrainee.confirm"
  | "cells.detail.error.codeConflict"
  | "cells.detail.error.leaderNotEligible"
  | "cells.detail.error.supervisorConflict"
  | "cells.detail.error.candidateNotFound"
  | "cells.detail.error.transitionInvalid"
  | "cells.detail.error.generic"
  | "cells.action.saveChanges"
  | "cells.action.changeStatus"
  | "cells.action.changeLeadership"
  | "cells.action.changeTrainee"
  | "cells.create.error.generic"
  | "cells.create.error.codeConflict"
  | "cells.create.error.leaderNotEligible"
  | "cells.create.error.supervisorConflict"
  | "cells.create.error.candidateNotFound"
  | "cells.create.error.idempotency"
  | "cells.create.legend.identification"
  | "cells.create.legend.leadership"
  | "cells.create.legend.meeting"
  | "cells.create.hint.code"
  | "cells.create.hint.name"
  | "cells.create.hint.status"
  | "cells.create.hint.leader"
  | "cells.create.hint.supervisor"
  | "cells.create.hint.trainee"
  | "cells.create.hint.time"
  | "cells.create.hint.address"
  | "cells.create.submit"
  | "cells.create.submitting"
  | "cells.create.alertTitle"
  | "cells.assignment.loadError"
  | "cells.assignment.noCandidates"
  | "cells.assignment.clearLabel"
  | "cells.assignment.optionsLabel"
  // ----- meetings (additional) -----
  | "meetings.page.subtitle"
  | "meetings.action.clearFilters"
  | "meetings.error.retry"
  | "meetings.emptyState.desc"
  | "meetings.column.updatedAt"
  | "meetings.action.viewDetails"
  | "meetings.filter.all"
  | "meetings.field.from"
  | "meetings.field.to"
  | "meetings.date.hint"
  | "meetings.detail.loading"
  | "meetings.error.load"
  | "meetings.detail.empty"
  | "meetings.detail.empty.desc"
  | "meetings.detail.dateError"
  | "meetings.detail.toast.dateUpdated"
  | "meetings.detail.toast.dateUpdated.desc"
  | "meetings.detail.toast.observations"
  | "meetings.detail.toast.observations.desc"
  | "meetings.detail.toast.completed"
  | "meetings.detail.toast.completed.desc"
  | "meetings.detail.toast.cancelled"
  | "meetings.detail.toast.cancelled.desc"
  | "meetings.detail.error.reason"
  | "meetings.detail.back"
  | "meetings.detail.label.cell"
  | "meetings.detail.label.cancelReason"
  | "meetings.detail.label.created"
  | "meetings.detail.label.updated"
  | "meetings.detail.openAttendance"
  | "meetings.detail.editDate"
  | "meetings.detail.observations"
  | "meetings.detail.observations.placeholder"
  | "meetings.detail.saveObservations"
  | "meetings.detail.completeMeeting"
  | "meetings.detail.cancelMeeting"
  | "meetings.detail.dialog.complete.title"
  | "meetings.detail.dialog.complete.desc"
  | "meetings.detail.dialog.cancel.title"
  | "meetings.detail.dialog.cancel.desc"
  | "meetings.detail.dialog.cancel.placeholder"
  | "meetings.detail.dialog.cancel.back"
  | "meetings.detail.dialog.cancel.confirm"
  | "meetings.detail.dialog.cancelling"
  | "meetings.detail.dialog.confirming"
  | "meetings.detail.error.generic"
  | "meetings.action.updateDate"
  | "meetings.action.saveObservations"
  | "meetings.action.completeMeeting"
  | "meetings.action.cancelMeeting"
  | "meetings.detail.error.notEditable"
  | "meetings.detail.error.transitionInvalid"
  | "meetings.detail.error.reportNotEditable"
  | "meetings.detail.error.dateConflict"
  | "meetings.new.legend.date"
  | "meetings.new.hint.date"
  | "meetings.new.submit"
  | "meetings.new.submitting"
  | "meetings.new.alertTitle"
  | "meetings.new.error.generic"
  | "meetings.new.error.dateConflict"
  | "meetings.new.error.cellNotFound"
  | "meetings.new.error.cellStatusInvalid"
  | "meetings.new.error.accessDenied"
  | "meetings.new.error.transitionInvalid"
  | "meetings.new.error.notEditable"
  | "meetings.new.error.reportNotEditable"
  | "meetings.new.error.retryExhausted"
  | "meetings.new.error.idempotency"
  // ----- attendance (additional) -----
  | "attendance.detail.summary"
  | "attendance.pageTitle"
  | "attendance.saveFrequency"
  | "attendance.toast.savedTitle"
  | "attendance.conflict.message"
  | "attendance.detail.visitors"
  | "attendance.search"
  | "attendance.summary.present"
  | "attendance.summary.absent"
  | "attendance.summary.excused"
  | "attendance.summary.unmarked"
  | "attendance.summary.visitors"
  | "attendance.back"
  | "attendance.alertTitle"
  | "attendance.skipChanges"
  | "attendance.skipChanges.confirm"
  | "attendance.forbidden"
  | "attendance.forbidden.desc"
  | "attendance.unavailable"
  | "attendance.unavailable.desc"
  | "attendance.notAvailable"
  | "attendance.notAvailable.desc"
  | "attendance.loading"
  | "attendance.conflict"
  | "attendance.conflict.reload"
  | "attendance.conflict.updated"
  | "attendance.readOnlyTitle"
  | "attendance.readOnlyDesc"
  | "attendance.searchParticipant"
  | "attendance.addVisitor"
  | "attendance.noParticipantFound"
  | "attendance.noParticipantFound.desc"
  | "attendance.noEligibleParticipants"
  | "attendance.noEligibleParticipants.desc"
  | "attendance.personFrequency"
  | "attendance.contactPending"
  | "attendance.removeVisitorConfirm"
  | "attendance.removeVisitor"
  | "attendance.discardChanges"
  | "attendance.unsaved"
  | "attendance.observation"
  | "attendance.toast.saved.desc"
  | "attendance.error.save"
  | "attendance.error.addVisitor"
  | "attendance.visitor.observation"
  // ----- users (additional) -----
  | "users.page.subtitle"
  | "users.action.clearFilters"
  | "users.error.retry"
  | "users.emptyState.desc"
  | "users.action.viewDetails"
  | "users.search.hint"
  | "users.filter.all"
  | "users.column.roles"
  | "users.field.role"
  | "users.detail.loading"
  | "users.error.load"
  | "users.detail.empty"
  | "users.detail.empty.desc"
  | "users.detail.back"
  | "users.detail.edit"
  | "users.detail.saveChanges"
  | "users.detail.toast.updated.desc"
  | "users.detail.error.save"
  | "users.detail.toast.activated"
  | "users.detail.toast.activated.desc"
  | "users.detail.toast.blocked"
  | "users.detail.toast.blocked.desc"
  | "users.detail.toast.roles"
  | "users.detail.toast.roles.desc"
  | "users.detail.toast.password"
  | "users.detail.toast.password.desc"
  | "users.detail.roles.legend"
  | "users.detail.roles.hint"
  | "users.detail.saveRoles"
  | "users.detail.blockUser"
  | "users.detail.activateUser"
  | "users.detail.dialog.block.title"
  | "users.detail.dialog.activate.title"
  | "users.detail.dialog.roles.title"
  | "users.detail.dialog.reset.title"
  | "users.detail.dialog.block.desc"
  | "users.detail.dialog.activate.desc"
  | "users.detail.dialog.roles.desc"
  | "users.detail.dialog.reset.desc"
  | "users.detail.dialog.newPassword"
  | "users.detail.dialog.passwordHint"
  | "users.detail.dialog.confirming"
  | "users.detail.error.lastAdmin"
  | "users.detail.error.emailConflict"
  | "users.detail.error.generic"
  | "users.modal.roles"
  | "users.modal.noRoles"
  | "users.modal.accountInfo"
  | "users.modal.createdAt"
  | "users.modal.updatedAt"
  | "users.modal.photo"
  | "users.modal.photoSet"
  | "users.modal.photoNotSet"
  | "users.modal.userId"
  | "users.modal.openPage"
  | "users.new.legend.access"
  | "users.new.hint.password"
  | "users.new.error.roles"
  | "users.new.error.password"
  | "users.new.submit"
  | "users.new.submitting"
  | "users.new.error.emailConflict"
  | "users.new.error.generic"
  | "users.new.alertTitle"
  | "users.new.toast.created.desc"
  | "users.new.legend.roles"
  | "users.new.noRoles"
  | "users.new.noRoles.desc"
  | "users.loading.roles"
  | "users.error.loadRoles"
  | "users.strength.require.uppercase"
  | "users.strength.require.lowercase"
  | "users.strength.require.number"
  | "users.strength.require.special"
  | "users.strength.require.aria"
  | "users.strength.emptyAria"
  | "users.strength.requirementsAria"
  // ----- reports (additional) -----
  | "reports.hub.title"
  | "reports.hub.subtitle"
  | "reports.hub.card.pending"
  | "reports.hub.card.pending.desc"
  | "reports.hub.card.attendance"
  | "reports.hub.card.attendance.desc"
  | "reports.hub.card.visitors"
  | "reports.hub.card.visitors.desc"
  | "reports.hub.card.meetings"
  | "reports.hub.card.meetings.desc"
  | "reports.visitors.page.description"
  | "reports.visitors.metric.total"
  | "reports.visitors.metric.pending"
  | "reports.visitors.metric.topCell"
  | "reports.visitors.filter.contact"
  | "reports.visitors.filter.all"
  | "reports.visitors.status.pending"
  | "reports.visitors.status.done"
  | "reports.visitors.action.clearFilters"
  | "reports.visitors.error"
  | "reports.visitors.error.retry"
  | "reports.visitors.loading"
  | "reports.visitors.emptyState"
  | "reports.visitors.emptyState.desc"
  | "reports.visitors.column.contact"
  | "reports.visitors.column.name"
  | "reports.visitors.filter.period"
  | "reports.visitors.pageTitle"
  | "reports.pending.page.description"
  | "reports.pending.filter.all"
  | "reports.pending.status.noReport"
  | "reports.pending.status.notStarted"
  | "reports.pending.status.draft"
  | "reports.pending.status.returned"
  | "reports.pending.status.submitted"
  | "reports.pending.action.clearFilters"
  | "reports.pending.error"
  | "reports.pending.error.retry"
  | "reports.pending.loading"
  | "reports.pending.emptyState"
  | "reports.pending.emptyState.desc"
  | "reports.pending.column.date"
  | "reports.pending.column.days"
  | "reports.pending.filter.period"
  | "reports.pending.pageTitle"
  | "reports.pending.filter.status"
  | "reports.meetings.page.description"
  | "reports.meetings.filter.status"
  | "reports.meetings.pageTitle"
  | "reports.meetings.status.scheduled"
  | "reports.meetings.status.completed"
  | "reports.meetings.status.canceled"
  | "reports.meetings.action.clearFilters"
  | "reports.meetings.filter.all"
  | "reports.meetings.column.status"
  | "reports.meetings.column.present"
  | "reports.meetings.column.absent"
  | "reports.meetings.column.rate"
  | "reports.meetings.column.report"
  | "reports.meetings.error"
  | "reports.meetings.error.retry"
  | "reports.meetings.loading"
  | "reports.meetings.emptyState"
  | "reports.meetings.emptyState.desc"
  | "reports.meetings.filter.period"
  | "reports.meetings.reportStatus.notStarted"
  | "reports.meetings.reportStatus.draft"
  | "reports.meetings.reportStatus.submitted"
  | "reports.meetings.reportStatus.returned"
  | "reports.meetings.reportStatus.cancelled"
  | "reports.attendance.page.description"
  | "reports.attendance.filter.period"
  | "reports.attendance.filter.health"
  | "reports.attendance.filter.all"
  | "reports.attendance.pageTitle"
  | "reports.attendance.band.healthy"
  | "reports.attendance.band.attention"
  | "reports.attendance.band.critical"
  | "reports.attendance.action.clearFilters"
  | "reports.attendance.error"
  | "reports.attendance.error.retry"
  | "reports.attendance.loading"
  | "reports.attendance.emptyState"
  | "reports.attendance.emptyState.desc"
  | "reports.attendance.column.cell"
  | "reports.attendance.column.leader"
  | "reports.attendance.column.meetings"
  | "reports.attendance.column.rate"
  | "reports.attendance.column.average"
  | "reports.attendance.column.visitors"
  | "reports.attendance.column.health"
  | "reports.attendanceDetail.page.crumb"
  | "reports.attendanceDetail.filter.period"
  | "reports.attendanceDetail.action.reload"
  | "reports.attendanceDetail.error"
  | "reports.attendanceDetail.error.retry"
  | "reports.attendanceDetail.loading"
  | "reports.attendanceDetail.emptyState"
  | "reports.attendanceDetail.emptyState.desc"
  | "reports.attendanceDetail.column.present"
  | "reports.attendanceDetail.column.absent"
  | "reports.attendanceDetail.column.excused"
  | "reports.attendanceDetail.column.rate"
  | "reports.attendanceDetail.pageTitle"
  | "reports.export.label"
  // ----- bulk import (additional) -----
  | "bulk.form.legend"
  | "bulk.form.hint"
  | "bulk.form.error.empty"
  | "bulk.form.error.extension"
  | "bulk.form.error.size"
  | "bulk.form.choose"
  | "bulk.form.change"
  | "bulk.form.none"
  | "bulk.form.submit"
  | "bulk.form.submitting"
  | "bulk.form.download"
  | "bulk.form.back"
  | "bulk.form.alertError"
  | "bulk.form.error.generic"
  | "bulk.form.toast.title"
  | "bulk.form.toast.desc"
  | "bulk.result.allCreated"
  | "bulk.result.pending"
  | "bulk.result.summary"
  | "bulk.result.title"
  | "bulk.result.aria"
  | "bulk.column.row"
  | "bulk.column.status"
  | "bulk.column.details"
  | "bulk.status.created"
  | "bulk.status.error"
  | "bulk.noObservations"
  // ----- profile photo (additional) -----
  | "profile.photo.dialog.title"
  | "profile.photo.dialog.desc"
  | "profile.photo.previewAlt"
  | "profile.photo.choose"
  | "profile.photo.help"
  | "profile.photo.error.format"
  | "profile.photo.save"
  | "profile.photo.toast.saved"
  | "profile.photo.toast.saved.desc"
  | "profile.photo.toast.removed"
  | "profile.photo.toast.removed.desc"
  | "profile.photo.error.save"
  | "profile.photo.error.remove"
  | "profile.photo.aria.menu"
  | "profile.photo.aria.change"
  | "profile.photo.removeShort"
  | "profile.photo.toast.removeError"
  // ----- church (additional) -----
  | "church.page.title"
  | "church.page.description"
  | "church.section.institutional"
  | "church.field.name"
  | "church.field.slug"
  | "church.hint.slug"
  | "church.hint.phone"
  | "church.hint.timezone"
  | "church.field.weekStart"
  | "church.saveData"
  | "church.saveSettings"
  | "church.toast.savedData.desc"
  | "church.toast.savedSettings.desc"
  | "church.toast.noChange"
  | "church.toast.noChange.desc"
  | "church.toast.noChangeSettings.desc"
  | "church.error.save"
  | "church.error.saveSettings"
  | "church.error.load"
  | "church.empty.title"
  | "church.empty.desc"
  | "church.loading.church"
  | "church.address.cep.hint"
  | "church.address.cep.digits"
  | "church.address.lookupSuccess"
  | "church.address.lookupNotFound"
  | "church.address.lookupError"
  | "church.address.lookupLoading"
  | "church.address.field.country"
  | "church.label.stateUf"
  | "church.field.email"
  | "church.section.settings"
  | "church.field.timezone"
  | "church.toast.savedData"
  | "church.toast.savedSettings"
  | "church.error.retry"
  | "people.page.title"
  | "people.page.subtitle"
  | "people.new"
  | "people.error.list"
  | "people.emptyState.title"
  | "people.detail.toast.updated"
  | "people.detail.field.observations"
  | "cells.page.title"
  | "cells.new"
  | "cells.error.list"
  | "cells.emptyState.title"
  | "cells.column.name"
  | "cells.detail.meetingAt"
  | "cells.detail.error.tryAgain"
  | "common.success"
  | "common.failure"
  | "cells.create.back"
  | "cells.create.toast.created"
  | "meetings.page.title"
  | "meetings.new"
  | "meetings.error.list"
  | "meetings.emptyState.title"
  | "common.confirm"
  | "meetings.detail.error.tryAgain"
  | "meetings.new.toast.created";

export type TranslationParams = Record<string, string | number>;

type Dictionary = Record<TranslationKey, string>;

export const dictionaries: Record<AppLocale, Dictionary> = {
  "pt-BR": {
    "app.title": "Ecossistema de Células",
    "app.meta.description": "Ecossistema de gestão de células e pequenos grupos.",
    "app.tagline": "Gestão que aproxima.",
    "app.tagline.sub": "Uma visão clara para cuidar de cada célula.",
    "app.tagline.description": "Organize pessoas, encontros e liderança em um só lugar.",
    "common.cancel": "Cancelar",
    "common.save": "Salvar",
    "common.saving": "Salvando…",
    "common.back": "Voltar",
    "common.edit": "Editar",
    "common.close": "Fechar",
    "common.search": "Buscar",
    "common.actions": "Ações",
    "common.loading": "Carregando",
    "common.retry": "Tentar novamente",
    "common.prev": "Anterior",
    "common.next": "Próxima",
    "common.all": "Todas",
    "common.select": "Selecione",
    "common.add": "Adicionar",
    "common.create": "Criar",
    "common.details": "Detalhes",
    "common.status": "Status",
    "common.optional": "opcional",
    "common.upload": "Enviar foto",
    "common.remove": "Remover",
    "common.error": "Erro",
    "common.loadingContent": "Carregando conteúdo",
    "label.firstName": "Nome",
    "label.lastName": "Sobrenome",
    "label.name": "Nome",
    "label.email": "E-mail",
    "label.phone": "Telefone",
    "label.address": "Endereço",
    "label.status": "Status",
    "label.password": "Senha",
    "nav.dashboard": "Painel",
    "nav.profile": "Meu perfil",
    "nav.settings": "Configurações",
    "nav.people": "Pessoas",
    "nav.cells": "Células",
    "nav.reports": "Relatórios",
    "nav.users": "Usuários",
    "nav.workspace": "Workspace",
    "nav.openMenu": "Abrir menu",
    "nav.closeMenu": "Fechar menu",
    "nav.main": "Navegação principal",
    "nav.help": "Precisa de ajuda?",
    "nav.helpAction": "Fale pelo WhatsApp",
    "nav.helpAria": "Precisa de ajuda? Conversar pelo WhatsApp (abre em nova aba)",
    "breadcrumb.dashboard": "Painel",
    "breadcrumb.profile": "Meu perfil",
    "breadcrumb.users": "Usuarios",
    "breadcrumb.usersImport": "Importar usuarios",
    "breadcrumb.usersNew": "Novo usuario",
    "breadcrumb.usersDetail": "Detalhe do usuario",
    "breadcrumb.church": "Igreja",
    "breadcrumb.churchSettings": "Configurações",
    "breadcrumb.people": "Pessoas",
    "breadcrumb.peopleImport": "Importar pessoas",
    "breadcrumb.peopleNew": "Nova pessoa",
    "breadcrumb.peopleDetail": "Detalhe da pessoa",
    "breadcrumb.cells": "Celulas",
    "breadcrumb.cellsImport": "Importar celulas",
    "breadcrumb.cellsNew": "Nova celula",
    "breadcrumb.cellsMeetingNew": "Novo encontro",
    "breadcrumb.cellsMeetingDetail": "Detalhe do encontro",
    "breadcrumb.cellsMeetings": "Encontros",
    "breadcrumb.cellsDetail": "Detalhe da celula",
    "breadcrumb.meetings": "Encontros",
    "breadcrumb.aria": "Trilha de navegação",
    "breadcrumb.backToMeetings": "Encontros",
    "shell.section": "Gestão de células",
    "shell.skip": "Pular para o conteúdo principal",
    "shell.loadingSession": "Carregando sessão",
    "theme.toggleDark": "Ativar tema escuro",
    "theme.toggleLight": "Ativar tema claro",
    "userMenu.fallback": "Usuário",
    "userMenu.photoHint": "Clique na foto para alterar",
    "userMenu.profile": "Meu perfil",
    "userMenu.profileDesc": "Dados pessoais e foto",
    "userMenu.settings": "Configurações",
    "userMenu.settingsDesc": "Preferências e aparência",
    "userMenu.signout": "Sair",
    "userMenu.signingOut": "Saindo…",
    "userMenu.signoutTitle": "Encerrar esta sessão",
    "userMenu.open": "Abrir menu da conta",
    "userMenu.dialog": "Conta do usuário",
    "userMenu.close": "Fechar menu da conta",
    "states.retry": "Tentar novamente",
    "pagination.aria": "Paginação",
    "pagination.prev": "Anterior",
    "pagination.next": "Próxima",
    "pagination.info": "Página {page} de {totalPages} · {from}–{to} de {totalItems}",
    "statusBadge.active": "Ativo",
    "statusBadge.inactive": "Inativo",
    "statusBadge.blocked": "Bloqueado",
    "toast.ariaNotifications": "Notificações",
    "toast.closeNotification": "Fechar notificação",
    "field.showPassword": "Mostrar senha",
    "field.hidePassword": "Ocultar senha",
    "api.generic": "Não foi possível concluir a operação. Tente novamente.",
    "api.timeout": "A requisição demorou demais. Tente novamente.",
    "api.network": "Falha de conexão com o servidor.",
    "api.unauthorized": "Sua sessão expirou. Entre novamente.",
    "api.forbidden": "Você não tem permissão para realizar esta ação.",
    "api.notFound": "O recurso solicitado não foi encontrado.",
    "api.conflict": "Conflito com os dados atuais.",
    "api.rateLimited": "Muitas tentativas. Aguarde um momento.",
    "role.admin": "Administrador",
    "role.pastor": "Pastor",
    "role.supervisor": "Supervisor",
    "role.leader": "Líder",
    "bootstrap.loading": "Ecossistema de Células",
    "bootstrap.verifying": "Verificando sua sessão…",
    "bootstrap.aria": "Carregando sessão",
    "login.title": "Acesse sua conta",
    "login.subtitle": "Use seus dados para entrar no Ecossistema de Células.",
    "login.alertTitle": "Não foi possível entrar",
    "login.emailLabel": "E-mail",
    "login.passwordLabel": "Senha",
    "login.invalidEmail": "Informe um e-mail válido.",
    "login.requiredPassword": "Informe sua senha.",
    "login.invalidCredentials": "E-mail ou senha inválidos.",
    "login.rateLimited": "Muitas tentativas. Aguarde um momento e tente novamente.",
    "login.submit": "Entrar",
    "login.submitting": "Entrando…",
    "login.genericError": "Não foi possível entrar. Tente novamente.",
    "login.toastTitle": "Não foi possível entrar",
    "login.presentationAria": "Apresentação do Ecossistema de Células",
    "login.brandAlt": "Missão Atos — Igreja em Células",
    "accessDenied.title": "Acesso negado",
    "accessDenied.description": "Sua conta não possui permissão para acessar este recurso. Caso precise de acesso, fale com um administrador.",
    "accessDenied.back": "Voltar ao painel",
    "errorPage.title": "Algo deu errado",
    "errorPage.description": "Não foi possível concluir a operação. Tente novamente em instantes.",
    "errorPage.retry": "Tentar novamente",
    "notFound.title": "Página não encontrada",
    "notFound.description": "A página solicitada não existe ou foi movida.",
    "notFound.home": "Ir para o início",
    "dash.title": "Painel",
    "dash.overview": "Visão geral",
    "dash.description": "Organize pessoas, acompanhe células e mantenha a liderança conectada.",
    "dash.access": "Acesso: {role}",
    "dash.quickAccess": "Acesso rápido",
    "dash.quickAccess.hint": "O que você quer fazer?",
    "dash.quickAccess.choose": "Escolha uma área para continuar.",
    "dash.shortcut.profile": "Atualize seus dados e altere sua senha.",
    "dash.shortcut.settings": "Preferências pessoais e ajustes da igreja.",
    "dash.shortcut.people": "Consulte e gerencie as pessoas da igreja.",
    "dash.shortcut.cells": "Consulte e gerencie as células da igreja.",
    "dash.shortcut.users": "Gerencie contas, papéis e acesso.",
    "dash.loading": "Carregando painel",
    "settings.page.title": "Configurações",
    "settings.page.description": "Preferências pessoais e ajustes operacionais da igreja.",
    "settings.section.regional": "Regional",
    "settings.section.operacional": "Operacional",
    "settings.section.preferencias": "Preferências",
    "settings.section.accessibility": "Acessibilidade",
    "settings.field.timezone": "Fuso horário",
    "settings.field.timezone.hint": "IANA, ex.: America/Sao_Paulo.",
    "settings.field.weekStartsOn": "Início da semana",
    "settings.field.deadlineHours": "Prazo para relatório (horas)",
    "settings.field.deadlineHours.hint": "Horas após o fim do dia do encontro para submissão do relatório (1–720).",
    "settings.field.language": "Idioma",
    "settings.field.displayTimezone": "Fuso de exibição",
    "settings.field.displayTimezone.null": "Herdar da igreja",
    "settings.field.displayTimezone.hint": "Deixe vazio para herdar o fuso da igreja.",
    "settings.field.dateFormat": "Formato de data",
    "settings.field.theme": "Tema",
    "settings.field.accessibilityContrast": "Contraste",
    "settings.field.accessibilityTextScale": "Tamanho do texto",
    "settings.field.accessibilityMotion": "Movimento",
    "settings.field.accessibilityFocus": "Destaque de foco",
    "settings.accessibility.shortcut.contrast": "Contraste: {value}",
    "settings.accessibility.shortcut.scale": "Tamanho do texto: {value}",
    "settings.accessibility.system": "Usar preferência do sistema",
    "settings.accessibility.standard": "Padrão",
    "settings.accessibility.high": "Alto contraste",
    "settings.accessibility.large": "Grande",
    "settings.accessibility.extraLarge": "Extra grande",
    "settings.accessibility.reduce": "Reduzir movimento",
    "settings.accessibility.enhanced": "Reforçado",
    "settings.theme.light": "Claro",
    "settings.theme.dark": "Escuro",
    "settings.theme.system": "Sistema",
    "settings.locale.pt-BR": "Português (Brasil)",
    "settings.locale.en": "English",
    "settings.locale.es": "Español",
    "settings.btn.save": "Salvar",
    "settings.btn.saving": "Salvando…",
    "settings.toast.saved": "Configurações salvas",
    "settings.toast.saved.desc": "As alterações foram aplicadas com sucesso.",
    "settings.toast.noop": "Nenhuma alteração",
    "settings.toast.noop.desc": "Não havia dados novos para salvar.",
    "settings.toast.error": "Não foi possível salvar. Verifique os valores e tente novamente.",
    "settings.loading": "Carregando configurações",
    "settings.load.error": "Não foi possível carregar as configurações",
    "settings.load.retry": "Tente novamente em instantes.",
    "settings.unavailable": "Configurações indisponíveis",
    "settings.unavailable.desc": "As configurações não puderam ser carregadas.",
    "church.title": "Configurações da igreja",
    "church.section.info": "Informações da igreja",
    "church.section.address": "Endereço",
    "church.section.regional": "Regional",
    "church.section.operacional": "Operacional",
    "church.label.name": "Nome da igreja",
    "church.label.phone": "Telefone",
    "church.label.cnpj": "CNPJ",
    "church.label.cep": "CEP",
    "church.label.street": "Logradouro",
    "church.label.number": "Número",
    "church.label.neighborhood": "Bairro",
    "church.label.city": "Cidade",
    "church.label.state": "Estado",
    "church.label.complement": "Complemento",
    "church.cep.placeholder": "Ex.: 15000-000",
    "church.cep.invalid": "Informe um CEP válido.",
    "church.save": "Salvar",
    "church.saving": "Salvando…",
    "church.toast.saved": "Configurações salvas",
    "church.toast.error": "Não foi possível salvar. Verifique os valores e tente novamente.",
    "church.loading": "Carregando configurações",
    "profile.title": "Meu perfil",
    "profile.subtitle": "Mantenha seus dados pessoais atualizados. E-mail e acesso são controlados por um administrador.",
    "profile.photoHint": "Clique na foto para alterar.",
    "profile.section.personal": "Dados pessoais",
    "profile.section.password": "Alterar senha",
    "profile.passwordHint": "Após confirmar, sua sessão será encerrada e você deverá entrar novamente.",
    "profile.field.currentPassword": "Senha atual",
    "profile.field.newPassword": "Nova senha",
    "profile.field.confirmPassword": "Confirmar nova senha",
    "profile.passwordMin": "A nova senha deve ter ao menos {min} caracteres.",
    "profile.passwordMinHint": "Ao menos {min} caracteres.",
    "profile.passwordMismatch": "As senhas não coincidem.",
    "profile.save": "Salvar alterações",
    "profile.saving": "Salvando…",
    "profile.requestChange": "Solicitar alteração de senha",
    "profile.confirm.title": "Confirmar alteração de senha",
    "profile.confirm.description": "Sua senha será alterada e todas as suas sessões serão encerradas. Você precisará entrar novamente.",
    "profile.confirm.action": "Confirmar alteração",
    "profile.confirm.cancel": "Cancelar",
    "profile.confirm.changing": "Alterando…",
    "profile.toast.saved": "Perfil atualizado",
    "profile.toast.saved.desc": "Seus dados foram salvos.",
    "profile.toast.error": "Não foi possível salvar suas alterações. Tente novamente.",
    "profile.toast.passwordError": "Não foi possível alterar a senha. Verifique a senha atual e tente novamente.",
    "profile.load.error": "Não foi possível carregar seu perfil",
    "profile.load.retry": "Tente novamente em instantes.",
    "profile.unavailable": "Perfil indisponível",
    "profile.unavailable.desc": "Seus dados não puderam ser carregados.",
    "profile.photo.upload": "Enviar foto",
    "profile.photo.remove": "Remover foto",
    "profile.photo.aria": "Alterar foto",
    "profile.loading": "Carregando perfil",
    "profile.photo.aria.menu": "Abrir menu da conta",
    "profile.photo.aria.change": "Alterar foto de perfil",
    "profile.photo.removeShort": "Remover",
    "profile.photo.toast.removeError": "Não foi possível remover a foto.",
    "people.title": "Pessoas",
    "people.subtitle": "Consulte e gerencie as pessoas da igreja.",
    "people.add": "Adicionar pessoa",
    "people.import": "Importar pessoas",
    "people.search": "Buscar por nome",
    "people.empty": "Nenhuma pessoa encontrada",
    "people.emptyState": "Nenhuma pessoa cadastrada ainda.",
    "people.error": "Não foi possível carregar as pessoas",
    "people.loading": "Carregando pessoas",
    "people.column.name": "Nome",
    "people.column.email": "E-mail",
    "people.column.cell": "Célula",
    "people.column.status": "Status",
    "people.column.actions": "Ações",
    "people.import.title": "Importar pessoas",
    "people.import.subtitle": "Cadastre várias pessoas e, opcionalmente, vincule-as a células pelo código.",
    "people.detail.title": "Detalhe da pessoa",
    "people.detail.section.info": "Informações pessoais",
    "people.detail.section.contact": "Contato",
    "people.detail.section.address": "Endereço",
    "people.detail.section.links": "Vínculos",
    "people.detail.withoutCell": "Sem célula",
    "people.detail.field.birthDate": "Data de nascimento",
    "people.detail.field.notes": "Observações",
    "people.toast.updated": "Pessoa atualizada",
    "people.toast.error": "Não foi possível salvar",
    "people.new.title": "Nova pessoa",
    "people.new.subtitle": "Cadastre uma pessoa para acompanhar participação nas células.",
    "people.field.error.required": "Informe o nome.",
    "people.field.error.email": "Informe um e-mail válido.",
    "cells.title": "Células",
    "cells.subtitle": "Consulte e gerencie as células da igreja e seus encontros.",
    "cells.add": "Nova célula",
    "cells.import": "Importar células",
    "cells.search": "Buscar células",
    "cells.filter.status": "Status",
    "cells.filter.all": "Todas",
    "cells.filter.allStatuses": "Todos",
    "cells.filter.leader": "Líder",
    "cells.filter.supervisor": "Supervisor",
    "cells.filter.meetingDay": "Dia da reunião",
    "cells.filter.minMembers": "Mín. de membros",
    "cells.filter.maxMembers": "Máx. de membros",
    "cells.filter.allLeaders": "Todos os líderes",
    "cells.filter.allSupervisors": "Todos os supervisores",
    "cells.filter.allDays": "Todos os dias",
    "cells.filter.filtersAria": "Filtros adicionais",
    "cells.empty": "Nenhuma célula encontrada",
    "cells.emptyState": "Você ainda não tem células cadastradas.",
    "cells.error": "Não foi possível carregar as células",
    "cells.loading": "Carregando células",
    "cells.column.cell": "Célula",
    "cells.column.day": "Dia",
    "cells.column.time": "Horário",
    "cells.column.leader": "Líder",
    "cells.column.members": "Membros",
    "cells.column.status": "Status",
    "cells.column.actions": "Ações",
    "cells.import.title": "Importar células",
    "cells.import.subtitle": "Cadastre células em formação ou ativas usando dados já preparados.",
    "cells.new.title": "Nova célula",
    "cells.new.subtitle": "Crie uma célula e defina líder, dia e horário de encontro.",
    "cells.new.field.name": "Nome da célula",
    "cells.new.field.day": "Dia da semana",
    "cells.new.field.time": "Horário",
    "cells.new.field.address": "Endereço",
    "cells.new.field.status": "Status",
    "cells.toast.created": "Célula criada",
    "cells.toast.error": "Não foi possível criar a célula",
    "cells.detail.title": "Detalhe da célula",
    "cells.detail.newMeeting": "Novo encontro",
    "cells.detail.print": "Imprimir relatório",
    "cells.detail.section.info": "Informações",
    "cells.detail.section.actions": "Ações",
    "cells.detail.section.leader": "Líder",
    "cells.detail.section.members": "Membros",
    "cells.detail.section.recentMeetings": "Encontros recentes",
    "cells.members.loading": "Carregando membros",
    "cells.members.empty": "Nenhum membro encontrado",
    "cells.members.empty.desc": "Adicione uma pessoa a esta célula para acompanhar a participação.",
    "cells.members.add": "Adicionar membro",
    "cells.members.add.title": "Adicionar membro",
    "cells.members.add.desc": "A pessoa passa a fazer parte da célula. Se estiver ativa em outra célula, será transferida automaticamente.",
    "cells.members.search": "Buscar pessoa",
    "cells.members.search.hint": "Digite o nome, telefone ou e-mail.",
    "cells.members.reason": "Motivo",
    "cells.members.reason.hint": "Obrigatório para líderes e pastores na transferência e na remoção.",
    "cells.members.reason.required": "Informe o motivo.",
    "cells.members.error.reasonRequired": "Líderes e pastores devem informar um motivo para transferência ou remoção.",
    "cells.members.noCandidates": "Nenhuma pessoa disponível para adicionar.",
    "cells.members.searchFailed": "Não foi possível buscar pessoas.",
    "cells.members.transferHint": "Está em {cell} — será transferida",
    "cells.members.column.joined": "Entrou em",
    "cells.members.remove": "Remover",
    "cells.members.remove.title": "Remover membro",
    "cells.members.remove.desc": "O vínculo de {name} com esta célula será encerrado, sem excluir a pessoa.",
    "cells.members.toast.added": "Membro adicionado",
    "cells.members.toast.added.desc": "{name} agora faz parte desta célula.",
    "cells.members.toast.removed": "Membro removido",
    "cells.members.toast.removed.desc": "O vínculo de {name} com esta célula foi encerrado.",
    "cells.members.error.load": "Não foi possível carregar os membros.",
    "cells.members.error.alreadyMember": "A pessoa já é membro ativo desta célula.",
    "cells.members.error.generic": "Não foi possível concluir a ação {action}.",
    "cells.members.status.all": "Todos",
    "cells.members.status.active": "Ativo",
    "cells.members.status.inactive": "Inativo",
    "cells.members.status.transferred": "Transferido",
    "cells.members.rowActions": "Ações de {name}",
    "cells.detail.field.code": "Código",
    "cells.status.formative": "Em formação",
    "cells.status.active": "Ativa",
    "cells.status.suspended": "Suspensa",
    "cells.status.closed": "Encerrada",
    "cells.day.monday": "Segunda-feira",
    "cells.day.tuesday": "Terça-feira",
    "cells.day.wednesday": "Quarta-feira",
    "cells.day.thursday": "Quinta-feira",
    "cells.day.friday": "Sexta-feira",
    "cells.day.saturday": "Sábado",
    "cells.day.sunday": "Domingo",
    "cells.leader.label": "Líder",
    "cells.leader.none": "Nenhuma pessoa disponível",
    "meetings.title": "Encontros",
    "meetings.subtitle": "Acompanhe e registre os encontros das células.",
    "meetings.add": "Novo encontro",
    "meetings.empty": "Nenhum encontro registrado ainda.",
    "meetings.emptyState": "Registre o primeiro encontro de uma célula.",
    "meetings.error": "Não foi possível carregar os encontros",
    "meetings.loading": "Carregando encontros",
    "meetings.column.date": "Data",
    "meetings.column.theme": "Tema",
    "meetings.column.participants": "Participantes",
    "meetings.column.status": "Status",
    "meetings.column.actions": "Ações",
    "meetings.new.title": "Novo encontro",
    "meetings.new.subtitle": "Registre um encontro para a célula.",
    "meetings.new.field.date": "Data",
    "meetings.new.field.time": "Horário",
    "meetings.new.field.theme": "Tema",
    "meetings.new.field.notes": "Observações",
    "meetings.toast.created": "Encontro criado",
    "meetings.toast.error": "Não foi possível criar o encontro",
    "meetings.detail.title": "Detalhe do encontro",
    "meetings.detail.titleWithDate": "Encontro - {date}",
    "meetings.detail.saveDate": "Salvar data",
    "meetings.detail.saving": "Salvando...",
    "meetings.detail.error.security": "Não foi possível {action}. O servidor pode ter recusado por segurança.",
    "meetings.detail.attendance": "Registrar presença",
    "meetings.detail.section.info": "Informações",
    "meetings.detail.section.participants": "Participantes",
    "meetings.detail.section.report": "Relatório",
    "meetings.detail.field.present": "Presenças",
    "meetings.detail.field.visitors": "Visitantes",
    "meetings.status.scheduled": "Agendado",
    "meetings.status.completed": "Concluído",
    "meetings.status.cancelled": "Cancelado",
    "attendance.title": "Registrar presença",
    "attendance.present": "Presente",
    "attendance.absent": "Ausente",
    "attendance.excused": "Justificado",
    "attendance.unmarked": "Limpar",
    "attendance.save": "Salvar presença",
    "attendance.saving": "Salvando…",
    "attendance.visitor.dialogTitle": "Adicionar visitante",
    "attendance.visitor.dialogDescription": "Use uma pessoa existente ou faça um cadastro rápido.",
    "attendance.visitor.source": "Origem",
    "attendance.visitor.sourceQuick": "Cadastro rápido",
    "attendance.visitor.sourceExisting": "Pessoa existente",
    "attendance.visitor.person": "Pessoa",
    "attendance.visitor.name": "Nome",
    "attendance.visitor.phoneOptional": "Telefone opcional",
    "attendance.visitor.invitedBy": "Convidado por",
    "attendance.visitor.notInformed": "Não informado",
    "attendance.visitor.add": "Adicionar",
    "attendance.toast.saved": "Presenças salvas",
    "attendance.toast.error": "Não foi possível salvar as presenças",
    "analytics.title": "Indicadores",
    "analytics.legend": "Visão geral das próximas 4 semanas",
    "analytics.cellActive": "Células ativas",
    "analytics.members": "Membros",
    "analytics.meetingsMonth": "Encontros no mês",
    "analytics.avgAttendance": "Presença média",
    "analytics.updated": "Atualizado {date}",
    "analytics.loading": "Carregando indicadores",
    "analytics.forbidden": "Sua conta não possui permissão para visualizar os indicadores.",
    "analytics.unavailable": "Indicadores indisponíveis no momento",
    "analytics.unavailable.desc": "Não foi possível carregar os indicadores do painel. Tente novamente em instantes.",
    "analytics.subtitle": "Saúde da igreja — últimos 30 dias",
    "analytics.empty": "Sem indicadores ainda",
    "analytics.empty.desc": "Não há dados suficientes para exibir indicadores.",
    "analytics.people": "Pessoas",
    "analytics.forming": "formando",
    "analytics.attendanceRate": "Taxa de presença",
    "analytics.noData": "sem dados",
    "analytics.averagePresent": "Público médio",
    "analytics.completionRate": "Realização",
    "analytics.meetingsShort": "encontros",
    "analytics.visitors": "Visitantes",
    "analytics.vsPrevious": "vs. anterior",
    "analytics.evolution": "Evolução mensal",
    "analytics.evolution.empty": "Sem série mensal",
    "analytics.evolution.empty.desc": "Ainda não há encontros no período.",
    "analytics.meetingsChartAria": "Gráfico de encontros por mês",
    "analytics.presentMembersShort": "presentes",
    "analytics.visitorsShort": "visitantes",
    "analytics.attendanceChartAria": "Gráfico de presentes e visitantes por mês",
    "analytics.cellAlerts": "Atenção às células",
    "analytics.emptyCells": "Sem células",
    "analytics.emptyCells.desc": "Nenhuma célula encontrada para gerar alertas.",
    "analytics.withoutRecentMeeting": "{count} célula(s) sem encontro há {days} dias",
    "analytics.clickToSeeCells": "Clique para ver as células.",
    "analytics.allRecent": "Todas as células ativas realizaram encontros recentes.",
    "analytics.last": "últ.",
    "analytics.noCompleteMeeting": "sem encontro completo",
    "analytics.statusUnknown": "Status desconhecido",
    "users.title": "Usuários",
    "users.subtitle": "Gerencie contas, papéis e acesso.",
    "users.add": "Novo usuário",
    "users.import": "Importar usuários",
    "users.search": "Buscar usuários",
    "users.empty": "Nenhum usuário encontrado",
    "users.emptyState": "Não há usuários cadastrados ainda.",
    "users.error": "Não foi possível carregar os usuários",
    "users.loading": "Carregando usuários",
    "users.column.user": "Usuário",
    "users.column.email": "E-mail",
    "users.column.role": "Papel",
    "users.column.status": "Status",
    "users.column.actions": "Ações",
    "users.import.title": "Importar usuários",
    "users.import.subtitle": "Crie contas em lote informando senha inicial e nomes dos papéis de acesso.",
    "users.new.title": "Novo usuário",
    "users.new.field.password": "Senha inicial",
    "users.new.field.confirmPassword": "Confirmar senha",
    "users.new.passwordMin": "A senha deve ter ao menos 12 caracteres.",
    "users.new.create": "Criar usuário",
    "users.detail.title": "Detalhe do usuário",
    "users.detail.field.phone": "Telefone",
    "users.detail.field.createdAt": "Criado em",
    "users.detail.activate": "Ativar",
    "users.detail.deactivate": "Desativar",
    "users.detail.resetPassword": "Redefinir senha",
    "users.toast.created": "Usuário criado",
    "users.toast.updated": "Usuário atualizado",
    "users.toast.error": "Não foi possível salvar",
    "users.strength.label": "Força da senha",
    "users.strength.weak": "Fraca",
    "users.strength.fair": "Média",
    "users.strength.strong": "Forte",
    "users.strength.veryWeak": "Muito fraca",
    "users.strength.good": "Boa",
    "users.strength.empty": "Digite uma senha",
    "users.strength.require.length": "Pelo menos 12 caracteres",
    "users.strength.require.alphanum": "Letras e números",
    "reports.title": "Relatórios",
    "reports.subtitle": "Acompanhe métricas e pendências do ministério de células.",
    "reports.loading": "Carregando relatórios",
    "reports.card.visitors": "Visitantes",
    "reports.card.meetings": "Encontros",
    "reports.card.attendance": "Presença",
    "reports.card.pending": "Pendências",
    "reports.visitors.title": "Relatório de visitantes",
    "reports.visitors.empty": "Nenhum visitante no período",
    "reports.visitors.column.visitor": "Visitante",
    "reports.visitors.column.cell": "Célula",
    "reports.visitors.column.meeting": "Encontro",
    "reports.visitors.column.date": "Data",
    "reports.visitors.column.status": "Status",
    "reports.visitors.column.invitedBy": "Convidado por",
    "reports.pending.title": "Pendências de relatório",
    "reports.pending.column.cell": "Célula",
    "reports.pending.column.leader": "Líder",
    "reports.pending.column.meeting": "Encontro",
    "reports.pending.column.deadline": "Prazo",
    "reports.pending.column.status": "Status",
    "reports.pending.status.pending": "Pendente",
    "reports.pending.status.onTime": "No prazo",
    "reports.pending.status.late": "Atrasado",
    "reports.pending.link": "Registrar agora",
    "reports.pending.empty": "Nenhuma pendência",
    "reports.meetings.title": "Relatório de encontros",
    "reports.meetings.column.date": "Data",
    "reports.meetings.column.cell": "Célula",
    "reports.meetings.column.theme": "Tema",
    "reports.meetings.column.participants": "Participantes",
    "reports.meetings.column.visitors": "Visitantes",
    "reports.attendance.title": "Relatório de presença",
    "reports.attendance.column.person": "Pessoa",
    "reports.attendance.column.present": "Presente",
    "reports.attendance.column.absent": "Ausente",
    "reports.attendance.column.excused": "Justificado",
    "reports.attendance.column.percentage": "Percentual",
    "reports.attendance.details": "Detalhes",
    "reports.attendanceDetail.title": "Detalhes de presença",
    "reports.attendanceDetail.column.person": "Pessoa",
    "reports.attendanceDetail.column.status": "Status",
    "reports.attendanceDetail.column.marked": "Marcado",
    "reports.attendanceDetail.empty": "Nenhum registro nesta data",
    "reports.export.csv": "Exportar CSV",
    "reports.export.exporting": "Exportando…",
    "reports.export.aria": "Exportar relatório",
    "reports.export.language": "Idioma do relatório",
    "reports.period.default": "Padrão (30 dias)",
    "reports.period.last30": "Últimos 30 dias",
    "reports.period.last60": "Últimos 60 dias",
    "reports.period.thisMonth": "Este mês",
    "bulk.label.file": "Arquivo CSV",
    "bulk.label.fileField": "Arquivo",
    "bulk.label.downloadModel": "Baixar modelo",
    "bulk.label.structure": "Estrutura do arquivo",
    "bulk.label.send": "Enviar arquivo",
    "bulk.label.sending": "Enviando…",
    "bulk.label.submit": "Importar",
    "bulk.success": "Importação concluída com sucesso.",
    "bulk.imported": "{count} registros importados",
    "bulk.errorRows": "Erro em {count} linhas",
    "bulk.downloadErrors": "Baixar erros",
    "bulk.guide.title": "Como importar",
    "bulk.guide.step1": "1. Baixe o modelo",
    "bulk.guide.step2": "2. Preencha os dados",
    "bulk.guide.step3": "3. Envie o arquivo",
    "bulk.guide.note.cellCode": "Código da célula",
    "bulk.guide.note.roles": "Papéis permitidos",
    "bulk.guide.note.initialPassword": "Senha inicial",
    "bulk.guide.eyebrow": "Guia de importação",
    "bulk.guide.heading": "Como preparar o arquivo",
    "bulk.guide.intro": "A importação aceita um arquivo por vez, com no máximo 5 MB e 2.000 linhas. Os registros válidos entram na igreja da sua sessão; cada linha inválida aparece no resultado sem impedir as outras.",
    "bulk.guide.stepDownload": "Baixe o modelo CSV no formulário abaixo e mantenha os nomes das colunas exatamente iguais.",
    "bulk.guide.stepFill": "Preencha uma linha para cada registro. Deixe os campos opcionais vazios quando não houver informação.",
    "bulk.guide.stepSend": "Envie o arquivo e confira a tabela Resultado por linha. Corrija somente as linhas com erro e envie apenas essas linhas novamente.",
    "bulk.guide.namesAlertTitle": "Nomes exatos, sem colunas extras",
    "bulk.guide.namesAlertDesc": "Excel, CSV e JSON usam exatamente os nomes desta tabela. Qualquer coluna ou campo desconhecido invalida a linha.",
    "bulk.guide.columnsTitle": "Colunas aceitas",
    "bulk.guide.columnsTableLabel": "Colunas aceitas para importar {records}",
    "bulk.guide.column.name": "Coluna",
    "bulk.guide.column.requirement": "Obrigatoriedade",
    "bulk.guide.column.guidance": "Como preencher",
    "bulk.guide.daysTitle": "Códigos dos dias da semana",
    "bulk.guide.formatsTitle": "Formato do arquivo",
    "bulk.guide.format.excel.label": "Excel",
    "bulk.guide.format.excel.body": "use a primeira aba. A primeira linha deve conter os nomes exatos das colunas. Cada linha seguinte é um registro. Ignore linhas em branco e não inclua títulos, totais ou células mescladas. Digite horários como texto e datas como AAAA-MM-DD.",
    "bulk.guide.format.csv.label": "CSV",
    "bulk.guide.format.csv.body": "a primeira linha deve conter os nomes exatos das colunas. Separe os valores por vírgula e salve em UTF-8. Coloque entre aspas qualquer valor com vírgula ou quebra de linha. Deixe campos opcionais vazios.",
    "bulk.guide.format.json.label": "JSON",
    "bulk.guide.format.json.intro": "envie uma lista de objetos ou um objeto com a chave ",
    "bulk.guide.format.json.keys": ". Use exatamente os nomes das colunas como chaves e omita os campos opcionais em vez de usar ",
    "bulk.guide.format.json.count": ". A contagem começa na primeira linha de dados; o cabeçalho não conta.",
    "bulk.guide.jsonExample": "Exemplo JSON para importar {records}",
    "bulk.guide.afterTitle": "Depois do envio",
    "bulk.guide.afterDesc": "{rule} Somente registros novos são criados; envie novamente apenas as linhas corrigidas para não duplicar registros.",
    "bulk.guide.records.people": "pessoas",
    "bulk.guide.records.cells": "células",
    "bulk.guide.records.users": "usuários",
    "bulk.guide.permission.adminPastor": "Disponível para administradores e pastores.",
    "bulk.guide.permission.adminOnly": "Disponível somente para administradores.",
    "bulk.guide.duplicate.people": "Telefone, e-mail ou nome com nascimento repetidos geram erro na linha correspondente.",
    "bulk.guide.duplicate.cells": "Código repetido no arquivo ou já existente na igreja gera erro na linha correspondente.",
    "bulk.guide.duplicate.users": "E-mail repetido gera erro na linha correspondente.",
    "bulk.guide.rolesNote": "Na planilha ou no CSV, separe os papéis com |, por exemplo ADMIN|PASTOR. Se usar vírgula dentro do CSV, coloque o valor entre aspas. No JSON, use uma lista, por exemplo [\"LEADER\"].",
    "bulk.guide.req.requiredF": "Obrigatória",
    "bulk.guide.req.requiredM": "Obrigatório",
    "bulk.guide.req.optional": "Opcional",
    "bulk.guide.req.conditional": "Condicional",
    "bulk.guide.day.monday": "segunda-feira",
    "bulk.guide.day.tuesday": "terça-feira",
    "bulk.guide.day.wednesday": "quarta-feira",
    "bulk.guide.day.thursday": "quinta-feira",
    "bulk.guide.day.friday": "sexta-feira",
    "bulk.guide.day.saturday": "sábado",
    "bulk.guide.day.sunday": "domingo",
    "bulk.guide.col.people.fullName": "Nome completo, com até 200 caracteres. Espaços extras são ajustados.",
    "bulk.guide.col.people.phone": "Telefone internacional começando com +, por exemplo +5511999999999. Deixe vazio para omitir.",
    "bulk.guide.col.people.email": "E-mail válido. O sistema converte para letras minúsculas.",
    "bulk.guide.col.people.birthDate": "Data no formato AAAA-MM-DD, por exemplo 1990-05-20. Não use data futura.",
    "bulk.guide.col.people.gender": "Texto livre com até 50 caracteres, por exemplo Feminino.",
    "bulk.guide.col.people.observations": "Texto com 1 a 10.000 caracteres quando preenchido. Deixe vazio para omitir.",
    "bulk.guide.col.people.cellCode": "Código de uma célula existente na mesma igreja, por exemplo CEL-001. Cria o vínculo ativo; código inexistente reprova a linha.",
    "bulk.guide.col.cells.code": "Código com até 50 caracteres. Acentos e espaços viram hífens e tudo fica em maiúsculas, por exemplo CEL-001.",
    "bulk.guide.col.cells.name": "Nome da célula, com até 160 caracteres.",
    "bulk.guide.col.cells.status": "Use FORMING, ACTIVE ou SUSPENDED. Sem valor, a célula nasce em formação. ACTIVE exige líder e supervisor.",
    "bulk.guide.col.cells.leaderId": "Identificador interno do usuário líder, não o nome nem o e-mail. Obrigatório para ACTIVE. Sem o identificador, importe como FORMING e atribua depois.",
    "bulk.guide.col.cells.supervisorId": "Identificador interno do usuário supervisor. Obrigatório para ACTIVE e omitido para FORMING sem liderança.",
    "bulk.guide.col.cells.traineeLeaderId": "Identificador interno do líder em treinamento. Deixe vazio quando não houver.",
    "bulk.guide.col.cells.meetingDay": "Código exato do dia em inglês maiúsculo, por exemplo WEDNESDAY.",
    "bulk.guide.col.cells.meetingTime": "Horário no formato 24 horas HH:MM, por exemplo 19:30. Na planilha, digite como texto.",
    "bulk.guide.col.cells.address": "Endereço com até 500 caracteres.",
    "bulk.guide.col.users.firstName": "Nome com até 100 caracteres.",
    "bulk.guide.col.users.lastName": "Sobrenome com até 100 caracteres.",
    "bulk.guide.col.users.email": "E-mail válido e único. O sistema converte para letras minúsculas.",
    "bulk.guide.col.users.initialPassword": "Senha de 12 a 128 caracteres, com maiúscula, minúscula, número e símbolo.",
    "bulk.guide.col.users.roles": "De 1 a 4 nomes diferentes entre ADMIN, PASTOR, SUPERVISOR e LEADER. Informe nomes de papéis, não identificadores.",
    "users.import.label.initialPassword": "Senha inicial",
    "users.import.label.roleNames": "Nomes dos papéis de acesso",
    "people.column.phone": "Telefone",
    "people.column.birthDate": "Nascimento",
    "people.column.gender": "Gênero",
    "people.filter.all": "Todos",
    "people.filter.active": "Ativo",
    "people.filter.inactive": "Inativo",
    "people.gender.male": "Masculino",
    "people.gender.female": "Feminino",
    "people.gender.other": "Outro",
    "people.field.gender": "Gênero",
    "people.search.hint": "Nome, e-mail ou telefone",
    "people.sort.label": "Ordenar por",
    "people.sort.nameAsc": "Nome (A–Z)",
    "people.sort.nameDesc": "Nome (Z–A)",
    "people.sort.birthDateDesc": "Nascimento (mais recente)",
    "people.sort.birthDateAsc": "Nascimento (mais antigo)",
    "people.sort.createdAtDesc": "Cadastros mais recentes",
    "people.sort.createdAtAsc": "Cadastros mais antigos",
    "people.action.clearFilters": "Limpar filtros",
    "people.action.reactivate": "Reativar",
    "people.action.viewDetails": "Ver detalhes",
    "people.emptyState.desc": "Ajuste os filtros ou cadastre uma nova pessoa.",
    "people.error.retry": "Tente novamente em instantes.",
    "people.alert.success": "Sucesso",
    "people.alert.failure": "Falha",
    "people.toast.reactivated": "Pessoa reativada",
    "people.toast.reactivated.desc": "{name} voltou a participar da igreja.",
    "people.toast.reactivateError": "Não foi possível reativar a pessoa. Tente novamente.",
    "people.detail.loading": "Carregando pessoa",
    "people.error.load": "Não foi possível carregar a pessoa",
    "people.detail.empty": "Pessoa não encontrada",
    "people.detail.empty.desc": "A pessoa solicitada não existe ou não está disponível.",
    "people.toast.noChange": "Nenhuma alteração",
    "people.toast.noChange.desc": "Não havia dados novos para salvar.",
    "people.detail.saved.desc": "Os dados foram salvos.",
    "people.detail.error.save": "Não foi possível salvar as alterações. Verifique os dados e tente novamente.",
    "people.detail.error.invalidDate": "Informe uma data válida no formato DD/MM/AAAA.",
    "people.toast.inactivated": "Pessoa inativada",
    "people.toast.inactivated.desc": "Ela será listada somente para administradores.",
    "people.detail.error.inactivate": "Não foi possível inativar a pessoa. Tente novamente.",
    "people.detail.back": "Voltar para pessoas",
    "people.detail.label.gender": "Gênero",
    "people.detail.label.registration": "Cadastro",
    "people.detail.edit": "Editar dados",
    "people.detail.field.fullName": "Nome completo",
    "people.detail.saveChanges": "Salvar alterações",
    "people.detail.inactivatePerson": "Inativar pessoa",
    "people.detail.inactivate.title": "Inativar pessoa",
    "people.detail.inactivate.desc": "A pessoa deixará de aparecer nas listagens e não poderá ser vinculada a células enquanto estiver inativa. Você poderá reativá-la a partir da listagem.",
    "people.detail.inactivate.inactivating": "Inativando…",
    "people.detail.inactivate.action": "Inativar",
    "people.toast.created": "Pessoa cadastrada",
    "people.new.description": "Preencha os dados de contato e identificação.",
    "people.new.legend.identification": "Identificação",
    "people.new.legend.contact": "Contato",
    "people.new.legend.observations": "Observações",
    "people.new.hint.name": "Nome e sobrenome, ex.: Maria da Silva.",
    "people.new.hint.gender": "Ex.: Feminino, Masculino ou como a pessoa se identifica.",
    "people.new.hint.email": "Será normalizado para letras minúsculas.",
    "people.new.hint.phone": "Formato brasileiro, ex.: (11) 99999-9999.",
    "people.new.hint.observations": "Informações adicionais. Visível para administradores e pastores.",
    "people.new.submit": "Cadastrar pessoa",
    "people.new.submitting": "Cadastrando…",
    "people.new.error.duplicate": "Já existe uma pessoa ativa com dados semelhantes. Verifique o cadastro antes de continuar.",
    "people.new.error.generic": "Não foi possível cadastrar a pessoa. Verifique os dados e tente novamente.",
    "people.new.error.invalidDate": "Informe uma data de nascimento válida no formato DD/MM/AAAA.",
    "cells.page.subtitle": "Consulte, cadastre e acompanhe as células da sua igreja.",
    "cells.action.clearFilters": "Limpar filtros",
    "cells.error.retry": "Tente novamente em instantes.",
    "cells.emptyState.desc": "Ajuste os filtros ou cadastre uma nova célula.",
    "cells.column.code": "Código",
    "cells.column.supervisor": "Supervisor",
    "cells.column.meeting": "Reunião",
    "cells.action.viewDetails": "Ver detalhes",
    "cells.search.hint": "Nome ou código",
    "cells.detail.loading": "Carregando célula",
    "cells.error.load": "Não foi possível carregar a célula",
    "cells.detail.empty": "Célula não encontrada",
    "cells.detail.empty.desc": "A célula solicitada não existe.",
    "cells.detail.error.form": "Verifique os dados alterados.",
    "cells.detail.toast.updated": "Célula atualizada",
    "cells.detail.toast.saved.desc": "Os dados foram salvos.",
    "cells.detail.toast.activated": "Célula ativada",
    "cells.detail.toast.suspended": "Célula suspensa",
    "cells.detail.toast.activated.desc": "A célula voltou a funcionar.",
    "cells.detail.toast.suspended.desc": "A célula ficou suspensa.",
    "cells.detail.toast.leadership": "Liderança atualizada",
    "cells.detail.toast.leadership.desc": "Os novos vínculos foram salvos.",
    "cells.detail.toast.trainee": "Líder em treinamento atualizado",
    "cells.detail.toast.trainee.desc": "O vínculo foi salvo.",
    "cells.detail.error.leaderRequired": "Selecione o líder e o supervisor.",
    "cells.detail.status.suspend": "Suspender célula",
    "cells.detail.status.activate": "Ativar célula",
    "cells.detail.status.reactivate": "Reativar célula",
    "cells.detail.status.suspend.desc": "A célula ficará suspensa e continuará visível no histórico.",
    "cells.detail.status.activate.desc": "A célula voltará ao status ativo. Células ativas exigem líder.",
    "cells.detail.back": "Voltar para celulas",
    "cells.detail.viewMeetings": "Ver encontros",
    "cells.detail.label.supervisor": "Supervisor",
    "cells.detail.label.trainee": "Líder em treinamento",
    "cells.detail.label.meeting": "Reunião",
    "cells.detail.label.address": "Endereço",
    "cells.detail.label.created": "Criada em",
    "cells.detail.label.updated": "Atualizada em",
    "cells.detail.edit": "Editar dados",
    "cells.detail.field.name": "Nome",
    "cells.detail.field.meetingDay": "Dia da reunião",
    "cells.detail.field.time": "Horário",
    "cells.detail.field.address": "Endereço",
    "cells.detail.time.hint": "Formato HH:mm, ex.: 19:30.",
    "cells.detail.saveChanges": "Salvar alterações",
    "cells.detail.suspend": "Suspender célula",
    "cells.detail.changeLeader": "Alterar líder",
    "cells.detail.changeTrainee": "Alterar líder em treinamento",
    "cells.detail.removeTrainee": "Remover líder em treinamento",
    "cells.detail.assignTrainee": "Atribuir líder em treinamento",
    "cells.detail.noManage": "Você não tem permissão para gerenciar esta célula.",
    "cells.detail.dialog.confirming": "Confirmando…",
    "cells.detail.dialog.confirm": "Confirmar",
    "cells.detail.dialog.changeLeader.title": "Alterar líder",
    "cells.detail.dialog.changeLeader.desc": "O novo líder e o supervisor precisam estar ativos e na mesma igreja.",
    "cells.detail.dialog.trainee.title": "Líder em treinamento",
    "cells.detail.dialog.trainee.desc": "Selecione o usuário em treinamento ou limpe para remover.",
    "cells.detail.dialog.removeTrainee.title": "Remover líder em treinamento",
    "cells.detail.dialog.removeTrainee.desc": "O usuário deixará de ser líder em treinamento desta célula.",
    "cells.detail.dialog.removeTrainee.confirm": "Confirmar remoção",
    "cells.detail.error.codeConflict": "Já existe outra célula com este código.",
    "cells.detail.error.leaderNotEligible": "O líder selecionado não está elegível.",
    "cells.detail.error.supervisorConflict": "O supervisor selecionado já supervisiona outro líder.",
    "cells.detail.error.candidateNotFound": "O candidato selecionado não está disponível.",
    "cells.detail.error.transitionInvalid": "A transição de status não é permitida neste momento. Células ativas exigem líder.",
    "cells.detail.error.generic": "Não foi possível {action}. O servidor pode ter recusado por segurança.",
    "cells.action.saveChanges": "salvar as alterações",
    "cells.action.changeStatus": "alterar o status",
    "cells.action.changeLeadership": "alterar a liderança",
    "cells.action.changeTrainee": "alterar o líder em treinamento",
    "cells.create.error.generic": "Não foi possível criar a célula. Verifique os dados e tente novamente.",
    "cells.create.error.codeConflict": "Já existe uma célula com este código.",
    "cells.create.error.leaderNotEligible": "O líder selecionado não está elegível para liderar a célula.",
    "cells.create.error.supervisorConflict": "O supervisor selecionado já supervisiona outro líder.",
    "cells.create.error.candidateNotFound": "O líder ou supervisor selecionado não está disponível.",
    "cells.create.error.idempotency": "A tentativa anterior conflitou com outra. Tente novamente.",
    "cells.create.legend.identification": "Identificação",
    "cells.create.legend.leadership": "Liderança",
    "cells.create.legend.meeting": "Reunião e local",
    "cells.create.hint.code": "Ex.: CEL-001. Letras maiúsculas e hífens.",
    "cells.create.hint.name": "Ex.: Célula Esperança.",
    "cells.create.hint.status": "Ativa exige líder e supervisor elegíveis.",
    "cells.create.hint.leader": "Busque pelo nome do usuário.",
    "cells.create.hint.supervisor": "Busque pelo nome do usuário.",
    "cells.create.hint.trainee": "Opcional. Busque pelo nome do usuário.",
    "cells.create.hint.time": "Formato HH:mm, ex.: 19:30.",
    "cells.create.hint.address": "Local onde a célula se reúne.",
    "cells.create.submit": "Criar célula",
    "cells.create.submitting": "Criando…",
    "cells.create.alertTitle": "Não foi possível criar",
    "cells.assignment.loadError": "Não foi possível carregar as opções.",
    "cells.assignment.noCandidates": "Nenhum candidato encontrado.",
    "cells.assignment.clearLabel": "Limpar {label}",
    "cells.assignment.optionsLabel": "Opções de {label}",
    "meetings.page.subtitle": "Gerencie os encontros agendados da célula.",
    "meetings.action.clearFilters": "Limpar filtros",
    "meetings.error.retry": "Tente novamente em instantes.",
    "meetings.emptyState.desc": "Ajuste os filtros ou agende um novo encontro.",
    "meetings.column.updatedAt": "Atualizado em",
    "meetings.action.viewDetails": "Ver detalhes",
    "meetings.filter.all": "Todos",
    "meetings.field.from": "Data início",
    "meetings.field.to": "Data fim",
    "meetings.date.hint": "AAAA-MM-DD",
    "meetings.detail.loading": "Carregando encontro",
    "meetings.error.load": "Não foi possível carregar o encontro",
    "meetings.detail.empty": "Encontro não encontrado",
    "meetings.detail.empty.desc": "O encontro solicitado não existe.",
    "meetings.detail.dateError": "Data inválida.",
    "meetings.detail.toast.dateUpdated": "Data atualizada",
    "meetings.detail.toast.dateUpdated.desc": "O encontro foi reagendado.",
    "meetings.detail.toast.observations": "Observações salvas",
    "meetings.detail.toast.observations.desc": "O relatório foi atualizado.",
    "meetings.detail.toast.completed": "Encontro concluído",
    "meetings.detail.toast.completed.desc": "A frequência continua acessível pelo histórico.",
    "meetings.detail.toast.cancelled": "Encontro cancelado",
    "meetings.detail.toast.cancelled.desc": "O histórico foi preservado.",
    "meetings.detail.error.reason": "Informe o motivo do cancelamento.",
    "meetings.detail.back": "Voltar para encontros",
    "meetings.detail.label.cell": "Célula",
    "meetings.detail.label.cancelReason": "Motivo do cancelamento",
    "meetings.detail.label.created": "Criado em",
    "meetings.detail.label.updated": "Atualizado em",
    "meetings.detail.openAttendance": "Abrir frequência",
    "meetings.detail.editDate": "Editar data",
    "meetings.detail.observations": "Observações",
    "meetings.detail.observations.placeholder": "Observações sobre o encontro...",
    "meetings.detail.saveObservations": "Salvar observações",
    "meetings.detail.completeMeeting": "Concluir encontro",
    "meetings.detail.cancelMeeting": "Cancelar encontro",
    "meetings.detail.dialog.complete.title": "Concluir encontro",
    "meetings.detail.dialog.complete.desc": "O encontro será marcado como concluído e não poderá ser editado.",
    "meetings.detail.dialog.cancel.title": "Cancelar encontro",
    "meetings.detail.dialog.cancel.desc": "Informe o motivo do cancelamento. O encontro será cancelado permanentemente.",
    "meetings.detail.dialog.cancel.placeholder": "Motivo do cancelamento...",
    "meetings.detail.dialog.cancel.back": "Voltar",
    "meetings.detail.dialog.cancel.confirm": "Confirmar cancelamento",
    "meetings.detail.dialog.cancelling": "Cancelando...",
    "meetings.detail.dialog.confirming": "Confirmando...",
    "meetings.detail.error.generic": "Não foi possível {action}. Tente novamente.",
    "meetings.action.updateDate": "atualizar a data",
    "meetings.action.saveObservations": "salvar observações",
    "meetings.action.completeMeeting": "concluir o encontro",
    "meetings.action.cancelMeeting": "cancelar o encontro",
    "meetings.detail.error.notEditable": "O encontro não pode ser editado pois já foi concluído ou cancelado.",
    "meetings.detail.error.transitionInvalid": "A transição de status não é permitida neste momento.",
    "meetings.detail.error.reportNotEditable": "Não é possível editar observações de um encontro cancelado.",
    "meetings.detail.error.dateConflict": "Já existe um encontro agendado para esta data.",
    "meetings.new.legend.date": "Data do encontro",
    "meetings.new.hint.date": "Formato AAAA-MM-DD",
    "meetings.new.submit": "Criar encontro",
    "meetings.new.submitting": "Criando…",
    "meetings.new.alertTitle": "Não foi possível criar",
    "meetings.new.error.generic": "Não foi possível criar o encontro. Verifique os dados e tente novamente.",
    "meetings.new.error.dateConflict": "Já existe um encontro agendado para esta célula nesta data.",
    "meetings.new.error.cellNotFound": "A célula informada não foi encontrada.",
    "meetings.new.error.cellStatusInvalid": "A célula precisa estar ativa para agendar encontros.",
    "meetings.new.error.accessDenied": "Você não tem permissão para criar encontros nesta célula.",
    "meetings.new.error.transitionInvalid": "Transição de status não permitida para este encontro.",
    "meetings.new.error.notEditable": "Este encontro não pode mais ser editado.",
    "meetings.new.error.reportNotEditable": "Não é possível editar o relatório de um encontro cancelado.",
    "meetings.new.error.retryExhausted": "Muitas tentativas simultâneas. Aguarde um momento e tente novamente.",
    "meetings.new.error.idempotency": "A tentativa anterior conflitou com outra. Tente novamente.",
    "attendance.detail.summary": "Resumo da frequência",
    "attendance.search": "Buscar participante",
    "attendance.summary.present": "presentes",
    "attendance.summary.absent": "ausentes",
    "attendance.summary.excused": "justificados",
    "attendance.summary.unmarked": "não marcados",
    "attendance.summary.visitors": "visitantes",
    "attendance.back": "Voltar ao encontro",
    "attendance.alertTitle": "Frequência",
    "attendance.skipChanges": "Descartar alterações não salvas?",
    "attendance.skipChanges.confirm": "Descartar alterações não salvas?",
    "attendance.forbidden": "Acesso negado",
    "attendance.forbidden.desc": "Você não possui acesso à frequência deste encontro.",
    "attendance.unavailable": "Frequência indisponível no momento",
    "attendance.unavailable.desc": "Não foi possível consultar os dados deste encontro. Tente novamente em instantes.",
    "attendance.notAvailable": "Frequência ainda não disponível",
    "attendance.notAvailable.desc": "Não há dados de frequência disponíveis para este encontro.",
    "attendance.loading": "Carregando frequência",
    "attendance.conflict": "Frequência",
    "attendance.pageTitle": "Frequência",
    "attendance.saveFrequency": "Salvar frequência",
    "attendance.toast.savedTitle": "Frequência salva",
    "attendance.conflict.message": "Outra pessoa alterou a frequência. Suas marcações foram preservadas; recarregue a base para comparar antes de salvar novamente.",
    "attendance.detail.visitors": "Visitantes",
    "attendance.conflict.reload": "Recarregar base para comparar",
    "attendance.conflict.updated": "A base foi atualizada. Revise suas marcações preservadas antes de salvar.",
    "attendance.readOnlyTitle": "Somente leitura",
    "attendance.readOnlyDesc": "Este encontro foi cancelado. O histórico foi preservado.",
    "attendance.searchParticipant": "Buscar participante",
    "attendance.addVisitor": "Adicionar visitante",
    "attendance.noParticipantFound": "Nenhum participante encontrado",
    "attendance.noParticipantFound.desc": "Não encontramos participantes elegíveis com esse nome.",
    "attendance.noEligibleParticipants": "Nenhum participante elegível",
    "attendance.noEligibleParticipants.desc": "Esta célula não possui participantes elegíveis na data do encontro.",
    "attendance.personFrequency": "Frequência de {name}",
    "attendance.contactPending": "contato pendente",
    "attendance.removeVisitorConfirm": "Remover este visitante do encontro?",
    "attendance.removeVisitor": "Remover",
    "attendance.discardChanges": "Descartar alterações",
    "attendance.unsaved": "Alterações não salvas",
    "attendance.observation": "Observação",
    "attendance.toast.saved.desc": "As marcações foram registradas.",
    "attendance.error.save": "Não foi possível salvar. Suas alterações foram preservadas.",
    "attendance.error.addVisitor": "Não foi possível adicionar o visitante.",
    "attendance.visitor.observation": "Observação",
    "users.page.subtitle": "Gerencie contas, papéis e acesso dos usuários da sua igreja.",
    "users.action.clearFilters": "Limpar filtros",
    "users.error.retry": "Tente novamente em instantes.",
    "users.emptyState.desc": "Ajuste os filtros ou cadastre um novo usuário.",
    "users.action.viewDetails": "Ver detalhes",
    "users.search.hint": "Nome ou e-mail",
    "users.filter.all": "Todos",
    "users.column.roles": "Papéis",
    "users.field.role": "Papel",
    "users.detail.loading": "Carregando usuário",
    "users.error.load": "Não foi possível carregar o usuário",
    "users.detail.empty": "Usuário não encontrado",
    "users.detail.empty.desc": "O usuário solicitado não existe.",
    "users.detail.back": "Voltar para usuários",
    "users.detail.edit": "Editar dados",
    "users.detail.saveChanges": "Salvar alterações",
    "users.detail.toast.updated.desc": "Os dados foram salvos.",
    "users.detail.error.save": "Não foi possível salvar as alterações. Verifique os dados e tente novamente.",
    "users.detail.toast.activated": "Usuário ativado",
    "users.detail.toast.activated.desc": "Ele já pode entrar no painel.",
    "users.detail.toast.blocked": "Usuário bloqueado",
    "users.detail.toast.blocked.desc": "Ele não conseguirá mais entrar.",
    "users.detail.toast.roles": "Papéis atualizados",
    "users.detail.toast.roles.desc": "As permissões foram substituídas.",
    "users.detail.toast.password": "Senha redefinida",
    "users.detail.toast.password.desc": "Compartilhe a nova senha com o usuário em um canal seguro.",
    "users.detail.roles.legend": "Papéis",
    "users.detail.roles.hint": "A alteração exige confirmação e pode afetar permissões.",
    "users.detail.saveRoles": "Salvar papéis",
    "users.detail.blockUser": "Bloquear usuário",
    "users.detail.activateUser": "Ativar usuário",
    "users.detail.dialog.block.title": "Bloquear usuário",
    "users.detail.dialog.activate.title": "Ativar usuário",
    "users.detail.dialog.roles.title": "Substituir papéis",
    "users.detail.dialog.reset.title": "Redefinir senha",
    "users.detail.dialog.block.desc": "O usuário não conseguirá mais entrar enquanto estiver bloqueado.",
    "users.detail.dialog.activate.desc": "O usuário voltará a conseguir entrar.",
    "users.detail.dialog.roles.desc": "Os papéis atuais serão substituídos pelos selecionados. Confirme antes de continuar.",
    "users.detail.dialog.reset.desc": "A senha atual será substituída imediatamente.",
    "users.detail.dialog.newPassword": "Nova senha",
    "users.detail.dialog.passwordHint": "Ao menos {min} caracteres.",
    "users.detail.dialog.confirming": "Confirmando…",
    "users.detail.error.lastAdmin": "Não é possível concluir a operação porque este é o último administrador ativo da igreja.",
    "users.detail.error.emailConflict": "Já existe um usuário com este e-mail.",
    "users.detail.error.generic": "Não foi possível concluir a operação. O servidor pode ter recusado por segurança.",
    "users.modal.roles": "Papéis",
    "users.modal.noRoles": "Nenhum papel atribuído",
    "users.modal.accountInfo": "Informações da conta",
    "users.modal.createdAt": "Criado em",
    "users.modal.updatedAt": "Última atualização",
    "users.modal.photo": "Foto de perfil",
    "users.modal.photoSet": "Cadastrada",
    "users.modal.photoNotSet": "Não cadastrada",
    "users.modal.userId": "ID do usuário",
    "users.modal.openPage": "Abrir página completa",
    "users.new.legend.access": "Dados de acesso",
    "users.new.hint.password": "Compartilhe a senha inicial com o usuário por um canal seguro.",
    "users.new.error.roles": "Selecione ao menos um papel.",
    "users.new.error.password": "Use uma senha que cumpra todos os requisitos de segurança.",
    "users.new.submit": "Criar usuário",
    "users.new.submitting": "Criando…",
    "users.new.error.emailConflict": "Já existe um usuário com este e-mail.",
    "users.new.error.generic": "Não foi possível criar o usuário. Verifique os dados e tente novamente.",
    "users.new.alertTitle": "Não foi possível criar",
    "users.new.toast.created.desc": "{name} agora tem acesso ao painel.",
    "users.new.legend.roles": "Papéis",
    "users.new.noRoles": "Nenhum papel disponível",
    "users.new.noRoles.desc": "Não há papéis gerenciáveis para atribuir.",
    "users.loading.roles": "Carregando papéis",
    "users.error.loadRoles": "Não foi possível carregar os papéis",
    "users.strength.require.uppercase": "Uma letra maiúscula",
    "users.strength.require.lowercase": "Uma letra minúscula",
    "users.strength.require.number": "Um número",
    "users.strength.require.special": "Um caractere especial",
    "users.strength.require.aria": "Força da senha",
    "users.strength.emptyAria": "Nenhuma senha digitada",
    "users.strength.requirementsAria": "Requisitos da senha",
    "reports.hub.title": "Relatórios",
    "reports.hub.subtitle": "Selecione o tipo de relatório desejado.",
    "reports.hub.card.pending": "Relatórios Pendentes",
    "reports.hub.card.pending.desc": "Encontros concluídos sem relatório submetido",
    "reports.hub.card.attendance": "Frequência",
    "reports.hub.card.attendance.desc": "Resumo e detalhamento de frequência por célula",
    "reports.hub.card.visitors": "Visitantes",
    "reports.hub.card.visitors.desc": "Lista de visitantes e métricas de contato",
    "reports.hub.card.meetings": "Encontros",
    "reports.hub.card.meetings.desc": "Relatório consolidado de encontros por período",
    "reports.visitors.page.description": "Lista de visitantes e métricas de contato.",
    "reports.visitors.metric.total": "Total de visitantes",
    "reports.visitors.metric.pending": "Contato pendente",
    "reports.visitors.metric.topCell": "Célula com mais visitantes",
    "reports.visitors.filter.contact": "Contato",
    "reports.visitors.filter.all": "Todos",
    "reports.visitors.status.pending": "Pendente",
    "reports.visitors.status.done": "Realizado",
    "reports.visitors.action.clearFilters": "Limpar filtros",
    "reports.visitors.error": "Não foi possível carregar os visitantes",
    "reports.visitors.error.retry": "Tente novamente em instantes.",
    "reports.visitors.loading": "Carregando visitantes",
    "reports.visitors.emptyState": "Nenhum visitante encontrado",
    "reports.visitors.emptyState.desc": "Não há visitantes registrados no período.",
    "reports.visitors.column.contact": "Contato",
    "reports.visitors.column.name": "Nome",
    "reports.visitors.filter.period": "Período",
    "reports.visitors.pageTitle": "Visitantes",
    "reports.pending.page.description": "Encontros concluídos que ainda não tiveram o relatório submetido.",
    "reports.pending.filter.all": "Todos",
    "reports.pending.status.noReport": "Sem relatório",
    "reports.pending.status.notStarted": "Não iniciado",
    "reports.pending.status.draft": "Rascunho",
    "reports.pending.status.returned": "Devolvido",
    "reports.pending.status.submitted": "Submetido",
    "reports.pending.action.clearFilters": "Limpar filtros",
    "reports.pending.error": "Não foi possível carregar os relatórios pendentes",
    "reports.pending.error.retry": "Tente novamente em instantes.",
    "reports.pending.loading": "Carregando relatórios",
    "reports.pending.emptyState": "Nenhum relatório pendente",
    "reports.pending.emptyState.desc": "Todos os encontros concluídos já foram reportados.",
    "reports.pending.column.date": "Data do encontro",
    "reports.pending.column.days": "Dias sem relatório",
    "reports.pending.filter.period": "Período",
    "reports.pending.pageTitle": "Relatórios Pendentes",
    "reports.pending.filter.status": "Status",
    "reports.meetings.page.description": "Relatório consolidado de encontros por período.",
    "reports.meetings.filter.status": "Status",
    "reports.meetings.pageTitle": "Encontros",
    "reports.meetings.status.scheduled": "Agendado",
    "reports.meetings.status.completed": "Concluído",
    "reports.meetings.status.canceled": "Cancelado",
    "reports.meetings.action.clearFilters": "Limpar filtros",
    "reports.meetings.filter.all": "Todos",
    "reports.meetings.column.status": "Status",
    "reports.meetings.column.present": "Presentes",
    "reports.meetings.column.absent": "Ausentes",
    "reports.meetings.column.rate": "Frequência",
    "reports.meetings.column.report": "Relatório",
    "reports.meetings.error": "Não foi possível carregar os encontros",
    "reports.meetings.error.retry": "Tente novamente em instantes.",
    "reports.meetings.loading": "Carregando encontros",
    "reports.meetings.emptyState": "Nenhum encontro encontrado",
    "reports.meetings.emptyState.desc": "Não há encontros registrados no período.",
    "reports.meetings.filter.period": "Período",
    "reports.meetings.reportStatus.notStarted": "Não iniciado",
    "reports.meetings.reportStatus.draft": "Rascunho",
    "reports.meetings.reportStatus.submitted": "Submetido",
    "reports.meetings.reportStatus.returned": "Devolvido",
    "reports.meetings.reportStatus.cancelled": "Cancelado",
    "reports.attendance.page.description": "Resumo de frequência por célula no período.",
    "reports.attendance.filter.period": "Período",
    "reports.attendance.filter.health": "Saúde",
    "reports.attendance.filter.all": "Todas",
    "reports.attendance.pageTitle": "Frequência",
    "reports.attendance.band.healthy": "Saudável",
    "reports.attendance.band.attention": "Atenção",
    "reports.attendance.band.critical": "Crítico",
    "reports.attendance.action.clearFilters": "Limpar filtros",
    "reports.attendance.error": "Não foi possível carregar a frequência",
    "reports.attendance.error.retry": "Tente novamente em instantes.",
    "reports.attendance.loading": "Carregando frequência",
    "reports.attendance.emptyState": "Nenhum dado de frequência",
    "reports.attendance.emptyState.desc": "Não há encontros concluídos no período.",
    "reports.attendance.column.cell": "Célula",
    "reports.attendance.column.leader": "Líder",
    "reports.attendance.column.meetings": "Encontros",
    "reports.attendance.column.rate": "Frequência",
    "reports.attendance.column.average": "Média presentes",
    "reports.attendance.column.visitors": "Visitantes",
    "reports.attendance.column.health": "Saúde",
    "reports.attendanceDetail.page.crumb": "Detalhe por pessoa",
    "reports.attendanceDetail.filter.period": "Período",
    "reports.attendanceDetail.action.reload": "Recarregar",
    "reports.attendanceDetail.error": "Não foi possível carregar o detalhe de frequência",
    "reports.attendanceDetail.error.retry": "Tente novamente em instantes.",
    "reports.attendanceDetail.loading": "Carregando detalhe",
    "reports.attendanceDetail.emptyState": "Nenhuma pessoa encontrada",
    "reports.attendanceDetail.emptyState.desc": "Não há dados de frequência para esta célula no período.",
    "reports.attendanceDetail.column.present": "Presentes",
    "reports.attendanceDetail.column.absent": "Ausentes",
    "reports.attendanceDetail.column.excused": "Justificados",
    "reports.attendanceDetail.column.rate": "Frequência",
    "reports.attendanceDetail.pageTitle": "Detalhe de frequência",
    "reports.export.label": "Exportar {format}",
    "bulk.form.legend": "Arquivo de importação",
    "bulk.form.hint": "Formatos aceitos: XLSX, CSV e JSON. Limite de 5 MB e 2.000 linhas.",
    "bulk.form.error.empty": "Selecione um arquivo para continuar.",
    "bulk.form.error.extension": "Use um arquivo nos formatos XLSX, CSV ou JSON.",
    "bulk.form.error.size": "O arquivo deve ter no máximo 5 MB.",
    "bulk.form.choose": "Escolher arquivo",
    "bulk.form.change": "Trocar arquivo",
    "bulk.form.none": "Nenhum arquivo selecionado",
    "bulk.form.submit": "Importar arquivo",
    "bulk.form.submitting": "Importando...",
    "bulk.form.download": "Baixar modelo CSV",
    "bulk.form.back": "Voltar para a lista",
    "bulk.form.alertError": "Falha no envio",
    "bulk.form.error.generic": "Não foi possível importar o arquivo. Verifique os dados e tente novamente.",
    "bulk.form.toast.title": "Importação concluída",
    "bulk.form.toast.desc": "{created} de {processed} registros criados.",
    "bulk.result.allCreated": "Todos os registros foram criados",
    "bulk.result.pending": "Importação concluída com pendências",
    "bulk.result.summary": "{processed} processados, {created} criados e {failed} com erro.",
    "bulk.result.title": "Resultado por linha",
    "bulk.result.aria": "Resultado da importação por linha",
    "bulk.column.row": "Linha",
    "bulk.column.status": "Status",
    "bulk.column.details": "Detalhes",
    "bulk.status.created": "Criado",
    "bulk.status.error": "Erro",
    "bulk.noObservations": "Sem observações",
    "profile.photo.dialog.title": "Foto do perfil",
    "profile.photo.dialog.desc": "Sua foto aparece no perfil e no menu da conta.",
    "profile.photo.previewAlt": "Prévia da foto de perfil",
    "profile.photo.choose": "Escolher foto",
    "profile.photo.help": "A imagem será recortada ao centro e otimizada. Máximo de 8 MB.",
    "profile.photo.error.format": "Escolha uma imagem JPEG, PNG ou WebP de até 8 MB.",
    "profile.photo.save": "Salvar foto",
    "profile.photo.toast.saved": "Foto atualizada",
    "profile.photo.toast.saved.desc": "Sua nova foto já está visível no painel.",
    "profile.photo.toast.removed": "Foto removida",
    "profile.photo.toast.removed.desc": "Suas iniciais voltarão a aparecer no perfil.",
    "profile.photo.error.save": "Não foi possível salvar a foto. Tente novamente.",
    "profile.photo.error.remove": "Não foi possível remover a foto.",
    "church.page.title": "Igreja",
    "church.page.description": "Dados institucionais e ajustes. A edição está disponível somente para administradores.",
    "church.section.institutional": "Dados institucionais",
    "church.field.name": "Nome",
    "church.field.slug": "Identificador (slug)",
    "church.hint.slug": "Letras minúsculas, números e hífens.",
    "church.hint.phone": "Formato brasileiro, ex.: (11) 99999-9999.",
    "church.hint.timezone": "Padrão IANA, ex.: America/Sao_Paulo.",
    "church.field.weekStart": "Dia de início da semana",
    "church.saveData": "Salvar dados",
    "church.saveSettings": "Salvar configurações",
    "church.toast.savedData.desc": "As informações da igreja foram salvas.",
    "church.toast.savedSettings.desc": "As preferências da igreja foram salvas.",
    "church.toast.noChange": "Nenhuma alteração",
    "church.toast.noChange.desc": "Não havia dados novos para salvar.",
    "church.toast.noChangeSettings.desc": "Não havia configurações novas para salvar.",
    "church.error.save": "Não foi possível salvar. Verifique slug, contato e endereço.",
    "church.error.saveSettings": "Não foi possível salvar as configurações. Verifique o fuso horário.",
    "church.error.load": "Não foi possível carregar os dados da igreja",
    "church.empty.title": "Igreja indisponível",
    "church.empty.desc": "Os dados da igreja não puderam ser carregados.",
    "church.loading.church": "Carregando igreja",
    "church.address.cep.hint": "Ao sair do campo, o endereço será preenchido pelo ViaCEP.",
    "church.address.cep.digits": "Informe um CEP com 8 dígitos.",
    "church.address.lookupSuccess": "Endereço preenchido pelo CEP.",
    "church.address.lookupNotFound": "CEP não encontrado. Confira o número ou preencha o endereço manualmente.",
    "church.address.lookupError": "Não foi possível consultar o CEP. Preencha o endereço manualmente.",
    "church.address.lookupLoading": "Consultando CEP…",
    "church.address.field.country": "País",
    "church.label.stateUf": "Estado (UF)",
    "church.field.email": "E-mail",
    "church.section.settings": "Configurações",
    "church.field.timezone": "Fuso horário",
    "church.toast.savedData": "Dados atualizados",
    "church.toast.savedSettings": "Configurações atualizadas",
    "church.error.retry": "Tente novamente em instantes.",
    "people.page.title": "Pessoas",
    "people.page.subtitle": "Mantenha o cadastro de pessoas da igreja.",
    "people.new": "Nova pessoa",
    "people.error.list": "Não foi possível carregar as pessoas",
    "people.emptyState.title": "Nenhuma pessoa encontrada",
    "people.detail.toast.updated": "Pessoa atualizada",
    "people.detail.field.observations": "Observações",
    "cells.page.title": "Células",
    "cells.new": "Nova célula",
    "cells.error.list": "Não foi possível carregar as células",
    "cells.emptyState.title": "Nenhuma célula encontrada",
    "cells.column.name": "Nome",
    "cells.detail.meetingAt": "{day} às {time}",
    "cells.detail.error.tryAgain": "Não foi possível {action}. Tente novamente.",
    "common.success": "Sucesso",
    "common.failure": "Falha",
    "cells.create.back": "Voltar para células",
    "cells.create.toast.created": "Célula criada",
    "meetings.page.title": "Encontros",
    "meetings.new": "Novo encontro",
    "meetings.error.list": "Não foi possível carregar os encontros",
    "meetings.emptyState.title": "Nenhum encontro encontrado",
    "common.confirm": "Confirmar",
    "meetings.detail.error.tryAgain": "Não foi possível {action}. Tente novamente.",
    "meetings.new.toast.created": "Encontro criado"
  },
  en: {
    "app.title": "Cell Ecosystem",
    "app.meta.description": "Cell groups and small-group management ecosystem.",
    "app.tagline": "Management that brings people together.",
    "app.tagline.sub": "A clear view to care for every cell.",
    "app.tagline.description": "Organize people, meetings and leadership in one place.",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.saving": "Saving…",
    "common.back": "Back",
    "common.edit": "Edit",
    "common.close": "Close",
    "common.search": "Search",
    "common.actions": "Actions",
    "common.loading": "Loading",
    "common.retry": "Try again",
    "common.prev": "Previous",
    "common.next": "Next",
    "common.all": "All",
    "common.select": "Select",
    "common.add": "Add",
    "common.create": "Create",
    "common.details": "Details",
    "common.status": "Status",
    "common.optional": "optional",
    "common.upload": "Upload photo",
    "common.remove": "Remove",
    "common.error": "Error",
    "common.loadingContent": "Loading content",
    "label.firstName": "First name",
    "label.lastName": "Last name",
    "label.name": "Name",
    "label.email": "Email",
    "label.phone": "Phone",
    "label.address": "Address",
    "label.status": "Status",
    "label.password": "Password",
    "nav.dashboard": "Dashboard",
    "nav.profile": "My profile",
    "nav.settings": "Settings",
    "nav.people": "People",
    "nav.cells": "Cells",
    "nav.reports": "Reports",
    "nav.users": "Users",
    "nav.workspace": "Workspace",
    "nav.openMenu": "Open menu",
    "nav.closeMenu": "Close menu",
    "nav.main": "Main navigation",
    "nav.help": "Need help?",
    "nav.helpAction": "Chat on WhatsApp",
    "nav.helpAria": "Need help? Chat on WhatsApp (opens in a new tab)",
    "breadcrumb.dashboard": "Dashboard",
    "breadcrumb.profile": "My profile",
    "breadcrumb.users": "Users",
    "breadcrumb.usersImport": "Import users",
    "breadcrumb.usersNew": "New user",
    "breadcrumb.usersDetail": "User details",
    "breadcrumb.church": "Church",
    "breadcrumb.churchSettings": "Settings",
    "breadcrumb.people": "People",
    "breadcrumb.peopleImport": "Import people",
    "breadcrumb.peopleNew": "New person",
    "breadcrumb.peopleDetail": "Person details",
    "breadcrumb.cells": "Cells",
    "breadcrumb.cellsImport": "Import cells",
    "breadcrumb.cellsNew": "New cell",
    "breadcrumb.cellsMeetingNew": "New meeting",
    "breadcrumb.cellsMeetingDetail": "Meeting details",
    "breadcrumb.cellsMeetings": "Meetings",
    "breadcrumb.cellsDetail": "Cell details",
    "breadcrumb.meetings": "Meetings",
    "breadcrumb.aria": "Breadcrumb",
    "breadcrumb.backToMeetings": "Meetings",
    "shell.section": "Cell management",
    "shell.skip": "Skip to main content",
    "shell.loadingSession": "Loading session",
    "theme.toggleDark": "Enable dark theme",
    "theme.toggleLight": "Enable light theme",
    "userMenu.fallback": "User",
    "userMenu.photoHint": "Click the photo to change it",
    "userMenu.profile": "My profile",
    "userMenu.profileDesc": "Personal details and photo",
    "userMenu.settings": "Settings",
    "userMenu.settingsDesc": "Preferences and appearance",
    "userMenu.signout": "Sign out",
    "userMenu.signingOut": "Signing out…",
    "userMenu.signoutTitle": "End this session",
    "userMenu.open": "Open account menu",
    "userMenu.dialog": "User account",
    "userMenu.close": "Close account menu",
    "states.retry": "Try again",
    "pagination.aria": "Pagination",
    "pagination.prev": "Previous",
    "pagination.next": "Next",
    "pagination.info": "Page {page} of {totalPages} · {from}–{to} of {totalItems}",
    "statusBadge.active": "Active",
    "statusBadge.inactive": "Inactive",
    "statusBadge.blocked": "Blocked",
    "toast.ariaNotifications": "Notifications",
    "toast.closeNotification": "Close notification",
    "field.showPassword": "Show password",
    "field.hidePassword": "Hide password",
    "api.generic": "Could not complete the operation. Please try again.",
    "api.timeout": "The request took too long. Please try again.",
    "api.network": "Connection to the server failed.",
    "api.unauthorized": "Your session expired. Please sign in again.",
    "api.forbidden": "You do not have permission to perform this action.",
    "api.notFound": "The requested resource was not found.",
    "api.conflict": "Conflict with the current data.",
    "api.rateLimited": "Too many attempts. Please wait a moment.",
    "role.admin": "Admin",
    "role.pastor": "Pastor",
    "role.supervisor": "Supervisor",
    "role.leader": "Leader",
    "bootstrap.loading": "Cell Ecosystem",
    "bootstrap.verifying": "Checking your session…",
    "bootstrap.aria": "Loading session",
    "login.title": "Sign in to your account",
    "login.subtitle": "Use your credentials to sign in to the Cell Ecosystem.",
    "login.alertTitle": "Sign in failed",
    "login.emailLabel": "Email",
    "login.passwordLabel": "Password",
    "login.invalidEmail": "Enter a valid email.",
    "login.requiredPassword": "Enter your password.",
    "login.invalidCredentials": "Invalid email or password.",
    "login.rateLimited": "Too many attempts. Please wait a moment and try again.",
    "login.submit": "Sign in",
    "login.submitting": "Signing in…",
    "login.genericError": "Could not sign in. Please try again.",
    "login.toastTitle": "Sign in failed",
    "login.presentationAria": "Cell Ecosystem presentation",
    "login.brandAlt": "Missão Atos — Church in Cells",
    "accessDenied.title": "Access denied",
    "accessDenied.description": "Your account does not have permission to access this resource. If you need access, contact an administrator.",
    "accessDenied.back": "Back to dashboard",
    "errorPage.title": "Something went wrong",
    "errorPage.description": "Could not complete the operation. Try again in a moment.",
    "errorPage.retry": "Try again",
    "notFound.title": "Page not found",
    "notFound.description": "The requested page does not exist or has been moved.",
    "notFound.home": "Go to home",
    "dash.title": "Dashboard",
    "dash.overview": "Overview",
    "dash.description": "Organize people, track cells and keep leadership connected.",
    "dash.access": "Access: {role}",
    "dash.quickAccess": "Quick access",
    "dash.quickAccess.hint": "What do you want to do?",
    "dash.quickAccess.choose": "Choose an area to continue.",
    "dash.shortcut.profile": "Update your details and change your password.",
    "dash.shortcut.settings": "Personal preferences and church settings.",
    "dash.shortcut.people": "View and manage the church's people.",
    "dash.shortcut.cells": "View and manage the church's cells.",
    "dash.shortcut.users": "Manage accounts, roles and access.",
    "dash.loading": "Loading dashboard",
    "settings.page.title": "Settings",
    "settings.page.description": "Personal preferences and church operational settings.",
    "settings.section.regional": "Regional",
    "settings.section.operacional": "Operational",
    "settings.section.preferencias": "Preferences",
    "settings.section.accessibility": "Accessibility",
    "settings.field.timezone": "Timezone",
    "settings.field.timezone.hint": "IANA, e.g. America/Sao_Paulo.",
    "settings.field.weekStartsOn": "Week starts on",
    "settings.field.deadlineHours": "Report deadline (hours)",
    "settings.field.deadlineHours.hint": "Hours after the end of the meeting day for report submission (1–720).",
    "settings.field.language": "Language",
    "settings.field.displayTimezone": "Display timezone",
    "settings.field.displayTimezone.null": "Inherit from church",
    "settings.field.displayTimezone.hint": "Leave empty to inherit the church timezone.",
    "settings.field.dateFormat": "Date format",
    "settings.field.theme": "Theme",
    "settings.field.accessibilityContrast": "Contrast",
    "settings.field.accessibilityTextScale": "Text size",
    "settings.field.accessibilityMotion": "Motion",
    "settings.field.accessibilityFocus": "Focus indicator",
    "settings.accessibility.system": "Use system preference",
    "settings.accessibility.standard": "Standard",
    "settings.accessibility.high": "High contrast",
    "settings.accessibility.large": "Large",
    "settings.accessibility.extraLarge": "Extra large",
    "settings.accessibility.reduce": "Reduce motion",
    "settings.accessibility.enhanced": "Enhanced",
    "settings.accessibility.shortcut.contrast": "Contrast: {value}",
    "settings.accessibility.shortcut.scale": "Text size: {value}",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "settings.theme.system": "System",
    "settings.locale.pt-BR": "Portuguese (Brazil)",
    "settings.locale.en": "English",
    "settings.locale.es": "Spanish",
    "settings.btn.save": "Save",
    "settings.btn.saving": "Saving…",
    "settings.toast.saved": "Settings saved",
    "settings.toast.saved.desc": "Your changes have been applied successfully.",
    "settings.toast.noop": "No changes",
    "settings.toast.noop.desc": "There were no new changes to save.",
    "settings.toast.error": "Could not save. Please check the values and try again.",
    "settings.loading": "Loading settings",
    "settings.load.error": "Could not load settings",
    "settings.load.retry": "Try again in a moment.",
    "settings.unavailable": "Settings unavailable",
    "settings.unavailable.desc": "The settings could not be loaded.",
    "church.title": "Church settings",
    "church.section.info": "Church information",
    "church.section.address": "Address",
    "church.section.regional": "Regional",
    "church.section.operacional": "Operational",
    "church.label.name": "Church name",
    "church.label.phone": "Phone",
    "church.label.cnpj": "CNPJ",
    "church.label.cep": "ZIP code",
    "church.label.street": "Street",
    "church.label.number": "Number",
    "church.label.neighborhood": "Neighborhood",
    "church.label.city": "City",
    "church.label.state": "State",
    "church.label.complement": "Complement",
    "church.cep.placeholder": "E.g. 15000-000",
    "church.cep.invalid": "Enter a valid ZIP code.",
    "church.save": "Save",
    "church.saving": "Saving…",
    "church.toast.saved": "Church settings saved",
    "church.toast.error": "Could not save. Please check the values and try again.",
    "church.loading": "Loading settings",
    "profile.title": "My profile",
    "profile.subtitle": "Keep your personal details up to date. Email and access are managed by an administrator.",
    "profile.photoHint": "Click the photo to change it.",
    "profile.section.personal": "Personal details",
    "profile.section.password": "Change password",
    "profile.passwordHint": "After confirming, your session will be ended and you will need to sign in again.",
    "profile.field.currentPassword": "Current password",
    "profile.field.newPassword": "New password",
    "profile.field.confirmPassword": "Confirm new password",
    "profile.passwordMin": "The new password must have at least {min} characters.",
    "profile.passwordMinHint": "At least {min} characters.",
    "profile.passwordMismatch": "Passwords do not match.",
    "profile.save": "Save changes",
    "profile.saving": "Saving…",
    "profile.requestChange": "Request password change",
    "profile.confirm.title": "Confirm password change",
    "profile.confirm.description": "Your password will be changed and all your sessions will be ended. You will need to sign in again.",
    "profile.confirm.action": "Confirm change",
    "profile.confirm.cancel": "Cancel",
    "profile.confirm.changing": "Changing…",
    "profile.toast.saved": "Profile updated",
    "profile.toast.saved.desc": "Your details were saved.",
    "profile.toast.error": "Could not save your changes. Try again.",
    "profile.toast.passwordError": "Could not change the password. Check the current password and try again.",
    "profile.load.error": "Could not load your profile",
    "profile.load.retry": "Try again in a moment.",
    "profile.unavailable": "Profile unavailable",
    "profile.unavailable.desc": "Your details could not be loaded.",
    "profile.photo.upload": "Upload photo",
    "profile.photo.remove": "Remove photo",
    "profile.photo.aria": "Change photo",
    "profile.loading": "Loading profile",
    "profile.photo.aria.menu": "Open account menu",
    "profile.photo.aria.change": "Change profile photo",
    "profile.photo.removeShort": "Remove",
    "profile.photo.toast.removeError": "Could not remove the photo.",
    "people.title": "People",
    "people.subtitle": "View and manage the church's people.",
    "people.add": "Add person",
    "people.import": "Import people",
    "people.search": "Search by name",
    "people.empty": "No people found",
    "people.emptyState": "No people registered yet.",
    "people.error": "Could not load the people",
    "people.loading": "Loading people",
    "people.column.name": "Name",
    "people.column.email": "Email",
    "people.column.cell": "Cell",
    "people.column.status": "Status",
    "people.column.actions": "Actions",
    "people.import.title": "Import people",
    "people.import.subtitle": "Register several people and optionally link them to cells by code.",
    "people.detail.title": "Person details",
    "people.detail.section.info": "Personal details",
    "people.detail.section.contact": "Contact",
    "people.detail.section.address": "Address",
    "people.detail.section.links": "Links",
    "people.detail.withoutCell": "No cell",
    "people.detail.field.birthDate": "Birth date",
    "people.detail.field.notes": "Notes",
    "people.toast.updated": "Person updated",
    "people.toast.error": "Could not save",
    "people.new.title": "New person",
    "people.new.subtitle": "Register a person to track cell participation.",
    "people.field.error.required": "Enter the name.",
    "people.field.error.email": "Enter a valid email.",
    "cells.title": "Cells",
    "cells.subtitle": "View and manage the church's cells and their meetings.",
    "cells.add": "New cell",
    "cells.import": "Import cells",
    "cells.search": "Search cells",
    "cells.filter.status": "Status",
    "cells.filter.all": "All",
    "cells.filter.allStatuses": "All",
    "cells.filter.leader": "Leader",
    "cells.filter.supervisor": "Supervisor",
    "cells.filter.meetingDay": "Meeting day",
    "cells.filter.minMembers": "Min members",
    "cells.filter.maxMembers": "Max members",
    "cells.filter.allLeaders": "All leaders",
    "cells.filter.allSupervisors": "All supervisors",
    "cells.filter.allDays": "All days",
    "cells.filter.filtersAria": "Additional filters",
    "cells.empty": "No cells found",
    "cells.emptyState": "You don't have cells registered yet.",
    "cells.error": "Could not load the cells",
    "cells.loading": "Loading cells",
    "cells.column.cell": "Cell",
    "cells.column.day": "Day",
    "cells.column.time": "Time",
    "cells.column.leader": "Leader",
    "cells.column.members": "Members",
    "cells.column.status": "Status",
    "cells.column.actions": "Actions",
    "cells.import.title": "Import cells",
    "cells.import.subtitle": "Register formative or active cells using prepared data.",
    "cells.new.title": "New cell",
    "cells.new.subtitle": "Create a cell and set the leader, day and meeting time.",
    "cells.new.field.name": "Cell name",
    "cells.new.field.day": "Week day",
    "cells.new.field.time": "Time",
    "cells.new.field.address": "Address",
    "cells.new.field.status": "Status",
    "cells.toast.created": "Cell created",
    "cells.toast.error": "Could not create the cell",
    "cells.detail.title": "Cell details",
    "cells.detail.newMeeting": "New meeting",
    "cells.detail.print": "Print report",
    "cells.detail.section.info": "Information",
    "cells.detail.section.actions": "Actions",
    "cells.detail.section.leader": "Leader",
    "cells.detail.section.members": "Members",
    "cells.detail.section.recentMeetings": "Recent meetings",
    "cells.members.loading": "Loading members",
    "cells.members.empty": "No members found",
    "cells.members.empty.desc": "Add a person to this cell to track participation.",
    "cells.members.add": "Add member",
    "cells.members.add.title": "Add member",
    "cells.members.add.desc": "The person joins this cell. If active in another cell, they will be transferred automatically.",
    "cells.members.search": "Search person",
    "cells.members.search.hint": "Type a name, phone, or email.",
    "cells.members.reason": "Reason",
    "cells.members.reason.hint": "Required for leaders and pastors on transfer and removal.",
    "cells.members.reason.required": "Enter a reason.",
    "cells.members.error.reasonRequired": "Leaders and pastors must provide a reason for transfer or removal.",
    "cells.members.noCandidates": "No person is available to add.",
    "cells.members.searchFailed": "Could not search people.",
    "cells.members.transferHint": "Is in {cell} — will be transferred",
    "cells.members.column.joined": "Joined on",
    "cells.members.remove": "Remove",
    "cells.members.remove.title": "Remove member",
    "cells.members.remove.desc": "The link of {name} with this cell will be closed, without deleting the person.",
    "cells.members.toast.added": "Member added",
    "cells.members.toast.added.desc": "{name} is now part of this cell.",
    "cells.members.toast.removed": "Member removed",
    "cells.members.toast.removed.desc": "The link of {name} with this cell was closed.",
    "cells.members.error.load": "Could not load the members.",
    "cells.members.error.alreadyMember": "The person is already an active member of this cell.",
    "cells.members.error.generic": "Could not complete the action {action}.",
    "cells.members.status.all": "All",
    "cells.members.status.active": "Active",
    "cells.members.status.inactive": "Inactive",
    "cells.members.status.transferred": "Transferred",
    "cells.members.rowActions": "Actions for {name}",
    "cells.detail.field.code": "Code",
    "cells.status.formative": "Formative",
    "cells.status.active": "Active",
    "cells.status.suspended": "Suspended",
    "cells.status.closed": "Closed",
    "cells.day.monday": "Monday",
    "cells.day.tuesday": "Tuesday",
    "cells.day.wednesday": "Wednesday",
    "cells.day.thursday": "Thursday",
    "cells.day.friday": "Friday",
    "cells.day.saturday": "Saturday",
    "cells.day.sunday": "Sunday",
    "cells.leader.label": "Leader",
    "cells.leader.none": "No person available",
    "meetings.title": "Meetings",
    "meetings.subtitle": "Track and register cell meetings.",
    "meetings.add": "New meeting",
    "meetings.empty": "No meetings registered yet.",
    "meetings.emptyState": "Register the first meeting of a cell.",
    "meetings.error": "Could not load the meetings",
    "meetings.loading": "Loading meetings",
    "meetings.column.date": "Date",
    "meetings.column.theme": "Theme",
    "meetings.column.participants": "Participants",
    "meetings.column.status": "Status",
    "meetings.column.actions": "Actions",
    "meetings.new.title": "New meeting",
    "meetings.new.subtitle": "Register a meeting for the cell.",
    "meetings.new.field.date": "Date",
    "meetings.new.field.time": "Time",
    "meetings.new.field.theme": "Theme",
    "meetings.new.field.notes": "Notes",
    "meetings.toast.created": "Meeting created",
    "meetings.toast.error": "Could not create the meeting",
    "meetings.detail.title": "Meeting details",
    "meetings.detail.titleWithDate": "Meeting - {date}",
    "meetings.detail.saveDate": "Save date",
    "meetings.detail.saving": "Saving...",
    "meetings.detail.error.security": "Could not {action}. The server may have refused for security reasons.",
    "meetings.detail.attendance": "Take attendance",
    "meetings.detail.section.info": "Information",
    "meetings.detail.section.participants": "Participants",
    "meetings.detail.section.report": "Report",
    "meetings.detail.field.present": "Present",
    "meetings.detail.field.visitors": "Visitors",
    "meetings.status.scheduled": "Scheduled",
    "meetings.status.completed": "Completed",
    "meetings.status.cancelled": "Cancelled",
    "attendance.title": "Take attendance",
    "attendance.present": "Present",
    "attendance.absent": "Absent",
    "attendance.excused": "Excused",
    "attendance.unmarked": "Clear",
    "attendance.save": "Save attendance",
    "attendance.saving": "Saving…",
    "attendance.visitor.dialogTitle": "Add visitor",
    "attendance.visitor.dialogDescription": "Use an existing person or quickly register one.",
    "attendance.visitor.source": "Source",
    "attendance.visitor.sourceQuick": "Quick register",
    "attendance.visitor.sourceExisting": "Existing person",
    "attendance.visitor.person": "Person",
    "attendance.visitor.name": "Name",
    "attendance.visitor.phoneOptional": "Phone (optional)",
    "attendance.visitor.invitedBy": "Invited by",
    "attendance.visitor.notInformed": "Not informed",
    "attendance.visitor.add": "Add",
    "attendance.toast.saved": "Attendance saved",
    "attendance.toast.error": "Could not save the attendance",
    "analytics.title": "Indicators",
    "analytics.legend": "Overview of the next 4 weeks",
    "analytics.cellActive": "Active cells",
    "analytics.members": "Members",
    "analytics.meetingsMonth": "Meetings this month",
    "analytics.avgAttendance": "Average attendance",
    "analytics.updated": "Updated {date}",
    "analytics.loading": "Loading indicators",
    "analytics.forbidden": "Your account does not have permission to view the indicators.",
    "analytics.unavailable": "Indicators unavailable right now",
    "analytics.unavailable.desc": "Could not load the dashboard indicators. Try again in a moment.",
    "analytics.subtitle": "Church health — last 30 days",
    "analytics.empty": "No indicators yet",
    "analytics.empty.desc": "There is not enough data to show indicators.",
    "analytics.people": "People",
    "analytics.forming": "forming",
    "analytics.attendanceRate": "Attendance rate",
    "analytics.noData": "no data",
    "analytics.averagePresent": "Average attendance",
    "analytics.completionRate": "Completion",
    "analytics.meetingsShort": "meetings",
    "analytics.visitors": "Visitors",
    "analytics.vsPrevious": "vs. previous",
    "analytics.evolution": "Monthly evolution",
    "analytics.evolution.empty": "No monthly series",
    "analytics.evolution.empty.desc": "There are no meetings in the period yet.",
    "analytics.meetingsChartAria": "Meetings per month chart",
    "analytics.presentMembersShort": "present",
    "analytics.visitorsShort": "visitors",
    "analytics.attendanceChartAria": "Present members and visitors per month chart",
    "analytics.cellAlerts": "Cell attention",
    "analytics.emptyCells": "No cells",
    "analytics.emptyCells.desc": "No cells found to generate alerts.",
    "analytics.withoutRecentMeeting": "{count} cell(s) without a meeting for {days} days",
    "analytics.clickToSeeCells": "Click to see the cells.",
    "analytics.allRecent": "All active cells held recent meetings.",
    "analytics.last": "last",
    "analytics.noCompleteMeeting": "no completed meeting",
    "analytics.statusUnknown": "Unknown status",
    "users.title": "Users",
    "users.subtitle": "Manage accounts, roles and access.",
    "users.add": "New user",
    "users.import": "Import users",
    "users.search": "Search users",
    "users.empty": "No users found",
    "users.emptyState": "No users registered yet.",
    "users.error": "Could not load the users",
    "users.loading": "Loading users",
    "users.column.user": "User",
    "users.column.email": "Email",
    "users.column.role": "Role",
    "users.column.status": "Status",
    "users.column.actions": "Actions",
    "users.import.title": "Import users",
    "users.import.subtitle": "Create accounts in bulk with an initial password and role names.",
    "users.new.title": "New user",
    "users.new.field.password": "Initial password",
    "users.new.field.confirmPassword": "Confirm password",
    "users.new.passwordMin": "The password must have at least 12 characters.",
    "users.new.create": "Create user",
    "users.detail.title": "User details",
    "users.detail.field.phone": "Phone",
    "users.detail.field.createdAt": "Created at",
    "users.detail.activate": "Activate",
    "users.detail.deactivate": "Deactivate",
    "users.detail.resetPassword": "Reset password",
    "users.toast.created": "User created",
    "users.toast.updated": "User updated",
    "users.toast.error": "Could not save",
    "users.strength.label": "Password strength",
    "users.strength.weak": "Weak",
    "users.strength.fair": "Fair",
    "users.strength.strong": "Strong",
    "users.strength.veryWeak": "Very weak",
    "users.strength.good": "Good",
    "users.strength.empty": "Type a password",
    "users.strength.require.length": "At least 12 characters",
    "users.strength.require.alphanum": "Letters and numbers",
    "reports.title": "Reports",
    "reports.subtitle": "Track metrics and pending items of the cell ministry.",
    "reports.loading": "Loading reports",
    "reports.card.visitors": "Visitors",
    "reports.card.meetings": "Meetings",
    "reports.card.attendance": "Attendance",
    "reports.card.pending": "Pending",
    "reports.visitors.title": "Visitor report",
    "reports.visitors.empty": "No visitors in the period",
    "reports.visitors.column.visitor": "Visitor",
    "reports.visitors.column.cell": "Cell",
    "reports.visitors.column.meeting": "Meeting",
    "reports.visitors.column.date": "Date",
    "reports.visitors.column.status": "Status",
    "reports.visitors.column.invitedBy": "Invited by",
    "reports.pending.title": "Pending reports",
    "reports.pending.column.cell": "Cell",
    "reports.pending.column.leader": "Leader",
    "reports.pending.column.meeting": "Meeting",
    "reports.pending.column.deadline": "Deadline",
    "reports.pending.column.status": "Status",
    "reports.pending.status.pending": "Pending",
    "reports.pending.status.onTime": "On time",
    "reports.pending.status.late": "Late",
    "reports.pending.link": "Register now",
    "reports.pending.empty": "No pending items",
    "reports.meetings.title": "Meetings report",
    "reports.meetings.column.date": "Date",
    "reports.meetings.column.cell": "Cell",
    "reports.meetings.column.theme": "Theme",
    "reports.meetings.column.participants": "Participants",
    "reports.meetings.column.visitors": "Visitors",
    "reports.attendance.title": "Attendance report",
    "reports.attendance.column.person": "Person",
    "reports.attendance.column.present": "Present",
    "reports.attendance.column.absent": "Absent",
    "reports.attendance.column.excused": "Excused",
    "reports.attendance.column.percentage": "Percentage",
    "reports.attendance.details": "Details",
    "reports.attendanceDetail.title": "Attendance details",
    "reports.attendanceDetail.column.person": "Person",
    "reports.attendanceDetail.column.status": "Status",
    "reports.attendanceDetail.column.marked": "Marked",
    "reports.attendanceDetail.empty": "No records on this date",
    "reports.export.csv": "Export CSV",
    "reports.export.exporting": "Exporting…",
    "reports.export.aria": "Export report",
    "reports.export.language": "Report language",
    "reports.period.default": "Default (30 days)",
    "reports.period.last30": "Last 30 days",
    "reports.period.last60": "Last 60 days",
    "reports.period.thisMonth": "This month",
    "bulk.label.file": "CSV file",
    "bulk.label.fileField": "File",
    "bulk.label.downloadModel": "Download template",
    "bulk.label.structure": "File structure",
    "bulk.label.send": "Upload file",
    "bulk.label.sending": "Uploading…",
    "bulk.label.submit": "Import",
    "bulk.success": "Import completed successfully.",
    "bulk.imported": "{count} records imported",
    "bulk.errorRows": "Error in {count} rows",
    "bulk.downloadErrors": "Download errors",
    "bulk.guide.title": "How to import",
    "bulk.guide.step1": "1. Download the template",
    "bulk.guide.step2": "2. Fill in the data",
    "bulk.guide.step3": "3. Upload the file",
    "bulk.guide.note.cellCode": "Cell code",
    "bulk.guide.note.roles": "Allowed roles",
    "bulk.guide.note.initialPassword": "Initial password",
    "bulk.guide.eyebrow": "Import guide",
    "bulk.guide.heading": "How to prepare the file",
    "bulk.guide.intro": "The import accepts one file at a time, up to 5 MB and 2,000 rows. Valid records enter the church of your session; each invalid row appears in the result without blocking the others.",
    "bulk.guide.stepDownload": "Download the CSV template in the form below and keep the column names exactly the same.",
    "bulk.guide.stepFill": "Fill in one row for each record. Leave optional fields empty when there is no information.",
    "bulk.guide.stepSend": "Upload the file and check the Result per row table. Fix only the rows with errors and send only those rows again.",
    "bulk.guide.namesAlertTitle": "Exact names, no extra columns",
    "bulk.guide.namesAlertDesc": "Excel, CSV and JSON use exactly the names in this table. Any unknown column or field invalidates the row.",
    "bulk.guide.columnsTitle": "Accepted columns",
    "bulk.guide.columnsTableLabel": "Accepted columns for importing {records}",
    "bulk.guide.column.name": "Column",
    "bulk.guide.column.requirement": "Requirement",
    "bulk.guide.column.guidance": "How to fill in",
    "bulk.guide.daysTitle": "Weekday codes",
    "bulk.guide.formatsTitle": "File format",
    "bulk.guide.format.excel.label": "Excel",
    "bulk.guide.format.excel.body": "use the first sheet. The first row must contain the exact column names. Each following row is a record. Ignore blank rows and do not include titles, totals or merged cells. Enter times as text and dates as YYYY-MM-DD.",
    "bulk.guide.format.csv.label": "CSV",
    "bulk.guide.format.csv.body": "the first row must contain the exact column names. Separate values with commas and save in UTF-8. Put any value with a comma or line break in quotes. Leave optional fields empty.",
    "bulk.guide.format.json.label": "JSON",
    "bulk.guide.format.json.intro": "send a list of objects or an object with the ",
    "bulk.guide.format.json.keys": " key. Use exactly the column names as keys and omit optional fields instead of using ",
    "bulk.guide.format.json.count": ". The count starts at the first data row; the header does not count.",
    "bulk.guide.jsonExample": "JSON example for importing {records}",
    "bulk.guide.afterTitle": "After submitting",
    "bulk.guide.afterDesc": "{rule} Only new records are created; send only the corrected rows again to avoid duplicating records.",
    "bulk.guide.records.people": "people",
    "bulk.guide.records.cells": "cells",
    "bulk.guide.records.users": "users",
    "bulk.guide.permission.adminPastor": "Available to administrators and pastors.",
    "bulk.guide.permission.adminOnly": "Available to administrators only.",
    "bulk.guide.duplicate.people": "Repeated phone, email or name with birth date generate an error in the corresponding row.",
    "bulk.guide.duplicate.cells": "Code repeated in the file or already existing in the church generates an error in the corresponding row.",
    "bulk.guide.duplicate.users": "Repeated email generates an error in the corresponding row.",
    "bulk.guide.rolesNote": "In the spreadsheet or CSV, separate roles with |, e.g. ADMIN|PASTOR. If you use a comma inside the CSV, wrap the value in quotes. In JSON, use a list, e.g. [\"LEADER\"].",
    "bulk.guide.req.requiredF": "Required",
    "bulk.guide.req.requiredM": "Required",
    "bulk.guide.req.optional": "Optional",
    "bulk.guide.req.conditional": "Conditional",
    "bulk.guide.day.monday": "Monday",
    "bulk.guide.day.tuesday": "Tuesday",
    "bulk.guide.day.wednesday": "Wednesday",
    "bulk.guide.day.thursday": "Thursday",
    "bulk.guide.day.friday": "Friday",
    "bulk.guide.day.saturday": "Saturday",
    "bulk.guide.day.sunday": "Sunday",
    "bulk.guide.col.people.fullName": "Full name, up to 200 characters. Extra spaces are adjusted.",
    "bulk.guide.col.people.phone": "International phone starting with +, e.g. +5511999999999. Leave empty to omit.",
    "bulk.guide.col.people.email": "Valid email. The system converts it to lowercase.",
    "bulk.guide.col.people.birthDate": "Date in YYYY-MM-DD format, e.g. 1990-05-20. Do not use a future date.",
    "bulk.guide.col.people.gender": "Free text up to 50 characters, e.g. Female.",
    "bulk.guide.col.people.observations": "Text from 1 to 10,000 characters when filled. Leave empty to omit.",
    "bulk.guide.col.people.cellCode": "Code of an existing cell in the same church, e.g. CEL-001. Creates the active link; an unknown code fails the row.",
    "bulk.guide.col.cells.code": "Code up to 50 characters. Accents and spaces become hyphens and everything is uppercased, e.g. CEL-001.",
    "bulk.guide.col.cells.name": "Cell name, up to 160 characters.",
    "bulk.guide.col.cells.status": "Use FORMING, ACTIVE or SUSPENDED. Without a value, the cell starts as forming. ACTIVE requires a leader and a supervisor.",
    "bulk.guide.col.cells.leaderId": "Internal ID of the leader user, not the name or email. Required for ACTIVE. Without the ID, import as FORMING and assign later.",
    "bulk.guide.col.cells.supervisorId": "Internal ID of the supervisor user. Required for ACTIVE and omitted for FORMING without leadership.",
    "bulk.guide.col.cells.traineeLeaderId": "Internal ID of the leader in training. Leave empty when there is none.",
    "bulk.guide.col.cells.meetingDay": "Exact uppercase English day code, e.g. WEDNESDAY.",
    "bulk.guide.col.cells.meetingTime": "Time in 24-hour HH:MM format, e.g. 19:30. In the spreadsheet, type it as text.",
    "bulk.guide.col.cells.address": "Address up to 500 characters.",
    "bulk.guide.col.users.firstName": "First name up to 100 characters.",
    "bulk.guide.col.users.lastName": "Last name up to 100 characters.",
    "bulk.guide.col.users.email": "Valid and unique email. The system converts it to lowercase.",
    "bulk.guide.col.users.initialPassword": "Password of 12 to 128 characters, with uppercase, lowercase, number and symbol.",
    "bulk.guide.col.users.roles": "From 1 to 4 different names among ADMIN, PASTOR, SUPERVISOR and LEADER. Provide role names, not identifiers.",
    "users.import.label.initialPassword": "Initial password",
    "users.import.label.roleNames": "Access role names",
    "people.column.phone": "Phone",
    "people.column.birthDate": "Birth",
    "people.column.gender": "Gender",
    "people.filter.all": "All",
    "people.filter.active": "Active",
    "people.filter.inactive": "Inactive",
    "people.gender.male": "Male",
    "people.gender.female": "Female",
    "people.gender.other": "Other",
    "people.field.gender": "Gender",
    "people.search.hint": "Name, email or phone",
    "people.sort.label": "Sort by",
    "people.sort.nameAsc": "Name (A–Z)",
    "people.sort.nameDesc": "Name (Z–A)",
    "people.sort.birthDateDesc": "Birth date (most recent)",
    "people.sort.birthDateAsc": "Birth date (oldest)",
    "people.sort.createdAtDesc": "Recently registered",
    "people.sort.createdAtAsc": "Oldest registrations",
    "people.action.clearFilters": "Clear filters",
    "people.action.reactivate": "Reactivate",
    "people.action.viewDetails": "View details",
    "people.emptyState.desc": "Adjust the filters or register a new person.",
    "people.error.retry": "Try again shortly.",
    "people.alert.success": "Success",
    "people.alert.failure": "Failure",
    "people.toast.reactivated": "Person reactivated",
    "people.toast.reactivated.desc": "{name} is back participating in the church.",
    "people.toast.reactivateError": "Could not reactivate the person. Try again.",
    "people.detail.loading": "Loading person",
    "people.error.load": "Could not load the person",
    "people.detail.empty": "Person not found",
    "people.detail.empty.desc": "The requested person does not exist or is not available.",
    "people.toast.noChange": "No changes",
    "people.toast.noChange.desc": "There was no new data to save.",
    "people.detail.saved.desc": "The data was saved.",
    "people.detail.error.save": "Could not save the changes. Check the data and try again.",
    "people.detail.error.invalidDate": "Enter a valid date in DD/MM/YYYY format.",
    "people.toast.inactivated": "Person inactivated",
    "people.toast.inactivated.desc": "She will only be listed for administrators.",
    "people.detail.error.inactivate": "Could not inactivate the person. Try again.",
    "people.detail.back": "Back to people",
    "people.detail.label.gender": "Gender",
    "people.detail.label.registration": "Registration",
    "people.detail.edit": "Edit data",
    "people.detail.field.fullName": "Full name",
    "people.detail.saveChanges": "Save changes",
    "people.detail.inactivatePerson": "Inactivate person",
    "people.detail.inactivate.title": "Inactivate person",
    "people.detail.inactivate.desc": "The person will no longer appear in listings and cannot be linked to cells while inactive. You can reactivate them from the listing.",
    "people.detail.inactivate.inactivating": "Inactivating…",
    "people.detail.inactivate.action": "Inactivate",
    "people.toast.created": "Person registered",
    "people.new.description": "Fill in contact and identification data.",
    "people.new.legend.identification": "Identification",
    "people.new.legend.contact": "Contact",
    "people.new.legend.observations": "Observations",
    "people.new.hint.name": "First and last name, e.g.: Maria da Silva.",
    "people.new.hint.gender": "E.g.: Female, Male or how the person identifies.",
    "people.new.hint.email": "It will be normalized to lowercase.",
    "people.new.hint.phone": "Brazilian format, e.g.: (11) 99999-9999.",
    "people.new.hint.observations": "Additional information. Visible to administrators and pastors.",
    "people.new.submit": "Register person",
    "people.new.submitting": "Registering…",
    "people.new.error.duplicate": "There is already an active person with similar data. Check the registration before continuing.",
    "people.new.error.generic": "Could not register the person. Check the data and try again.",
    "people.new.error.invalidDate": "Enter a valid birth date in DD/MM/YYYY format.",
    "cells.page.subtitle": "View, register and track your church's cells.",
    "cells.action.clearFilters": "Clear filters",
    "cells.error.retry": "Try again shortly.",
    "cells.emptyState.desc": "Adjust the filters or register a new cell.",
    "cells.column.code": "Code",
    "cells.column.supervisor": "Supervisor",
    "cells.column.meeting": "Meeting",
    "cells.action.viewDetails": "View details",
    "cells.search.hint": "Name or code",
    "cells.detail.loading": "Loading cell",
    "cells.error.load": "Could not load the cell",
    "cells.detail.empty": "Cell not found",
    "cells.detail.empty.desc": "The requested cell does not exist.",
    "cells.detail.error.form": "Check the changed data.",
    "cells.detail.toast.updated": "Cell updated",
    "cells.detail.toast.saved.desc": "The data was saved.",
    "cells.detail.toast.activated": "Cell activated",
    "cells.detail.toast.suspended": "Cell suspended",
    "cells.detail.toast.activated.desc": "The cell is running again.",
    "cells.detail.toast.suspended.desc": "The cell is now suspended.",
    "cells.detail.toast.leadership": "Leadership updated",
    "cells.detail.toast.leadership.desc": "The new links were saved.",
    "cells.detail.toast.trainee": "Trainee leader updated",
    "cells.detail.toast.trainee.desc": "The link was saved.",
    "cells.detail.error.leaderRequired": "Select the leader and the supervisor.",
    "cells.detail.status.suspend": "Suspend cell",
    "cells.detail.status.activate": "Activate cell",
    "cells.detail.status.reactivate": "Reactivate cell",
    "cells.detail.status.suspend.desc": "The cell will be suspended and remain visible in history.",
    "cells.detail.status.activate.desc": "The cell will return to active status. Active cells require a leader.",
    "cells.detail.back": "Back to cells",
    "cells.detail.viewMeetings": "View meetings",
    "cells.detail.label.supervisor": "Supervisor",
    "cells.detail.label.trainee": "Trainee leader",
    "cells.detail.label.meeting": "Meeting",
    "cells.detail.label.address": "Address",
    "cells.detail.label.created": "Created on",
    "cells.detail.label.updated": "Updated on",
    "cells.detail.edit": "Edit data",
    "cells.detail.field.name": "Name",
    "cells.detail.field.meetingDay": "Meeting day",
    "cells.detail.field.time": "Time",
    "cells.detail.field.address": "Address",
    "cells.detail.time.hint": "HH:mm format, e.g.: 19:30.",
    "cells.detail.saveChanges": "Save changes",
    "cells.detail.suspend": "Suspend cell",
    "cells.detail.changeLeader": "Change leader",
    "cells.detail.changeTrainee": "Change trainee leader",
    "cells.detail.removeTrainee": "Remove trainee leader",
    "cells.detail.assignTrainee": "Assign trainee leader",
    "cells.detail.noManage": "You don't have permission to manage this cell.",
    "cells.detail.dialog.confirming": "Confirming…",
    "cells.detail.dialog.confirm": "Confirm",
    "cells.detail.dialog.changeLeader.title": "Change leader",
    "cells.detail.dialog.changeLeader.desc": "The new leader and supervisor must be active and in the same church.",
    "cells.detail.dialog.trainee.title": "Trainee leader",
    "cells.detail.dialog.trainee.desc": "Select the user in training or clear to remove.",
    "cells.detail.dialog.removeTrainee.title": "Remove trainee leader",
    "cells.detail.dialog.removeTrainee.desc": "The user will no longer be a trainee leader for this cell.",
    "cells.detail.dialog.removeTrainee.confirm": "Confirm removal",
    "cells.detail.error.codeConflict": "Another cell already uses this code.",
    "cells.detail.error.leaderNotEligible": "The selected leader is not eligible.",
    "cells.detail.error.supervisorConflict": "The selected supervisor already supervises another leader.",
    "cells.detail.error.candidateNotFound": "The selected candidate is not available.",
    "cells.detail.error.transitionInvalid": "The status change is not allowed right now. Active cells require a leader.",
    "cells.detail.error.generic": "Could not {action}. The server may have refused for security reasons.",
    "cells.action.saveChanges": "save the changes",
    "cells.action.changeStatus": "change the status",
    "cells.action.changeLeadership": "change the leadership",
    "cells.action.changeTrainee": "change the trainee leader",
    "cells.create.error.generic": "Could not create the cell. Check the data and try again.",
    "cells.create.error.codeConflict": "A cell with this code already exists.",
    "cells.create.error.leaderNotEligible": "The selected leader is not eligible to lead the cell.",
    "cells.create.error.supervisorConflict": "The selected supervisor already supervises another leader.",
    "cells.create.error.candidateNotFound": "The selected leader or supervisor is not available.",
    "cells.create.error.idempotency": "The previous attempt conflicted with another. Try again.",
    "cells.create.legend.identification": "Identification",
    "cells.create.legend.leadership": "Leadership",
    "cells.create.legend.meeting": "Meeting and location",
    "cells.create.hint.code": "E.g.: CEL-001. Uppercase letters and hyphens.",
    "cells.create.hint.name": "E.g.: Esperança Cell.",
    "cells.create.hint.status": "Active requires eligible leader and supervisor.",
    "cells.create.hint.leader": "Search by user name.",
    "cells.create.hint.supervisor": "Search by user name.",
    "cells.create.hint.trainee": "Optional. Search by user name.",
    "cells.create.hint.time": "HH:mm format, e.g.: 19:30.",
    "cells.create.hint.address": "Place where the cell meets.",
    "cells.create.submit": "Create cell",
    "cells.create.submitting": "Creating…",
    "cells.create.alertTitle": "Could not create",
    "cells.assignment.loadError": "Could not load the options.",
    "cells.assignment.noCandidates": "No candidates found.",
    "cells.assignment.clearLabel": "Clear {label}",
    "cells.assignment.optionsLabel": "Options for {label}",
    "meetings.page.subtitle": "Manage the cell's scheduled meetings.",
    "meetings.action.clearFilters": "Clear filters",
    "meetings.error.retry": "Try again shortly.",
    "meetings.emptyState.desc": "Adjust the filters or schedule a new meeting.",
    "meetings.column.updatedAt": "Updated on",
    "meetings.action.viewDetails": "View details",
    "meetings.filter.all": "All",
    "meetings.field.from": "Start date",
    "meetings.field.to": "End date",
    "meetings.date.hint": "YYYY-MM-DD",
    "meetings.detail.loading": "Loading meeting",
    "meetings.error.load": "Could not load the meeting",
    "meetings.detail.empty": "Meeting not found",
    "meetings.detail.empty.desc": "The requested meeting does not exist.",
    "meetings.detail.dateError": "Invalid date.",
    "meetings.detail.toast.dateUpdated": "Date updated",
    "meetings.detail.toast.dateUpdated.desc": "The meeting was rescheduled.",
    "meetings.detail.toast.observations": "Observations saved",
    "meetings.detail.toast.observations.desc": "The report was updated.",
    "meetings.detail.toast.completed": "Meeting completed",
    "meetings.detail.toast.completed.desc": "Attendance remains accessible in history.",
    "meetings.detail.toast.cancelled": "Meeting cancelled",
    "meetings.detail.toast.cancelled.desc": "The history was preserved.",
    "meetings.detail.error.reason": "Enter the cancellation reason.",
    "meetings.detail.back": "Back to meetings",
    "meetings.detail.label.cell": "Cell",
    "meetings.detail.label.cancelReason": "Cancellation reason",
    "meetings.detail.label.created": "Created on",
    "meetings.detail.label.updated": "Updated on",
    "meetings.detail.openAttendance": "Open attendance",
    "meetings.detail.editDate": "Edit date",
    "meetings.detail.observations": "Observations",
    "meetings.detail.observations.placeholder": "Observations about the meeting...",
    "meetings.detail.saveObservations": "Save observations",
    "meetings.detail.completeMeeting": "Complete meeting",
    "meetings.detail.cancelMeeting": "Cancel meeting",
    "meetings.detail.dialog.complete.title": "Complete meeting",
    "meetings.detail.dialog.complete.desc": "The meeting will be marked as completed and can no longer be edited.",
    "meetings.detail.dialog.cancel.title": "Cancel meeting",
    "meetings.detail.dialog.cancel.desc": "Enter the cancellation reason. The meeting will be permanently cancelled.",
    "meetings.detail.dialog.cancel.placeholder": "Cancellation reason...",
    "meetings.detail.dialog.cancel.back": "Back",
    "meetings.detail.dialog.cancel.confirm": "Confirm cancellation",
    "meetings.detail.dialog.cancelling": "Cancelling...",
    "meetings.detail.dialog.confirming": "Confirming...",
    "meetings.detail.error.generic": "Could not {action}. Try again.",
    "meetings.action.updateDate": "update the date",
    "meetings.action.saveObservations": "save observations",
    "meetings.action.completeMeeting": "complete the meeting",
    "meetings.action.cancelMeeting": "cancel the meeting",
    "meetings.detail.error.notEditable": "The meeting cannot be edited because it has already been completed or cancelled.",
    "meetings.detail.error.transitionInvalid": "The status change is not allowed right now.",
    "meetings.detail.error.reportNotEditable": "Cannot edit observations of a cancelled meeting.",
    "meetings.detail.error.dateConflict": "A meeting is already scheduled for this date.",
    "meetings.new.legend.date": "Meeting date",
    "meetings.new.hint.date": "YYYY-MM-DD format",
    "meetings.new.submit": "Create meeting",
    "meetings.new.submitting": "Creating…",
    "meetings.new.alertTitle": "Could not create",
    "meetings.new.error.generic": "Could not create the meeting. Check the data and try again.",
    "meetings.new.error.dateConflict": "A meeting is already scheduled for this cell on this date.",
    "meetings.new.error.cellNotFound": "The informed cell was not found.",
    "meetings.new.error.cellStatusInvalid": "The cell must be active to schedule meetings.",
    "meetings.new.error.accessDenied": "You do not have permission to create meetings in this cell.",
    "meetings.new.error.transitionInvalid": "Status change not allowed for this meeting.",
    "meetings.new.error.notEditable": "This meeting can no longer be edited.",
    "meetings.new.error.reportNotEditable": "Cannot edit the report of a cancelled meeting.",
    "meetings.new.error.retryExhausted": "Too many simultaneous attempts. Wait a moment and try again.",
    "meetings.new.error.idempotency": "The previous attempt conflicted with another. Try again.",
    "attendance.detail.summary": "Attendance summary",
    "attendance.search": "Search participant",
    "attendance.summary.present": "present",
    "attendance.summary.absent": "absent",
    "attendance.summary.excused": "excused",
    "attendance.summary.unmarked": "unmarked",
    "attendance.summary.visitors": "visitors",
    "attendance.back": "Back to meeting",
    "attendance.alertTitle": "Attendance",
    "attendance.skipChanges": "Discard unsaved changes?",
    "attendance.skipChanges.confirm": "Discard unsaved changes?",
    "attendance.forbidden": "Access denied",
    "attendance.forbidden.desc": "You do not have access to this meeting's attendance.",
    "attendance.unavailable": "Attendance unavailable right now",
    "attendance.unavailable.desc": "Could not fetch this meeting's data. Try again shortly.",
    "attendance.notAvailable": "Attendance not yet available",
    "attendance.notAvailable.desc": "There is no attendance data available for this meeting.",
    "attendance.loading": "Loading attendance",
    "attendance.conflict": "Attendance",
    "attendance.pageTitle": "Attendance",
    "attendance.saveFrequency": "Save attendance",
    "attendance.toast.savedTitle": "Attendance saved",
    "attendance.conflict.message": "Another person changed the attendance. Your marks were preserved; reload the base to compare before saving again.",
    "attendance.detail.visitors": "Visitors",
    "attendance.conflict.reload": "Reload base to compare",
    "attendance.conflict.updated": "The base was updated. Review your preserved marks before saving.",
    "attendance.readOnlyTitle": "Read only",
    "attendance.readOnlyDesc": "This meeting was cancelled. The history was preserved.",
    "attendance.searchParticipant": "Search participant",
    "attendance.addVisitor": "Add visitor",
    "attendance.noParticipantFound": "No participant found",
    "attendance.noParticipantFound.desc": "We found no eligible participants with that name.",
    "attendance.noEligibleParticipants": "No eligible participants",
    "attendance.noEligibleParticipants.desc": "This cell has no eligible participants on the meeting date.",
    "attendance.personFrequency": "{name}'s attendance",
    "attendance.contactPending": "contact pending",
    "attendance.removeVisitorConfirm": "Remove this visitor from the meeting?",
    "attendance.removeVisitor": "Remove",
    "attendance.discardChanges": "Discard changes",
    "attendance.unsaved": "Unsaved changes",
    "attendance.observation": "Observation",
    "attendance.toast.saved.desc": "The marks were recorded.",
    "attendance.error.save": "Could not save. Your changes were preserved.",
    "attendance.error.addVisitor": "Could not add the visitor.",
    "attendance.visitor.observation": "Observation",
    "users.page.subtitle": "Manage accounts, roles and access of your church's users.",
    "users.action.clearFilters": "Clear filters",
    "users.error.retry": "Try again shortly.",
    "users.emptyState.desc": "Adjust the filters or register a new user.",
    "users.action.viewDetails": "View details",
    "users.search.hint": "Name or email",
    "users.filter.all": "All",
    "users.column.roles": "Roles",
    "users.field.role": "Role",
    "users.detail.loading": "Loading user",
    "users.error.load": "Could not load the user",
    "users.detail.empty": "User not found",
    "users.detail.empty.desc": "The requested user does not exist.",
    "users.detail.back": "Back to users",
    "users.detail.edit": "Edit data",
    "users.detail.saveChanges": "Save changes",
    "users.detail.toast.updated.desc": "The data was saved.",
    "users.detail.error.save": "Could not save the changes. Check the data and try again.",
    "users.detail.toast.activated": "User activated",
    "users.detail.toast.activated.desc": "They can now sign in to the panel.",
    "users.detail.toast.blocked": "User blocked",
    "users.detail.toast.blocked.desc": "They will no longer be able to sign in.",
    "users.detail.toast.roles": "Roles updated",
    "users.detail.toast.roles.desc": "The permissions were replaced.",
    "users.detail.toast.password": "Password reset",
    "users.detail.toast.password.desc": "Share the new password with the user over a secure channel.",
    "users.detail.roles.legend": "Roles",
    "users.detail.roles.hint": "The change requires confirmation and may affect permissions.",
    "users.detail.saveRoles": "Save roles",
    "users.detail.blockUser": "Block user",
    "users.detail.activateUser": "Activate user",
    "users.detail.dialog.block.title": "Block user",
    "users.detail.dialog.activate.title": "Activate user",
    "users.detail.dialog.roles.title": "Replace roles",
    "users.detail.dialog.reset.title": "Reset password",
    "users.detail.dialog.block.desc": "The user will no longer be able to sign in while blocked.",
    "users.detail.dialog.activate.desc": "The user will be able to sign in again.",
    "users.detail.dialog.roles.desc": "The current roles will be replaced by the selected ones. Confirm before continuing.",
    "users.detail.dialog.reset.desc": "The current password will be replaced immediately.",
    "users.detail.dialog.newPassword": "New password",
    "users.detail.dialog.passwordHint": "At least {min} characters.",
    "users.detail.dialog.confirming": "Confirming…",
    "users.detail.error.lastAdmin": "Cannot complete the operation because this is the church's last active administrator.",
    "users.detail.error.emailConflict": "A user with this email already exists.",
    "users.detail.error.generic": "Could not complete the operation. The server may have refused for security reasons.",
    "users.modal.roles": "Roles",
    "users.modal.noRoles": "No roles assigned",
    "users.modal.accountInfo": "Account information",
    "users.modal.createdAt": "Created on",
    "users.modal.updatedAt": "Last update",
    "users.modal.photo": "Profile photo",
    "users.modal.photoSet": "Set",
    "users.modal.photoNotSet": "Not set",
    "users.modal.userId": "User ID",
    "users.modal.openPage": "Open full page",
    "users.new.legend.access": "Access data",
    "users.new.hint.password": "Share the initial password with the user over a secure channel.",
    "users.new.error.roles": "Select at least one role.",
    "users.new.error.password": "Use a password that meets all security requirements.",
    "users.new.submit": "Create user",
    "users.new.submitting": "Creating…",
    "users.new.error.emailConflict": "A user with this email already exists.",
    "users.new.error.generic": "Could not create the user. Check the data and try again.",
    "users.new.alertTitle": "Could not create",
    "users.new.toast.created.desc": "{name} now has access to the panel.",
    "users.new.legend.roles": "Roles",
    "users.new.noRoles": "No roles available",
    "users.new.noRoles.desc": "There are no manageable roles to assign.",
    "users.loading.roles": "Loading roles",
    "users.error.loadRoles": "Could not load the roles",
    "users.strength.require.uppercase": "One uppercase letter",
    "users.strength.require.lowercase": "One lowercase letter",
    "users.strength.require.number": "One number",
    "users.strength.require.special": "One special character",
    "users.strength.require.aria": "Password strength",
    "users.strength.emptyAria": "No password entered",
    "users.strength.requirementsAria": "Password requirements",
    "reports.hub.title": "Reports",
    "reports.hub.subtitle": "Select the desired report type.",
    "reports.hub.card.pending": "Pending Reports",
    "reports.hub.card.pending.desc": "Completed meetings without a submitted report",
    "reports.hub.card.attendance": "Attendance",
    "reports.hub.card.attendance.desc": "Attendance summary and details by cell",
    "reports.hub.card.visitors": "Visitors",
    "reports.hub.card.visitors.desc": "Visitor list and contact metrics",
    "reports.hub.card.meetings": "Meetings",
    "reports.hub.card.meetings.desc": "Consolidated meeting report by period",
    "reports.visitors.page.description": "Visitor list and contact metrics.",
    "reports.visitors.metric.total": "Total visitors",
    "reports.visitors.metric.pending": "Pending contact",
    "reports.visitors.metric.topCell": "Cell with the most visitors",
    "reports.visitors.filter.contact": "Contact",
    "reports.visitors.filter.all": "All",
    "reports.visitors.status.pending": "Pending",
    "reports.visitors.status.done": "Done",
    "reports.visitors.action.clearFilters": "Clear filters",
    "reports.visitors.error": "Could not load the visitors",
    "reports.visitors.error.retry": "Try again shortly.",
    "reports.visitors.loading": "Loading visitors",
    "reports.visitors.emptyState": "No visitors found",
    "reports.visitors.emptyState.desc": "There are no visitors registered in the period.",
    "reports.visitors.column.contact": "Contact",
    "reports.visitors.column.name": "Name",
    "reports.visitors.filter.period": "Period",
    "reports.visitors.pageTitle": "Visitors",
    "reports.pending.page.description": "Completed meetings that have not yet had their report submitted.",
    "reports.pending.filter.all": "All",
    "reports.pending.status.noReport": "No report",
    "reports.pending.status.notStarted": "Not started",
    "reports.pending.status.draft": "Draft",
    "reports.pending.status.returned": "Returned",
    "reports.pending.status.submitted": "Submitted",
    "reports.pending.action.clearFilters": "Clear filters",
    "reports.pending.error": "Could not load the pending reports",
    "reports.pending.error.retry": "Try again shortly.",
    "reports.pending.loading": "Loading reports",
    "reports.pending.emptyState": "No pending reports",
    "reports.pending.emptyState.desc": "All completed meetings have already been reported.",
    "reports.pending.column.date": "Meeting date",
    "reports.pending.column.days": "Days without report",
    "reports.pending.filter.period": "Period",
    "reports.pending.pageTitle": "Pending Reports",
    "reports.pending.filter.status": "Status",
    "reports.meetings.page.description": "Consolidated meeting report by period.",
    "reports.meetings.filter.status": "Status",
    "reports.meetings.pageTitle": "Meetings",
    "reports.meetings.status.scheduled": "Scheduled",
    "reports.meetings.status.completed": "Completed",
    "reports.meetings.status.canceled": "Canceled",
    "reports.meetings.action.clearFilters": "Clear filters",
    "reports.meetings.filter.all": "All",
    "reports.meetings.column.status": "Status",
    "reports.meetings.column.present": "Present",
    "reports.meetings.column.absent": "Absent",
    "reports.meetings.column.rate": "Attendance",
    "reports.meetings.column.report": "Report",
    "reports.meetings.error": "Could not load the meetings",
    "reports.meetings.error.retry": "Try again shortly.",
    "reports.meetings.loading": "Loading meetings",
    "reports.meetings.emptyState": "No meetings found",
    "reports.meetings.emptyState.desc": "There are no meetings registered in the period.",
    "reports.meetings.filter.period": "Period",
    "reports.meetings.reportStatus.notStarted": "Not started",
    "reports.meetings.reportStatus.draft": "Draft",
    "reports.meetings.reportStatus.submitted": "Submitted",
    "reports.meetings.reportStatus.returned": "Returned",
    "reports.meetings.reportStatus.cancelled": "Cancelled",
    "reports.attendance.page.description": "Attendance summary by cell in the period.",
    "reports.attendance.filter.period": "Period",
    "reports.attendance.filter.health": "Health",
    "reports.attendance.filter.all": "All",
    "reports.attendance.pageTitle": "Attendance",
    "reports.attendance.band.healthy": "Healthy",
    "reports.attendance.band.attention": "Attention",
    "reports.attendance.band.critical": "Critical",
    "reports.attendance.action.clearFilters": "Clear filters",
    "reports.attendance.error": "Could not load the attendance",
    "reports.attendance.error.retry": "Try again shortly.",
    "reports.attendance.loading": "Loading attendance",
    "reports.attendance.emptyState": "No attendance data",
    "reports.attendance.emptyState.desc": "There are no completed meetings in the period.",
    "reports.attendance.column.cell": "Cell",
    "reports.attendance.column.leader": "Leader",
    "reports.attendance.column.meetings": "Meetings",
    "reports.attendance.column.rate": "Attendance",
    "reports.attendance.column.average": "Average present",
    "reports.attendance.column.visitors": "Visitors",
    "reports.attendance.column.health": "Health",
    "reports.attendanceDetail.page.crumb": "Detail by person",
    "reports.attendanceDetail.filter.period": "Period",
    "reports.attendanceDetail.action.reload": "Reload",
    "reports.attendanceDetail.error": "Could not load the attendance detail",
    "reports.attendanceDetail.error.retry": "Try again shortly.",
    "reports.attendanceDetail.loading": "Loading detail",
    "reports.attendanceDetail.emptyState": "No people found",
    "reports.attendanceDetail.emptyState.desc": "There is no attendance data for this cell in the period.",
    "reports.attendanceDetail.column.present": "Present",
    "reports.attendanceDetail.column.absent": "Absent",
    "reports.attendanceDetail.column.excused": "Excused",
    "reports.attendanceDetail.column.rate": "Attendance",
    "reports.attendanceDetail.pageTitle": "Attendance Detail",
    "reports.export.label": "Export {format}",
    "bulk.form.legend": "Import file",
    "bulk.form.hint": "Accepted formats: XLSX, CSV and JSON. Limit of 5 MB and 2,000 rows.",
    "bulk.form.error.empty": "Select a file to continue.",
    "bulk.form.error.extension": "Use a file in XLSX, CSV or JSON format.",
    "bulk.form.error.size": "The file must be at most 5 MB.",
    "bulk.form.choose": "Choose file",
    "bulk.form.change": "Change file",
    "bulk.form.none": "No file selected",
    "bulk.form.submit": "Import file",
    "bulk.form.submitting": "Importing...",
    "bulk.form.download": "Download CSV template",
    "bulk.form.back": "Back to the list",
    "bulk.form.alertError": "Upload failed",
    "bulk.form.error.generic": "Could not import the file. Check the data and try again.",
    "bulk.form.toast.title": "Import completed",
    "bulk.form.toast.desc": "{created} of {processed} records created.",
    "bulk.result.allCreated": "All records were created",
    "bulk.result.pending": "Import completed with pending items",
    "bulk.result.summary": "{processed} processed, {created} created and {failed} with errors.",
    "bulk.result.title": "Result by row",
    "bulk.result.aria": "Import result by row",
    "bulk.column.row": "Row",
    "bulk.column.status": "Status",
    "bulk.column.details": "Details",
    "bulk.status.created": "Created",
    "bulk.status.error": "Error",
    "bulk.noObservations": "No observations",
    "profile.photo.dialog.title": "Profile photo",
    "profile.photo.dialog.desc": "Your photo appears on your profile and in the account menu.",
    "profile.photo.previewAlt": "Profile photo preview",
    "profile.photo.choose": "Choose photo",
    "profile.photo.help": "The image will be cropped to the center and optimized. Maximum 8 MB.",
    "profile.photo.error.format": "Choose a JPEG, PNG or WebP image up to 8 MB.",
    "profile.photo.save": "Save photo",
    "profile.photo.toast.saved": "Photo updated",
    "profile.photo.toast.saved.desc": "Your new photo is now visible in the panel.",
    "profile.photo.toast.removed": "Photo removed",
    "profile.photo.toast.removed.desc": "Your initials will appear again on your profile.",
    "profile.photo.error.save": "Could not save the photo. Try again.",
    "profile.photo.error.remove": "Could not remove the photo.",
    "church.page.title": "Church",
    "church.page.description": "Institutional data and settings. Editing is only available to administrators.",
    "church.section.institutional": "Institutional data",
    "church.field.name": "Name",
    "church.field.slug": "Identifier (slug)",
    "church.hint.slug": "Lowercase letters, numbers and hyphens.",
    "church.hint.phone": "Brazilian format, e.g.: (11) 99999-9999.",
    "church.hint.timezone": "IANA pattern, e.g.: America/Sao_Paulo.",
    "church.field.weekStart": "Start day of the week",
    "church.saveData": "Save data",
    "church.saveSettings": "Save settings",
    "church.toast.savedData.desc": "The church information was saved.",
    "church.toast.savedSettings.desc": "The church preferences were saved.",
    "church.toast.noChange": "No changes",
    "church.toast.noChange.desc": "There was no new data to save.",
    "church.toast.noChangeSettings.desc": "There were no new settings to save.",
    "church.error.save": "Could not save. Check slug, contact and address.",
    "church.error.saveSettings": "Could not save the settings. Check the timezone.",
    "church.error.load": "Could not load the church data",
    "church.empty.title": "Church unavailable",
    "church.empty.desc": "The church data could not be loaded.",
    "church.loading.church": "Loading church",
    "church.address.cep.hint": "When leaving the field, the address will be filled by ViaCEP.",
    "church.address.cep.digits": "Enter a CEP with 8 digits.",
    "church.address.lookupSuccess": "Address filled from the CEP.",
    "church.address.lookupNotFound": "CEP not found. Check the number or fill the address manually.",
    "church.address.lookupError": "Could not look up the CEP. Fill the address manually.",
    "church.address.lookupLoading": "Looking up CEP…",
    "church.address.field.country": "Country",
    "church.label.stateUf": "State (UF)",
    "church.field.email": "Email",
    "church.section.settings": "Settings",
    "church.field.timezone": "Timezone",
    "church.toast.savedData": "Data updated",
    "church.toast.savedSettings": "Settings updated",
    "church.error.retry": "Try again shortly.",
    "people.page.title": "People",
    "people.page.subtitle": "Keep your church's people records up to date.",
    "people.new": "New person",
    "people.error.list": "Could not load the people",
    "people.emptyState.title": "No people found",
    "people.detail.toast.updated": "Person updated",
    "people.detail.field.observations": "Observations",
    "cells.page.title": "Cells",
    "cells.new": "New cell",
    "cells.error.list": "Could not load the cells",
    "cells.emptyState.title": "No cells found",
    "cells.column.name": "Name",
    "cells.detail.meetingAt": "{day} at {time}",
    "cells.detail.error.tryAgain": "Could not {action}. Try again.",
    "common.success": "Success",
    "common.failure": "Failure",
    "cells.create.back": "Back to cells",
    "cells.create.toast.created": "Cell created",
    "meetings.page.title": "Meetings",
    "meetings.new": "New meeting",
    "meetings.error.list": "Could not load the meetings",
    "meetings.emptyState.title": "No meetings found",
    "common.confirm": "Confirm",
    "meetings.detail.error.tryAgain": "Could not {action}. Try again.",
    "meetings.new.toast.created": "Meeting created"
  },
  es: {
    "app.title": "Ecosistema de Células",
    "app.meta.description": "Ecosistema de gestión de células y grupos pequeños.",
    "app.tagline": "Gestión que acerca.",
    "app.tagline.sub": "Una visión clara para cuidar de cada célula.",
    "app.tagline.description": "Organiza personas, encuentros y liderazgo en un solo lugar.",
    "common.cancel": "Cancelar",
    "common.save": "Guardar",
    "common.saving": "Guardando…",
    "common.back": "Volver",
    "common.edit": "Editar",
    "common.close": "Cerrar",
    "common.search": "Buscar",
    "common.actions": "Acciones",
    "common.loading": "Cargando",
    "common.retry": "Reintentar",
    "common.prev": "Anterior",
    "common.next": "Siguiente",
    "common.all": "Todas",
    "common.select": "Seleccionar",
    "common.add": "Agregar",
    "common.create": "Crear",
    "common.details": "Detalles",
    "common.status": "Estado",
    "common.optional": "opcional",
    "common.upload": "Subir foto",
    "common.remove": "Quitar",
    "common.error": "Error",
    "common.loadingContent": "Cargando contenido",
    "label.firstName": "Nombre",
    "label.lastName": "Apellido",
    "label.name": "Nombre",
    "label.email": "Correo electrónico",
    "label.phone": "Teléfono",
    "label.address": "Dirección",
    "label.status": "Estado",
    "label.password": "Contraseña",
    "nav.dashboard": "Panel",
    "nav.profile": "Mi perfil",
    "nav.settings": "Configuración",
    "nav.people": "Personas",
    "nav.cells": "Células",
    "nav.reports": "Informes",
    "nav.users": "Usuarios",
    "nav.workspace": "Espacio de trabajo",
    "nav.openMenu": "Abrir menú",
    "nav.closeMenu": "Cerrar menú",
    "nav.main": "Navegación principal",
    "nav.help": "¿Necesitas ayuda?",
    "nav.helpAction": "Hable por WhatsApp",
    "nav.helpAria": "¿Necesitas ayuda? Hablar por WhatsApp (se abre en una pestaña nueva)",
    "breadcrumb.dashboard": "Panel",
    "breadcrumb.profile": "Mi perfil",
    "breadcrumb.users": "Usuarios",
    "breadcrumb.usersImport": "Importar usuarios",
    "breadcrumb.usersNew": "Nuevo usuario",
    "breadcrumb.usersDetail": "Detalle del usuario",
    "breadcrumb.church": "Iglesia",
    "breadcrumb.churchSettings": "Configuración",
    "breadcrumb.people": "Personas",
    "breadcrumb.peopleImport": "Importar personas",
    "breadcrumb.peopleNew": "Nueva persona",
    "breadcrumb.peopleDetail": "Detalle de la persona",
    "breadcrumb.cells": "Células",
    "breadcrumb.cellsImport": "Importar células",
    "breadcrumb.cellsNew": "Nueva célula",
    "breadcrumb.cellsMeetingNew": "Nuevo encuentro",
    "breadcrumb.cellsMeetingDetail": "Detalle del encuentro",
    "breadcrumb.cellsMeetings": "Encuentros",
    "breadcrumb.cellsDetail": "Detalle de la célula",
    "breadcrumb.meetings": "Encuentros",
    "breadcrumb.aria": "Ruta de navegación",
    "breadcrumb.backToMeetings": "Encuentros",
    "shell.section": "Gestión de células",
    "shell.skip": "Saltar al contenido principal",
    "shell.loadingSession": "Cargando sesión",
    "theme.toggleDark": "Activar tema oscuro",
    "theme.toggleLight": "Activar tema claro",
    "userMenu.fallback": "Usuario",
    "userMenu.photoHint": "Haz clic en la foto para cambiarla",
    "userMenu.profile": "Mi perfil",
    "userMenu.profileDesc": "Datos personales y foto",
    "userMenu.settings": "Configuración",
    "userMenu.settingsDesc": "Preferencias y apariencia",
    "userMenu.signout": "Cerrar sesión",
    "userMenu.signingOut": "Cerrando sesión…",
    "userMenu.signoutTitle": "Finalizar esta sesión",
    "userMenu.open": "Abrir menú de cuenta",
    "userMenu.dialog": "Cuenta de usuario",
    "userMenu.close": "Cerrar menú de cuenta",
    "states.retry": "Reintentar",
    "pagination.aria": "Paginación",
    "pagination.prev": "Anterior",
    "pagination.next": "Siguiente",
    "pagination.info": "Página {page} de {totalPages} · {from}–{to} de {totalItems}",
    "statusBadge.active": "Activo",
    "statusBadge.inactive": "Inactivo",
    "statusBadge.blocked": "Bloqueado",
    "toast.ariaNotifications": "Notificaciones",
    "toast.closeNotification": "Cerrar notificación",
    "field.showPassword": "Mostrar contraseña",
    "field.hidePassword": "Ocultar contraseña",
    "api.generic": "No se pudo completar la operación. Inténtalo de nuevo.",
    "api.timeout": "La solicitud tardó demasiado. Inténtalo de nuevo.",
    "api.network": "Error de conexión con el servidor.",
    "api.unauthorized": "Tu sesión expiró. Vuelve a iniciar sesión.",
    "api.forbidden": "No tienes permiso para realizar esta acción.",
    "api.notFound": "El recurso solicitado no fue encontrado.",
    "api.conflict": "Conflicto con los datos actuales.",
    "api.rateLimited": "Demasiados intentos. Espera un momento.",
    "role.admin": "Administrador",
    "role.pastor": "Pastor",
    "role.supervisor": "Supervisor",
    "role.leader": "Líder",
    "bootstrap.loading": "Ecosistema de Células",
    "bootstrap.verifying": "Verificando tu sesión…",
    "bootstrap.aria": "Cargando sesión",
    "login.title": "Accede a tu cuenta",
    "login.subtitle": "Usa tus datos para entrar al Ecosistema de Células.",
    "login.alertTitle": "No se pudo entrar",
    "login.emailLabel": "Correo electrónico",
    "login.passwordLabel": "Contraseña",
    "login.invalidEmail": "Ingresa un correo válido.",
    "login.requiredPassword": "Ingresa tu contraseña.",
    "login.invalidCredentials": "Contraseña o correo inválidos.",
    "login.rateLimited": "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
    "login.submit": "Entrar",
    "login.submitting": "Entrando…",
    "login.genericError": "No fue posible entrar. Inténtalo de nuevo.",
    "login.toastTitle": "No se pudo entrar",
    "login.presentationAria": "Presentación del Ecosistema de Células",
    "login.brandAlt": "Missão Atos — Iglesia en Células",
    "accessDenied.title": "Acceso denegado",
    "accessDenied.description": "Tu cuenta no tiene permiso para acceder a este recurso. Si necesitas acceso, habla con un administrador.",
    "accessDenied.back": "Volver al panel",
    "errorPage.title": "Algo salió mal",
    "errorPage.description": "No se pudo completar la operación. Inténtalo de nuevo en unos instantes.",
    "errorPage.retry": "Reintentar",
    "notFound.title": "Página no encontrada",
    "notFound.description": "La página solicitada no existe o fue movida.",
    "notFound.home": "Ir al inicio",
    "dash.title": "Panel",
    "dash.overview": "Resumen",
    "dash.description": "Organiza personas, acompaña células y mantén el liderazgo conectado.",
    "dash.access": "Acceso: {role}",
    "dash.quickAccess": "Acceso rápido",
    "dash.quickAccess.hint": "¿Qué quieres hacer?",
    "dash.quickAccess.choose": "Elige un área para continuar.",
    "dash.shortcut.profile": "Actualiza tus datos y cambia tu contraseña.",
    "dash.shortcut.settings": "Preferencias personales y ajustes de la iglesia.",
    "dash.shortcut.people": "Consulta y gestiona a las personas de la iglesia.",
    "dash.shortcut.cells": "Consulta y gestiona las células de la iglesia.",
    "dash.shortcut.users": "Gestiona cuentas, roles y acceso.",
    "dash.loading": "Cargando panel",
    "settings.page.title": "Configuración",
    "settings.page.description": "Preferencias personales y ajustes operacionales de la iglesia.",
    "settings.section.regional": "Regional",
    "settings.section.operacional": "Operacional",
    "settings.section.preferencias": "Preferencias",
    "settings.section.accessibility": "Accesibilidad",
    "settings.field.timezone": "Zona horaria",
    "settings.field.timezone.hint": "IANA, ej.: America/Sao_Paulo.",
    "settings.field.weekStartsOn": "Inicio de la semana",
    "settings.field.deadlineHours": "Plazo para informe (horas)",
    "settings.field.deadlineHours.hint": "Horas después del fin del día del encuentro para enviar el informe (1–720).",
    "settings.field.language": "Idioma",
    "settings.field.displayTimezone": "Zona de visualización",
    "settings.field.displayTimezone.null": "Heredar de la iglesia",
    "settings.field.displayTimezone.hint": "Deje vacío para heredar la zona de la iglesia.",
    "settings.field.dateFormat": "Formato de fecha",
    "settings.field.theme": "Tema",
    "settings.field.accessibilityContrast": "Contraste",
    "settings.field.accessibilityTextScale": "Tamaño del texto",
    "settings.field.accessibilityMotion": "Movimiento",
    "settings.field.accessibilityFocus": "Indicador de foco",
    "settings.accessibility.system": "Usar preferencia del sistema",
    "settings.accessibility.standard": "Estándar",
    "settings.accessibility.high": "Alto contraste",
    "settings.accessibility.large": "Grande",
    "settings.accessibility.extraLarge": "Extra grande",
    "settings.accessibility.reduce": "Reducir movimiento",
    "settings.accessibility.enhanced": "Reforzado",
    "settings.accessibility.shortcut.contrast": "Contraste: {value}",
    "settings.accessibility.shortcut.scale": "Tamaño del texto: {value}",
    "settings.theme.light": "Claro",
    "settings.theme.dark": "Oscuro",
    "settings.theme.system": "Sistema",
    "settings.locale.pt-BR": "Portugués (Brasil)",
    "settings.locale.en": "English",
    "settings.locale.es": "Español",
    "settings.btn.save": "Guardar",
    "settings.btn.saving": "Guardando…",
    "settings.toast.saved": "Configuración guardada",
    "settings.toast.saved.desc": "Los cambios se aplicaron correctamente.",
    "settings.toast.noop": "Sin cambios",
    "settings.toast.noop.desc": "No había cambios nuevos para guardar.",
    "settings.toast.error": "No se pudo guardar. Verifique los valores e inténtelo de nuevo.",
    "settings.loading": "Cargando configuración",
    "settings.load.error": "No se pudo cargar la configuración",
    "settings.load.retry": "Inténtelo de nuevo en un momento.",
    "settings.unavailable": "Configuración no disponible",
    "settings.unavailable.desc": "No se pudo cargar la configuración.",
    "church.title": "Configuración de la iglesia",
    "church.section.info": "Información de la iglesia",
    "church.section.address": "Dirección",
    "church.section.regional": "Regional",
    "church.section.operacional": "Operacional",
    "church.label.name": "Nombre de la iglesia",
    "church.label.phone": "Teléfono",
    "church.label.cnpj": "CNPJ",
    "church.label.cep": "Código postal",
    "church.label.street": "Calle",
    "church.label.number": "Número",
    "church.label.neighborhood": "Barrio",
    "church.label.city": "Ciudad",
    "church.label.state": "Estado",
    "church.label.complement": "Complemento",
    "church.cep.placeholder": "Ej.: 15000-000",
    "church.cep.invalid": "Ingresa un código postal válido.",
    "church.save": "Guardar",
    "church.saving": "Guardando…",
    "church.toast.saved": "Configuración guardada",
    "church.toast.error": "No se pudo guardar. Verifique los valores e inténtelo de nuevo.",
    "church.loading": "Cargando configuración",
    "profile.title": "Mi perfil",
    "profile.subtitle": "Mantén tus datos personales actualizados. El correo y el acceso los gestiona un administrador.",
    "profile.photoHint": "Haz clic en la foto para cambiarla.",
    "profile.section.personal": "Datos personales",
    "profile.section.password": "Cambiar contraseña",
    "profile.passwordHint": "Tras confirmar, tu sesión se cerrará y tendrás que entrar de nuevo.",
    "profile.field.currentPassword": "Contraseña actual",
    "profile.field.newPassword": "Nueva contraseña",
    "profile.field.confirmPassword": "Confirmar nueva contraseña",
    "profile.passwordMin": "La nueva contraseña debe tener al menos {min} caracteres.",
    "profile.passwordMinHint": "Al menos {min} caracteres.",
    "profile.passwordMismatch": "Las contraseñas no coinciden.",
    "profile.save": "Guardar cambios",
    "profile.saving": "Guardando…",
    "profile.requestChange": "Solicitar cambio de contraseña",
    "profile.confirm.title": "Confirmar cambio de contraseña",
    "profile.confirm.description": "Tu contraseña cambiará y todas tus sesiones se cerrarán. Tendrás que entrar de nuevo.",
    "profile.confirm.action": "Confirmar cambio",
    "profile.confirm.cancel": "Cancelar",
    "profile.confirm.changing": "Cambiando…",
    "profile.toast.saved": "Perfil actualizado",
    "profile.toast.saved.desc": "Tus datos fueron guardados.",
    "profile.toast.error": "No se pudieron guardar los cambios. Inténtalo de nuevo.",
    "profile.toast.passwordError": "No se pudo cambiar la contraseña. Verifica la contraseña actual e inténtalo de nuevo.",
    "profile.load.error": "No se pudo cargar tu perfil",
    "profile.load.retry": "Inténtalo de nuevo en unos instantes.",
    "profile.unavailable": "Perfil no disponible",
    "profile.unavailable.desc": "Tus datos no se pudieron cargar.",
    "profile.photo.upload": "Subir foto",
    "profile.photo.remove": "Quitar foto",
    "profile.photo.aria": "Cambiar foto",
    "profile.loading": "Cargando perfil",
    "profile.photo.aria.menu": "Abrir menú de la cuenta",
    "profile.photo.aria.change": "Cambiar foto de perfil",
    "profile.photo.removeShort": "Quitar",
    "profile.photo.toast.removeError": "No fue posible eliminar la foto.",
    "people.title": "Personas",
    "people.subtitle": "Consulta y gestiona a las personas de la iglesia.",
    "people.add": "Agregar persona",
    "people.import": "Importar personas",
    "people.search": "Buscar por nombre",
    "people.empty": "No se encontraron personas",
    "people.emptyState": "Aún no hay personas registradas.",
    "people.error": "No se pudieron cargar las personas",
    "people.loading": "Cargando personas",
    "people.column.name": "Nombre",
    "people.column.email": "Correo electrónico",
    "people.column.cell": "Célula",
    "people.column.status": "Estado",
    "people.column.actions": "Acciones",
    "people.import.title": "Importar personas",
    "people.import.subtitle": "Registra varias personas y, opcionalmente, vincúlalas a células por código.",
    "people.detail.title": "Detalle de la persona",
    "people.detail.section.info": "Información personal",
    "people.detail.section.contact": "Contacto",
    "people.detail.section.address": "Dirección",
    "people.detail.section.links": "Vínculos",
    "people.detail.withoutCell": "Sin célula",
    "people.detail.field.birthDate": "Fecha de nacimiento",
    "people.detail.field.notes": "Observaciones",
    "people.toast.updated": "Persona actualizada",
    "people.toast.error": "No se pudo guardar",
    "people.new.title": "Nueva persona",
    "people.new.subtitle": "Registra a una persona para acompañar su participación en las células.",
    "people.field.error.required": "Ingresa el nombre.",
    "people.field.error.email": "Ingresa un correo válido.",
    "cells.title": "Células",
    "cells.subtitle": "Consulta y gestiona las células de la iglesia y sus encuentros.",
    "cells.add": "Nueva célula",
    "cells.import": "Importar células",
    "cells.search": "Buscar células",
    "cells.filter.status": "Estado",
    "cells.filter.all": "Todas",
    "cells.filter.allStatuses": "Todos",
    "cells.filter.leader": "Líder",
    "cells.filter.supervisor": "Supervisor",
    "cells.filter.meetingDay": "Día del encuentro",
    "cells.filter.minMembers": "Mín. de miembros",
    "cells.filter.maxMembers": "Máx. de miembros",
    "cells.filter.allLeaders": "Todos los líderes",
    "cells.filter.allSupervisors": "Todos los supervisores",
    "cells.filter.allDays": "Todos los días",
    "cells.filter.filtersAria": "Filtros adicionales",
    "cells.empty": "No se encontraron células",
    "cells.emptyState": "Aún no tienes células registradas.",
    "cells.error": "No se pudieron cargar las células",
    "cells.loading": "Cargando células",
    "cells.column.cell": "Célula",
    "cells.column.day": "Día",
    "cells.column.time": "Hora",
    "cells.column.leader": "Líder",
    "cells.column.members": "Miembros",
    "cells.column.status": "Estado",
    "cells.column.actions": "Acciones",
    "cells.import.title": "Importar células",
    "cells.import.subtitle": "Registra células en formación o activas con datos ya preparados.",
    "cells.new.title": "Nueva célula",
    "cells.new.subtitle": "Crea una célula y define líder, día y hora del encuentro.",
    "cells.new.field.name": "Nombre de la célula",
    "cells.new.field.day": "Día de la semana",
    "cells.new.field.time": "Hora",
    "cells.new.field.address": "Dirección",
    "cells.new.field.status": "Estado",
    "cells.toast.created": "Célula creada",
    "cells.toast.error": "No se pudo crear la célula",
    "cells.detail.title": "Detalle de la célula",
    "cells.detail.newMeeting": "Nuevo encuentro",
    "cells.detail.print": "Imprimir informe",
    "cells.detail.section.info": "Información",
    "cells.detail.section.actions": "Acciones",
    "cells.detail.section.leader": "Líder",
    "cells.detail.section.members": "Miembros",
    "cells.detail.section.recentMeetings": "Encuentros recientes",
    "cells.members.loading": "Cargando miembros",
    "cells.members.empty": "No se encontraron miembros",
    "cells.members.empty.desc": "Agrega una persona a esta célula para acompañar su participación.",
    "cells.members.add": "Agregar miembro",
    "cells.members.add.title": "Agregar miembro",
    "cells.members.add.desc": "La persona pasa a formar parte de la célula. Si está activa en otra célula, será transferida automáticamente.",
    "cells.members.search": "Buscar persona",
    "cells.members.search.hint": "Escribe un nombre, teléfono o correo.",
    "cells.members.reason": "Motivo",
    "cells.members.reason.hint": "Obligatorio para líderes y pastores en la transferencia y la remoción.",
    "cells.members.reason.required": "Ingresa el motivo.",
    "cells.members.error.reasonRequired": "Líderes y pastores deben informar un motivo para la transferencia o remoción.",
    "cells.members.noCandidates": "No hay ninguna persona disponible para agregar.",
    "cells.members.searchFailed": "No se pudieron buscar personas.",
    "cells.members.transferHint": "Está en {cell} — será transferida",
    "cells.members.column.joined": "Ingresó el",
    "cells.members.remove": "Quitar",
    "cells.members.remove.title": "Quitar miembro",
    "cells.members.remove.desc": "El vínculo de {name} con esta célula se cerrará, sin eliminar a la persona.",
    "cells.members.toast.added": "Miembro agregado",
    "cells.members.toast.added.desc": "{name} ahora forma parte de esta célula.",
    "cells.members.toast.removed": "Miembro quitado",
    "cells.members.toast.removed.desc": "El vínculo de {name} con esta célula se cerró.",
    "cells.members.error.load": "No se pudieron cargar los miembros.",
    "cells.members.error.alreadyMember": "La persona ya es miembro activo de esta célula.",
    "cells.members.error.generic": "No se pudo completar la acción {action}.",
    "cells.members.status.all": "Todos",
    "cells.members.status.active": "Activo",
    "cells.members.status.inactive": "Inactivo",
    "cells.members.status.transferred": "Transferido",
    "cells.members.rowActions": "Acciones de {name}",
    "cells.detail.field.code": "Código",
    "cells.status.formative": "En formación",
    "cells.status.active": "Activa",
    "cells.status.suspended": "Suspendida",
    "cells.status.closed": "Cerrada",
    "cells.day.monday": "Lunes",
    "cells.day.tuesday": "Martes",
    "cells.day.wednesday": "Miércoles",
    "cells.day.thursday": "Jueves",
    "cells.day.friday": "Viernes",
    "cells.day.saturday": "Sábado",
    "cells.day.sunday": "Domingo",
    "cells.leader.label": "Líder",
    "cells.leader.none": "Ninguna persona disponible",
    "meetings.title": "Encuentros",
    "meetings.subtitle": "Acompaña y registra los encuentros de las células.",
    "meetings.add": "Nuevo encuentro",
    "meetings.empty": "Aún no hay encuentros registrados.",
    "meetings.emptyState": "Registra el primer encuentro de una célula.",
    "meetings.error": "No se pudieron cargar los encuentros",
    "meetings.loading": "Cargando encuentros",
    "meetings.column.date": "Fecha",
    "meetings.column.theme": "Tema",
    "meetings.column.participants": "Participantes",
    "meetings.column.status": "Estado",
    "meetings.column.actions": "Acciones",
    "meetings.new.title": "Nuevo encuentro",
    "meetings.new.subtitle": "Registra un encuentro para la célula.",
    "meetings.new.field.date": "Fecha",
    "meetings.new.field.time": "Hora",
    "meetings.new.field.theme": "Tema",
    "meetings.new.field.notes": "Observaciones",
    "meetings.toast.created": "Encuentro creado",
    "meetings.toast.error": "No se pudo crear el encuentro",
    "meetings.detail.title": "Detalle del encuentro",
    "meetings.detail.titleWithDate": "Encuentro - {date}",
    "meetings.detail.saveDate": "Guardar fecha",
    "meetings.detail.saving": "Guardando...",
    "meetings.detail.error.security": "No se pudo {action}. Es posible que el servidor lo haya rechazado por seguridad.",
    "meetings.detail.attendance": "Registrar asistencia",
    "meetings.detail.section.info": "Información",
    "meetings.detail.section.participants": "Participantes",
    "meetings.detail.section.report": "Informe",
    "meetings.detail.field.present": "Asistencias",
    "meetings.detail.field.visitors": "Visitantes",
    "meetings.status.scheduled": "Agendado",
    "meetings.status.completed": "Concluido",
    "meetings.status.cancelled": "Cancelado",
    "attendance.title": "Registrar asistencia",
    "attendance.present": "Presente",
    "attendance.absent": "Ausente",
    "attendance.excused": "Justificado",
    "attendance.unmarked": "Limpiar",
    "attendance.save": "Guardar asistencia",
    "attendance.saving": "Guardando…",
    "attendance.visitor.dialogTitle": "Agregar visitante",
    "attendance.visitor.dialogDescription": "Usa una persona existente o haz un registro rápido.",
    "attendance.visitor.source": "Origen",
    "attendance.visitor.sourceQuick": "Registro rápido",
    "attendance.visitor.sourceExisting": "Persona existente",
    "attendance.visitor.person": "Persona",
    "attendance.visitor.name": "Nombre",
    "attendance.visitor.phoneOptional": "Teléfono opcional",
    "attendance.visitor.invitedBy": "Convidado por",
    "attendance.visitor.notInformed": "No informado",
    "attendance.visitor.add": "Agregar",
    "attendance.toast.saved": "Asistencias guardadas",
    "attendance.toast.error": "No se pudieron guardar las asistencias",
    "analytics.title": "Indicadores",
    "analytics.legend": "Resumen de las próximas 4 semanas",
    "analytics.cellActive": "Células activas",
    "analytics.members": "Miembros",
    "analytics.meetingsMonth": "Encuentros del mes",
    "analytics.avgAttendance": "Asistencia media",
    "analytics.updated": "Actualizado {date}",
    "analytics.loading": "Cargando indicadores",
    "analytics.forbidden": "Su cuenta no tiene permiso para ver los indicadores.",
    "analytics.unavailable": "Indicadores no disponibles en este momento",
    "analytics.unavailable.desc": "No se pudieron cargar los indicadores del panel. Intente nuevamente en un momento.",
    "analytics.subtitle": "Salud de la iglesia — últimos 30 días",
    "analytics.empty": "Aún no hay indicadores",
    "analytics.empty.desc": "No hay datos suficientes para mostrar indicadores.",
    "analytics.people": "Personas",
    "analytics.forming": "formando",
    "analytics.attendanceRate": "Tasa de asistencia",
    "analytics.noData": "sin datos",
    "analytics.averagePresent": "Público medio",
    "analytics.completionRate": "Realización",
    "analytics.meetingsShort": "encuentros",
    "analytics.visitors": "Visitantes",
    "analytics.vsPrevious": "vs. anterior",
    "analytics.evolution": "Evolución mensual",
    "analytics.evolution.empty": "Sin serie mensual",
    "analytics.evolution.empty.desc": "Aún no hay encuentros en el período.",
    "analytics.meetingsChartAria": "Gráfico de encuentros por mes",
    "analytics.presentMembersShort": "presentes",
    "analytics.visitorsShort": "visitantes",
    "analytics.attendanceChartAria": "Gráfico de presentes y visitantes por mes",
    "analytics.cellAlerts": "Atención a las células",
    "analytics.emptyCells": "Sin células",
    "analytics.emptyCells.desc": "No se encontraron células para generar alertas.",
    "analytics.withoutRecentMeeting": "{count} célula(s) sin encuentro por {days} días",
    "analytics.clickToSeeCells": "Haga clic para ver las células.",
    "analytics.allRecent": "Todas las células activas realizaron encuentros recientes.",
    "analytics.last": "últ.",
    "analytics.noCompleteMeeting": "sin encuentro completo",
    "analytics.statusUnknown": "Estado desconocido",
    "users.title": "Usuarios",
    "users.subtitle": "Gestiona cuentas, roles y acceso.",
    "users.add": "Nuevo usuario",
    "users.import": "Importar usuarios",
    "users.search": "Buscar usuarios",
    "users.empty": "No se encontraron usuarios",
    "users.emptyState": "Aún no hay usuarios registrados.",
    "users.error": "No se pudieron cargar los usuarios",
    "users.loading": "Cargando usuarios",
    "users.column.user": "Usuario",
    "users.column.email": "Correo electrónico",
    "users.column.role": "Rol",
    "users.column.status": "Estado",
    "users.column.actions": "Acciones",
    "users.import.title": "Importar usuarios",
    "users.import.subtitle": "Crea cuentas en lote indicando la contraseña inicial y los nombres de los roles de acceso.",
    "users.new.title": "Nuevo usuario",
    "users.new.field.password": "Contraseña inicial",
    "users.new.field.confirmPassword": "Confirmar contraseña",
    "users.new.passwordMin": "La contraseña debe tener al menos 12 caracteres.",
    "users.new.create": "Crear usuario",
    "users.detail.title": "Detalle del usuario",
    "users.detail.field.phone": "Teléfono",
    "users.detail.field.createdAt": "Creado en",
    "users.detail.activate": "Activar",
    "users.detail.deactivate": "Desactivar",
    "users.detail.resetPassword": "Restablecer contraseña",
    "users.toast.created": "Usuario creado",
    "users.toast.updated": "Usuario actualizado",
    "users.toast.error": "No se pudo guardar",
    "users.strength.label": "Fortaleza de la contraseña",
    "users.strength.weak": "Débil",
    "users.strength.fair": "Media",
    "users.strength.strong": "Fuerte",
    "users.strength.veryWeak": "Muy débil",
    "users.strength.good": "Buena",
    "users.strength.empty": "Escribe una contraseña",
    "users.strength.require.length": "Al menos 12 caracteres",
    "users.strength.require.alphanum": "Letras y números",
    "reports.title": "Informes",
    "reports.subtitle": "Acompaña métricas y pendientes del ministerio de células.",
    "reports.loading": "Cargando informes",
    "reports.card.visitors": "Visitantes",
    "reports.card.meetings": "Encuentros",
    "reports.card.attendance": "Asistencia",
    "reports.card.pending": "Pendientes",
    "reports.visitors.title": "Informe de visitantes",
    "reports.visitors.empty": "Ningún visitante en el período",
    "reports.visitors.column.visitor": "Visitante",
    "reports.visitors.column.cell": "Célula",
    "reports.visitors.column.meeting": "Encuentro",
    "reports.visitors.column.date": "Fecha",
    "reports.visitors.column.status": "Estado",
    "reports.visitors.column.invitedBy": "Convidado por",
    "reports.pending.title": "Pendientes de informe",
    "reports.pending.column.cell": "Célula",
    "reports.pending.column.leader": "Líder",
    "reports.pending.column.meeting": "Encuentro",
    "reports.pending.column.deadline": "Plazo",
    "reports.pending.column.status": "Estado",
    "reports.pending.status.pending": "Pendiente",
    "reports.pending.status.onTime": "A tiempo",
    "reports.pending.status.late": "Atrasado",
    "reports.pending.link": "Registrar ahora",
    "reports.pending.empty": "Sin pendientes",
    "reports.meetings.title": "Informe de encuentros",
    "reports.meetings.column.date": "Fecha",
    "reports.meetings.column.cell": "Célula",
    "reports.meetings.column.theme": "Tema",
    "reports.meetings.column.participants": "Participantes",
    "reports.meetings.column.visitors": "Visitantes",
    "reports.attendance.title": "Informe de asistencia",
    "reports.attendance.column.person": "Persona",
    "reports.attendance.column.present": "Presente",
    "reports.attendance.column.absent": "Ausente",
    "reports.attendance.column.excused": "Justificado",
    "reports.attendance.column.percentage": "Porcentaje",
    "reports.attendance.details": "Detalles",
    "reports.attendanceDetail.title": "Detalles de asistencia",
    "reports.attendanceDetail.column.person": "Persona",
    "reports.attendanceDetail.column.status": "Estado",
    "reports.attendanceDetail.column.marked": "Marcado",
    "reports.attendanceDetail.empty": "Ningún registro en esta fecha",
    "reports.export.csv": "Exportar CSV",
    "reports.export.exporting": "Exportando…",
    "reports.export.aria": "Exportar informe",
    "reports.export.language": "Idioma del informe",
    "reports.period.default": "Predeterminado (30 días)",
    "reports.period.last30": "Últimos 30 días",
    "reports.period.last60": "Últimos 60 días",
    "reports.period.thisMonth": "Este mes",
    "bulk.label.file": "Archivo CSV",
    "bulk.label.fileField": "Archivo",
    "bulk.label.downloadModel": "Descargar plantilla",
    "bulk.label.structure": "Estructura del archivo",
    "bulk.label.send": "Enviar archivo",
    "bulk.label.sending": "Enviando…",
    "bulk.label.submit": "Importar",
    "bulk.success": "Importación completada con éxito.",
    "bulk.imported": "{count} registros importados",
    "bulk.errorRows": "Error en {count} líneas",
    "bulk.downloadErrors": "Descargar errores",
    "bulk.guide.title": "Cómo importar",
    "bulk.guide.step1": "1. Descarga la plantilla",
    "bulk.guide.step2": "2. Llena los datos",
    "bulk.guide.step3": "3. Envía el archivo",
    "bulk.guide.note.cellCode": "Código de la célula",
    "bulk.guide.note.roles": "Roles permitidos",
    "bulk.guide.note.initialPassword": "Contraseña inicial",
    "bulk.guide.eyebrow": "Guía de importación",
    "bulk.guide.heading": "Cómo preparar el archivo",
    "bulk.guide.intro": "La importación acepta un archivo a la vez, de máximo 5 MB y 2.000 filas. Los registros válidos entran a la iglesia de tu sesión; cada fila inválida aparece en el resultado sin bloquear a las demás.",
    "bulk.guide.stepDownload": "Descarga la plantilla CSV en el formulario de abajo y mantén los nombres de las columnas exactamente iguales.",
    "bulk.guide.stepFill": "Completa una fila por cada registro. Deja vacíos los campos opcionales cuando no haya información.",
    "bulk.guide.stepSend": "Envía el archivo y revisa la tabla Resultado por fila. Corrige solo las filas con error y envía nuevamente solo esas filas.",
    "bulk.guide.namesAlertTitle": "Nombres exactos, sin columnas extras",
    "bulk.guide.namesAlertDesc": "Excel, CSV y JSON usan exactamente los nombres de esta tabla. Cualquier columna o campo desconocido invalida la fila.",
    "bulk.guide.columnsTitle": "Columnas aceptadas",
    "bulk.guide.columnsTableLabel": "Columnas aceptadas para importar {records}",
    "bulk.guide.column.name": "Columna",
    "bulk.guide.column.requirement": "Obligatoriedad",
    "bulk.guide.column.guidance": "Cómo completar",
    "bulk.guide.daysTitle": "Códigos de los días de la semana",
    "bulk.guide.formatsTitle": "Formato del archivo",
    "bulk.guide.format.excel.label": "Excel",
    "bulk.guide.format.excel.body": "usa la primera pestaña. La primera fila debe contener los nombres exactos de las columnas. Cada fila siguiente es un registro. Ignora filas en blanco y no incluyas títulos, totales ni celdas combinadas. Escribe horarios como texto y fechas como AAAA-MM-DD.",
    "bulk.guide.format.csv.label": "CSV",
    "bulk.guide.format.csv.body": "la primera fila debe contener los nombres exactos de las columnas. Separa los valores con comas y guarda en UTF-8. Pon entre comillas cualquier valor con coma o salto de línea. Deja vacíos los campos opcionales.",
    "bulk.guide.format.json.label": "JSON",
    "bulk.guide.format.json.intro": "envía una lista de objetos o un objeto con la clave ",
    "bulk.guide.format.json.keys": ". Usa exactamente los nombres de las columnas como claves y omite los campos opcionales en vez de usar ",
    "bulk.guide.format.json.count": ". La cuenta comienza en la primera fila de datos; el encabezado no cuenta.",
    "bulk.guide.jsonExample": "Ejemplo JSON para importar {records}",
    "bulk.guide.afterTitle": "Después del envío",
    "bulk.guide.afterDesc": "{rule} Solo se crean registros nuevos; envía nuevamente solo las filas corregidas para no duplicar registros.",
    "bulk.guide.records.people": "personas",
    "bulk.guide.records.cells": "células",
    "bulk.guide.records.users": "usuarios",
    "bulk.guide.permission.adminPastor": "Disponible para administradores y pastores.",
    "bulk.guide.permission.adminOnly": "Disponible solo para administradores.",
    "bulk.guide.duplicate.people": "Los teléfonos, correos o nombres con fecha de nacimiento repetidos generan un error en la fila correspondiente.",
    "bulk.guide.duplicate.cells": "Un código repetido en el archivo o ya existente en la iglesia genera un error en la fila correspondiente.",
    "bulk.guide.duplicate.users": "Un correo repetido genera un error en la fila correspondiente.",
    "bulk.guide.rolesNote": "En la plantilla o CSV, separa los roles con |, p. ej. ADMIN|PASTOR. Si usas coma dentro del CSV, pon el valor entre comillas. En JSON, usa una lista, p. ej. [\"LEADER\"].",
    "bulk.guide.req.requiredF": "Obligatoria",
    "bulk.guide.req.requiredM": "Obligatorio",
    "bulk.guide.req.optional": "Opcional",
    "bulk.guide.req.conditional": "Condicional",
    "bulk.guide.day.monday": "lunes",
    "bulk.guide.day.tuesday": "martes",
    "bulk.guide.day.wednesday": "miércoles",
    "bulk.guide.day.thursday": "jueves",
    "bulk.guide.day.friday": "viernes",
    "bulk.guide.day.saturday": "sábado",
    "bulk.guide.day.sunday": "domingo",
    "bulk.guide.col.people.fullName": "Nombre completo, de máximo 200 caracteres. Se ajustan los espacios sobrantes.",
    "bulk.guide.col.people.phone": "Teléfono internacional que empieza con +, p. ej. +5511999999999. Déjalo vacío para omitirlo.",
    "bulk.guide.col.people.email": "Correo válido. El sistema lo convierte a minúsculas.",
    "bulk.guide.col.people.birthDate": "Fecha en formato AAAA-MM-DD, p. ej. 1990-05-20. No uses una fecha futura.",
    "bulk.guide.col.people.gender": "Texto libre de máximo 50 caracteres, p. ej. Femenino.",
    "bulk.guide.col.people.observations": "Texto de 1 a 10.000 caracteres cuando esté completado. Déjalo vacío para omitirlo.",
    "bulk.guide.col.people.cellCode": "Código de una célula existente en la misma iglesia, p. ej. CEL-001. Crea el vínculo activo; un código inexistente reprobó la fila.",
    "bulk.guide.col.cells.code": "Código de máximo 50 caracteres. Los acentos y espacios se vuelven guiones y todo queda en mayúsculas, p. ej. CEL-001.",
    "bulk.guide.col.cells.name": "Nombre de la célula, de máximo 160 caracteres.",
    "bulk.guide.col.cells.status": "Usa FORMING, ACTIVE o SUSPENDED. Sin valor, la célula nace en formación. ACTIVE exige líder y supervisor.",
    "bulk.guide.col.cells.leaderId": "Identificador interno del usuario líder, no el nombre ni el correo. Obligatorio para ACTIVE. Sin el identificador, importa como FORMING y asigna después.",
    "bulk.guide.col.cells.supervisorId": "Identificador interno del usuario supervisor. Obligatorio para ACTIVE y omitido para FORMING sin liderazgo.",
    "bulk.guide.col.cells.traineeLeaderId": "Identificador interno del líder en capacitación. Déjalo vacío cuando no haya.",
    "bulk.guide.col.cells.meetingDay": "Código exacto del día en inglés en mayúsculas, p. ej. WEDNESDAY.",
    "bulk.guide.col.cells.meetingTime": "Horario en formato 24 horas HH:MM, p. ej. 19:30. En la plantilla, escríbelo como texto.",
    "bulk.guide.col.cells.address": "Dirección de máximo 500 caracteres.",
    "bulk.guide.col.users.firstName": "Nombre de máximo 100 caracteres.",
    "bulk.guide.col.users.lastName": "Apellido de máximo 100 caracteres.",
    "bulk.guide.col.users.email": "Correo válido y único. El sistema lo convierte a minúsculas.",
    "bulk.guide.col.users.initialPassword": "Contraseña de 12 a 128 caracteres, con mayúscula, minúscula, número y símbolo.",
    "bulk.guide.col.users.roles": "De 1 a 4 nombres diferentes entre ADMIN, PASTOR, SUPERVISOR y LEADER. Indica nombres de roles, no identificadores.",
    "users.import.label.initialPassword": "Contraseña inicial",
    "users.import.label.roleNames": "Nombres de los roles de acceso",
    "people.column.phone": "Teléfono",
    "people.column.birthDate": "Nacimiento",
    "people.column.gender": "Género",
    "people.filter.all": "Todos",
    "people.filter.active": "Activo",
    "people.filter.inactive": "Inactivo",
    "people.gender.male": "Masculino",
    "people.gender.female": "Femenino",
    "people.gender.other": "Otro",
    "people.field.gender": "Género",
    "people.search.hint": "Nombre, correo o teléfono",
    "people.sort.label": "Ordenar por",
    "people.sort.nameAsc": "Nombre (A–Z)",
    "people.sort.nameDesc": "Nombre (Z–A)",
    "people.sort.birthDateDesc": "Nacimiento (más reciente)",
    "people.sort.birthDateAsc": "Nacimiento (más antiguo)",
    "people.sort.createdAtDesc": "Registros más recientes",
    "people.sort.createdAtAsc": "Registros más antiguos",
    "people.action.clearFilters": "Limpiar filtros",
    "people.action.reactivate": "Reactivar",
    "people.action.viewDetails": "Ver detalles",
    "people.emptyState.desc": "Ajusta los filtros o registra una nueva persona.",
    "people.error.retry": "Inténtalo en unos instantes.",
    "people.alert.success": "Éxito",
    "people.alert.failure": "Fallo",
    "people.toast.reactivated": "Persona reactivada",
    "people.toast.reactivated.desc": "{name} volvió a participar en la iglesia.",
    "people.toast.reactivateError": "No fue posible reactivar a la persona. Inténtalo de nuevo.",
    "people.detail.loading": "Cargando persona",
    "people.error.load": "No fue posible cargar la persona",
    "people.detail.empty": "Persona no encontrada",
    "people.detail.empty.desc": "La persona solicitada no existe o no está disponible.",
    "people.toast.noChange": "Sin cambios",
    "people.toast.noChange.desc": "No había datos nuevos para guardar.",
    "people.detail.saved.desc": "Los datos fueron guardados.",
    "people.detail.error.save": "No fue posible guardar los cambios. Revisa los datos e inténtalo de nuevo.",
    "people.detail.error.invalidDate": "Ingresa una fecha válida en formato DD/MM/AAAA.",
    "people.toast.inactivated": "Persona inactivada",
    "people.toast.inactivated.desc": "Solo aparecerá en la lista para los administradores.",
    "people.detail.error.inactivate": "No fue posible inactivar a la persona. Inténtalo de nuevo.",
    "people.detail.back": "Volver a personas",
    "people.detail.label.gender": "Género",
    "people.detail.label.registration": "Registro",
    "people.detail.edit": "Editar datos",
    "people.detail.field.fullName": "Nombre completo",
    "people.detail.saveChanges": "Guardar cambios",
    "people.detail.inactivatePerson": "Inactivar persona",
    "people.detail.inactivate.title": "Inactivar persona",
    "people.detail.inactivate.desc": "La persona dejará de aparecer en los listados y no podrá vincularse a células mientras esté inactiva. Puedes reactivarla desde el listado.",
    "people.detail.inactivate.inactivating": "Inactivando…",
    "people.detail.inactivate.action": "Inactivar",
    "people.toast.created": "Persona registrada",
    "people.new.description": "Completa los datos de contacto e identificación.",
    "people.new.legend.identification": "Identificación",
    "people.new.legend.contact": "Contacto",
    "people.new.legend.observations": "Observaciones",
    "people.new.hint.name": "Nombre y apellido, p. ej.: María da Silva.",
    "people.new.hint.gender": "P. ej.: Femenino, Masculino o como se identifique la persona.",
    "people.new.hint.email": "Se normalizará a minúsculas.",
    "people.new.hint.phone": "Formato brasileño, p. ej.: (11) 99999-9999.",
    "people.new.hint.observations": "Información adicional. Visible para administradores y pastores.",
    "people.new.submit": "Registrar persona",
    "people.new.submitting": "Registrando…",
    "people.new.error.duplicate": "Ya existe una persona activa con datos similares. Revisa el registro antes de continuar.",
    "people.new.error.generic": "No fue posible registrar la persona. Revisa los datos e inténtalo de nuevo.",
    "people.new.error.invalidDate": "Ingresa una fecha de nacimiento válida en formato DD/MM/AAAA.",
    "cells.page.subtitle": "Consulta, registra y acompaña las células de tu iglesia.",
    "cells.action.clearFilters": "Limpiar filtros",
    "cells.error.retry": "Inténtalo en unos instantes.",
    "cells.emptyState.desc": "Ajusta los filtros o registra una nueva célula.",
    "cells.column.code": "Código",
    "cells.column.supervisor": "Supervisor",
    "cells.column.meeting": "Reunión",
    "cells.action.viewDetails": "Ver detalles",
    "cells.search.hint": "Nombre o código",
    "cells.detail.loading": "Cargando célula",
    "cells.error.load": "No fue posible cargar la célula",
    "cells.detail.empty": "Célula no encontrada",
    "cells.detail.empty.desc": "La célula solicitada no existe.",
    "cells.detail.error.form": "Revisa los datos modificados.",
    "cells.detail.toast.updated": "Célula actualizada",
    "cells.detail.toast.saved.desc": "Los datos fueron guardados.",
    "cells.detail.toast.activated": "Célula activada",
    "cells.detail.toast.suspended": "Célula suspendida",
    "cells.detail.toast.activated.desc": "La célula volvió a funcionar.",
    "cells.detail.toast.suspended.desc": "La célula quedó suspendida.",
    "cells.detail.toast.leadership": "Liderazgo actualizado",
    "cells.detail.toast.leadership.desc": "Los nuevos vínculos fueron guardados.",
    "cells.detail.toast.trainee": "Líder en formación actualizado",
    "cells.detail.toast.trainee.desc": "El vínculo fue guardado.",
    "cells.detail.error.leaderRequired": "Selecciona el líder y el supervisor.",
    "cells.detail.status.suspend": "Suspender célula",
    "cells.detail.status.activate": "Activar célula",
    "cells.detail.status.reactivate": "Reactivar célula",
    "cells.detail.status.suspend.desc": "La célula quedará suspendida y seguirá visible en el historial.",
    "cells.detail.status.activate.desc": "La célula volverá al estado activo. Las células activas requieren líder.",
    "cells.detail.back": "Volver a células",
    "cells.detail.viewMeetings": "Ver encuentros",
    "cells.detail.label.supervisor": "Supervisor",
    "cells.detail.label.trainee": "Líder en formación",
    "cells.detail.label.meeting": "Reunión",
    "cells.detail.label.address": "Dirección",
    "cells.detail.label.created": "Creada el",
    "cells.detail.label.updated": "Actualizada el",
    "cells.detail.edit": "Editar datos",
    "cells.detail.field.name": "Nombre",
    "cells.detail.field.meetingDay": "Día de la reunión",
    "cells.detail.field.time": "Horario",
    "cells.detail.field.address": "Dirección",
    "cells.detail.time.hint": "Formato HH:mm, p. ej.: 19:30.",
    "cells.detail.saveChanges": "Guardar cambios",
    "cells.detail.suspend": "Suspender célula",
    "cells.detail.changeLeader": "Cambiar líder",
    "cells.detail.changeTrainee": "Cambiar líder en formación",
    "cells.detail.removeTrainee": "Quitar líder en formación",
    "cells.detail.assignTrainee": "Asignar líder en formación",
    "cells.detail.noManage": "No tienes permiso para gestionar esta célula.",
    "cells.detail.dialog.confirming": "Confirmando…",
    "cells.detail.dialog.confirm": "Confirmar",
    "cells.detail.dialog.changeLeader.title": "Cambiar líder",
    "cells.detail.dialog.changeLeader.desc": "El nuevo líder y el supervisor deben estar activos y en la misma iglesia.",
    "cells.detail.dialog.trainee.title": "Líder en formación",
    "cells.detail.dialog.trainee.desc": "Selecciona el usuario en formación o limpia para quitarlo.",
    "cells.detail.dialog.removeTrainee.title": "Quitar líder en formación",
    "cells.detail.dialog.removeTrainee.desc": "El usuario dejará de ser líder en formación de esta célula.",
    "cells.detail.dialog.removeTrainee.confirm": "Confirmar eliminación",
    "cells.detail.error.codeConflict": "Ya existe otra célula con este código.",
    "cells.detail.error.leaderNotEligible": "El líder seleccionado no es elegible.",
    "cells.detail.error.supervisorConflict": "El supervisor seleccionado ya supervisa a otro líder.",
    "cells.detail.error.candidateNotFound": "El candidato seleccionado no está disponible.",
    "cells.detail.error.transitionInvalid": "El cambio de estado no está permitido en este momento. Las células activas requieren líder.",
    "cells.detail.error.generic": "No fue posible {action}. El servidor puede haberlo rechazado por seguridad.",
    "cells.action.saveChanges": "guardar los cambios",
    "cells.action.changeStatus": "cambiar el estado",
    "cells.action.changeLeadership": "cambiar el liderazgo",
    "cells.action.changeTrainee": "cambiar el líder en formación",
    "cells.create.error.generic": "No fue posible crear la célula. Revisa los datos e inténtalo de nuevo.",
    "cells.create.error.codeConflict": "Ya existe una célula con este código.",
    "cells.create.error.leaderNotEligible": "El líder seleccionado no es elegible para liderar la célula.",
    "cells.create.error.supervisorConflict": "El supervisor seleccionado ya supervisa a otro líder.",
    "cells.create.error.candidateNotFound": "El líder o supervisor seleccionado no está disponible.",
    "cells.create.error.idempotency": "El intento anterior entró en conflicto con otro. Inténtalo de nuevo.",
    "cells.create.legend.identification": "Identificación",
    "cells.create.legend.leadership": "Liderazgo",
    "cells.create.legend.meeting": "Reunión y lugar",
    "cells.create.hint.code": "P. ej.: CEL-001. Letras mayúsculas y guiones.",
    "cells.create.hint.name": "P. ej.: Célula Esperanza.",
    "cells.create.hint.status": "Activa requiere líder y supervisor elegibles.",
    "cells.create.hint.leader": "Busca por nombre de usuario.",
    "cells.create.hint.supervisor": "Busca por nombre de usuario.",
    "cells.create.hint.trainee": "Opcional. Busca por nombre de usuario.",
    "cells.create.hint.time": "Formato HH:mm, p. ej.: 19:30.",
    "cells.create.hint.address": "Lugar donde se reúne la célula.",
    "cells.create.submit": "Crear célula",
    "cells.create.submitting": "Creando…",
    "cells.create.alertTitle": "No fue posible crear",
    "cells.assignment.loadError": "No fue posible cargar las opciones.",
    "cells.assignment.noCandidates": "No se encontraron candidatos.",
    "cells.assignment.clearLabel": "Limpiar {label}",
    "cells.assignment.optionsLabel": "Opciones de {label}",
    "meetings.page.subtitle": "Gestiona los encuentros programados de la célula.",
    "meetings.action.clearFilters": "Limpiar filtros",
    "meetings.error.retry": "Inténtalo en unos instantes.",
    "meetings.emptyState.desc": "Ajusta los filtros o programa un nuevo encuentro.",
    "meetings.column.updatedAt": "Actualizado el",
    "meetings.action.viewDetails": "Ver detalles",
    "meetings.filter.all": "Todos",
    "meetings.field.from": "Fecha inicio",
    "meetings.field.to": "Fecha fin",
    "meetings.date.hint": "AAAA-MM-DD",
    "meetings.detail.loading": "Cargando encuentro",
    "meetings.error.load": "No fue posible cargar el encuentro",
    "meetings.detail.empty": "Encuentro no encontrado",
    "meetings.detail.empty.desc": "El encuentro solicitado no existe.",
    "meetings.detail.dateError": "Fecha inválida.",
    "meetings.detail.toast.dateUpdated": "Fecha actualizada",
    "meetings.detail.toast.dateUpdated.desc": "El encuentro fue reprogramado.",
    "meetings.detail.toast.observations": "Observaciones guardadas",
    "meetings.detail.toast.observations.desc": "El informe fue actualizado.",
    "meetings.detail.toast.completed": "Encuentro concluido",
    "meetings.detail.toast.completed.desc": "La asistencia sigue accesible desde el historial.",
    "meetings.detail.toast.cancelled": "Encuentro cancelado",
    "meetings.detail.toast.cancelled.desc": "El historial fue preservado.",
    "meetings.detail.error.reason": "Indica el motivo de la cancelación.",
    "meetings.detail.back": "Volver a encuentros",
    "meetings.detail.label.cell": "Célula",
    "meetings.detail.label.cancelReason": "Motivo de la cancelación",
    "meetings.detail.label.created": "Creado el",
    "meetings.detail.label.updated": "Actualizado el",
    "meetings.detail.openAttendance": "Abrir asistencia",
    "meetings.detail.editDate": "Editar fecha",
    "meetings.detail.observations": "Observaciones",
    "meetings.detail.observations.placeholder": "Observaciones sobre el encuentro...",
    "meetings.detail.saveObservations": "Guardar observaciones",
    "meetings.detail.completeMeeting": "Concluir encuentro",
    "meetings.detail.cancelMeeting": "Cancelar encuentro",
    "meetings.detail.dialog.complete.title": "Concluir encuentro",
    "meetings.detail.dialog.complete.desc": "El encuentro se marcará como concluido y ya no podrá editarse.",
    "meetings.detail.dialog.cancel.title": "Cancelar encuentro",
    "meetings.detail.dialog.cancel.desc": "Indica el motivo de la cancelación. El encuentro se cancelará definitivamente.",
    "meetings.detail.dialog.cancel.placeholder": "Motivo de la cancelación...",
    "meetings.detail.dialog.cancel.back": "Volver",
    "meetings.detail.dialog.cancel.confirm": "Confirmar cancelación",
    "meetings.detail.dialog.cancelling": "Cancelando...",
    "meetings.detail.dialog.confirming": "Confirmando...",
    "meetings.detail.error.generic": "No fue posible {action}. Inténtalo de nuevo.",
    "meetings.action.updateDate": "actualizar la fecha",
    "meetings.action.saveObservations": "guardar observaciones",
    "meetings.action.completeMeeting": "concluir el encuentro",
    "meetings.action.cancelMeeting": "cancelar el encuentro",
    "meetings.detail.error.notEditable": "El encuentro no puede editarse porque ya fue concluido o cancelado.",
    "meetings.detail.error.transitionInvalid": "El cambio de estado no está permitido en este momento.",
    "meetings.detail.error.reportNotEditable": "No es posible editar observaciones de un encuentro cancelado.",
    "meetings.detail.error.dateConflict": "Ya existe un encuentro programado para esta fecha.",
    "meetings.new.legend.date": "Fecha del encuentro",
    "meetings.new.hint.date": "Formato AAAA-MM-DD",
    "meetings.new.submit": "Crear encuentro",
    "meetings.new.submitting": "Creando…",
    "meetings.new.alertTitle": "No fue posible crear",
    "meetings.new.error.generic": "No fue posible crear el encuentro. Revisa los datos e inténtalo de nuevo.",
    "meetings.new.error.dateConflict": "Ya existe un encuentro programado para esta célula en esta fecha.",
    "meetings.new.error.cellNotFound": "La célula informada no fue encontrada.",
    "meetings.new.error.cellStatusInvalid": "La célula debe estar activa para programar encuentros.",
    "meetings.new.error.accessDenied": "No tienes permiso para crear encuentros en esta célula.",
    "meetings.new.error.transitionInvalid": "Cambio de estado no permitido para este encuentro.",
    "meetings.new.error.notEditable": "Este encuentro ya no puede editarse.",
    "meetings.new.error.reportNotEditable": "No es posible editar el informe de un encuentro cancelado.",
    "meetings.new.error.retryExhausted": "Demasiados intentos simultáneos. Espera un momento e inténtalo de nuevo.",
    "meetings.new.error.idempotency": "El intento anterior entró en conflicto con otro. Inténtalo de nuevo.",
    "attendance.detail.summary": "Resumen de asistencia",
    "attendance.search": "Buscar participante",
    "attendance.summary.present": "presentes",
    "attendance.summary.absent": "ausentes",
    "attendance.summary.excused": "justificados",
    "attendance.summary.unmarked": "no marcados",
    "attendance.summary.visitors": "visitantes",
    "attendance.back": "Volver al encuentro",
    "attendance.alertTitle": "Asistencia",
    "attendance.skipChanges": "¿Descartar cambios no guardados?",
    "attendance.skipChanges.confirm": "¿Descartar cambios no guardados?",
    "attendance.forbidden": "Acceso denegado",
    "attendance.forbidden.desc": "No tienes acceso a la asistencia de este encuentro.",
    "attendance.unavailable": "Asistencia no disponible en este momento",
    "attendance.unavailable.desc": "No fue posible consultar los datos de este encuentro. Inténtalo en unos instantes.",
    "attendance.notAvailable": "Asistencia aún no disponible",
    "attendance.notAvailable.desc": "No hay datos de asistencia disponibles para este encuentro.",
    "attendance.loading": "Cargando asistencia",
    "attendance.conflict": "Asistencia",
    "attendance.pageTitle": "Asistencia",
    "attendance.saveFrequency": "Guardar asistencia",
    "attendance.toast.savedTitle": "Asistencia guardada",
    "attendance.conflict.message": "Otra persona modificó la asistencia. Tus marcaciones se conservaron; recarga la base para comparar antes de guardar de nuevo.",
    "attendance.detail.visitors": "Visitantes",
    "attendance.conflict.reload": "Recargar base para comparar",
    "attendance.conflict.updated": "La base fue actualizada. Revisa tus marcaciones preservadas antes de guardar.",
    "attendance.readOnlyTitle": "Solo lectura",
    "attendance.readOnlyDesc": "Este encuentro fue cancelado. El historial fue preservado.",
    "attendance.searchParticipant": "Buscar participante",
    "attendance.addVisitor": "Agregar visitante",
    "attendance.noParticipantFound": "Ningún participante encontrado",
    "attendance.noParticipantFound.desc": "No encontramos participantes elegibles con ese nombre.",
    "attendance.noEligibleParticipants": "Ningún participante elegible",
    "attendance.noEligibleParticipants.desc": "Esta célula no tiene participantes elegibles en la fecha del encuentro.",
    "attendance.personFrequency": "Asistencia de {name}",
    "attendance.contactPending": "contacto pendiente",
    "attendance.removeVisitorConfirm": "¿Quitar este visitante del encuentro?",
    "attendance.removeVisitor": "Quitar",
    "attendance.discardChanges": "Descartar cambios",
    "attendance.unsaved": "Cambios no guardados",
    "attendance.observation": "Observación",
    "attendance.toast.saved.desc": "Las marcaciones fueron registradas.",
    "attendance.error.save": "No fue posible guardar. Tus cambios fueron preservados.",
    "attendance.error.addVisitor": "No fue posible agregar el visitante.",
    "attendance.visitor.observation": "Observación",
    "users.page.subtitle": "Gestiona cuentas, roles y acceso de los usuarios de tu iglesia.",
    "users.action.clearFilters": "Limpiar filtros",
    "users.error.retry": "Inténtalo en unos instantes.",
    "users.emptyState.desc": "Ajusta los filtros o registra un nuevo usuario.",
    "users.action.viewDetails": "Ver detalles",
    "users.search.hint": "Nombre o correo",
    "users.filter.all": "Todos",
    "users.column.roles": "Roles",
    "users.field.role": "Rol",
    "users.detail.loading": "Cargando usuario",
    "users.error.load": "No fue posible cargar el usuario",
    "users.detail.empty": "Usuario no encontrado",
    "users.detail.empty.desc": "El usuario solicitado no existe.",
    "users.detail.back": "Volver a usuarios",
    "users.detail.edit": "Editar datos",
    "users.detail.saveChanges": "Guardar cambios",
    "users.detail.toast.updated.desc": "Los datos fueron guardados.",
    "users.detail.error.save": "No fue posible guardar los cambios. Revisa los datos e inténtalo de nuevo.",
    "users.detail.toast.activated": "Usuario activado",
    "users.detail.toast.activated.desc": "Ya puede entrar al panel.",
    "users.detail.toast.blocked": "Usuario bloqueado",
    "users.detail.toast.blocked.desc": "Ya no podrá entrar.",
    "users.detail.toast.roles": "Roles actualizados",
    "users.detail.toast.roles.desc": "Los permisos fueron reemplazados.",
    "users.detail.toast.password": "Contraseña restablecida",
    "users.detail.toast.password.desc": "Comparte la nueva contraseña con el usuario por un canal seguro.",
    "users.detail.roles.legend": "Roles",
    "users.detail.roles.hint": "El cambio exige confirmación y puede afectar permisos.",
    "users.detail.saveRoles": "Guardar roles",
    "users.detail.blockUser": "Bloquear usuario",
    "users.detail.activateUser": "Activar usuario",
    "users.detail.dialog.block.title": "Bloquear usuario",
    "users.detail.dialog.activate.title": "Activar usuario",
    "users.detail.dialog.roles.title": "Reemplazar roles",
    "users.detail.dialog.reset.title": "Restablecer contraseña",
    "users.detail.dialog.block.desc": "El usuario ya no podrá entrar mientras esté bloqueado.",
    "users.detail.dialog.activate.desc": "El usuario volverá a poder entrar.",
    "users.detail.dialog.roles.desc": "Los roles actuales serán reemplazados por los seleccionados. Confirma antes de continuar.",
    "users.detail.dialog.reset.desc": "La contraseña actual será reemplazada de inmediato.",
    "users.detail.dialog.newPassword": "Nueva contraseña",
    "users.detail.dialog.passwordHint": "Al menos {min} caracteres.",
    "users.detail.dialog.confirming": "Confirmando…",
    "users.detail.error.lastAdmin": "No es posible concluir la operación porque este es el último administrador activo de la iglesia.",
    "users.detail.error.emailConflict": "Ya existe un usuario con este correo.",
    "users.detail.error.generic": "No fue posible concluir la operación. El servidor puede haberlo rechazado por seguridad.",
    "users.modal.roles": "Roles",
    "users.modal.noRoles": "Ningún rol asignado",
    "users.modal.accountInfo": "Información de la cuenta",
    "users.modal.createdAt": "Creado el",
    "users.modal.updatedAt": "Última actualización",
    "users.modal.photo": "Foto de perfil",
    "users.modal.photoSet": "Registrada",
    "users.modal.photoNotSet": "No registrada",
    "users.modal.userId": "ID del usuario",
    "users.modal.openPage": "Abrir página completa",
    "users.new.legend.access": "Datos de acceso",
    "users.new.hint.password": "Comparte la contraseña inicial con el usuario por un canal seguro.",
    "users.new.error.roles": "Selecciona al menos un rol.",
    "users.new.error.password": "Usa una contraseña que cumpla todos los requisitos de seguridad.",
    "users.new.submit": "Crear usuario",
    "users.new.submitting": "Creando…",
    "users.new.error.emailConflict": "Ya existe un usuario con este correo.",
    "users.new.error.generic": "No fue posible crear el usuario. Revisa los datos e inténtalo de nuevo.",
    "users.new.alertTitle": "No fue posible crear",
    "users.new.toast.created.desc": "{name} ahora tiene acceso al panel.",
    "users.new.legend.roles": "Roles",
    "users.new.noRoles": "Ningún rol disponible",
    "users.new.noRoles.desc": "No hay roles gestionables para asignar.",
    "users.loading.roles": "Cargando roles",
    "users.error.loadRoles": "No fue posible cargar los roles",
    "users.strength.require.uppercase": "Una letra mayúscula",
    "users.strength.require.lowercase": "Una letra minúscula",
    "users.strength.require.number": "Un número",
    "users.strength.require.special": "Un carácter especial",
    "users.strength.require.aria": "Fuerza de la contraseña",
    "users.strength.emptyAria": "Ninguna contraseña escrita",
    "users.strength.requirementsAria": "Requisitos de la contraseña",
    "reports.hub.title": "Informes",
    "reports.hub.subtitle": "Selecciona el tipo de informe deseado.",
    "reports.hub.card.pending": "Informes Pendientes",
    "reports.hub.card.pending.desc": "Encuentros concluidos sin informe enviado",
    "reports.hub.card.attendance": "Asistencia",
    "reports.hub.card.attendance.desc": "Resumen y detalle de asistencia por célula",
    "reports.hub.card.visitors": "Visitantes",
    "reports.hub.card.visitors.desc": "Lista de visitantes y métricas de contacto",
    "reports.hub.card.meetings": "Encuentros",
    "reports.hub.card.meetings.desc": "Informe consolidado de encuentros por período",
    "reports.visitors.page.description": "Lista de visitantes y métricas de contacto.",
    "reports.visitors.metric.total": "Total de visitantes",
    "reports.visitors.metric.pending": "Contacto pendiente",
    "reports.visitors.metric.topCell": "Célula con más visitantes",
    "reports.visitors.filter.contact": "Contacto",
    "reports.visitors.filter.all": "Todos",
    "reports.visitors.status.pending": "Pendiente",
    "reports.visitors.status.done": "Realizado",
    "reports.visitors.action.clearFilters": "Limpiar filtros",
    "reports.visitors.error": "No fue posible cargar los visitantes",
    "reports.visitors.error.retry": "Inténtalo en unos instantes.",
    "reports.visitors.loading": "Cargando visitantes",
    "reports.visitors.emptyState": "Ningún visitante encontrado",
    "reports.visitors.emptyState.desc": "No hay visitantes registrados en el período.",
    "reports.visitors.column.contact": "Contacto",
    "reports.visitors.column.name": "Nombre",
    "reports.visitors.filter.period": "Período",
    "reports.visitors.pageTitle": "Visitantes",
    "reports.pending.page.description": "Encuentros concluidos que aún no han enviado su informe.",
    "reports.pending.filter.all": "Todos",
    "reports.pending.status.noReport": "Sin informe",
    "reports.pending.status.notStarted": "No iniciado",
    "reports.pending.status.draft": "Borrador",
    "reports.pending.status.returned": "Devuelto",
    "reports.pending.status.submitted": "Enviado",
    "reports.pending.action.clearFilters": "Limpiar filtros",
    "reports.pending.error": "No fue posible cargar los informes pendientes",
    "reports.pending.error.retry": "Inténtalo en unos instantes.",
    "reports.pending.loading": "Cargando informes",
    "reports.pending.emptyState": "Ningún informe pendiente",
    "reports.pending.emptyState.desc": "Todos los encuentros concluidos ya fueron informados.",
    "reports.pending.column.date": "Fecha del encuentro",
    "reports.pending.column.days": "Días sin informe",
    "reports.pending.filter.period": "Período",
    "reports.pending.pageTitle": "Informes pendientes",
    "reports.pending.filter.status": "Estado",
    "reports.meetings.page.description": "Informe consolidado de encuentros por período.",
    "reports.meetings.filter.status": "Estado",
    "reports.meetings.pageTitle": "Encuentros",
    "reports.meetings.status.scheduled": "Programado",
    "reports.meetings.status.completed": "Concluido",
    "reports.meetings.status.canceled": "Cancelado",
    "reports.meetings.action.clearFilters": "Limpiar filtros",
    "reports.meetings.filter.all": "Todos",
    "reports.meetings.column.status": "Estado",
    "reports.meetings.column.present": "Presentes",
    "reports.meetings.column.absent": "Ausentes",
    "reports.meetings.column.rate": "Asistencia",
    "reports.meetings.column.report": "Informe",
    "reports.meetings.error": "No fue posible cargar los encuentros",
    "reports.meetings.error.retry": "Inténtalo en unos instantes.",
    "reports.meetings.loading": "Cargando encuentros",
    "reports.meetings.emptyState": "Ningún encuentro encontrado",
    "reports.meetings.emptyState.desc": "No hay encuentros registrados en el período.",
    "reports.meetings.filter.period": "Período",
    "reports.meetings.reportStatus.notStarted": "No iniciado",
    "reports.meetings.reportStatus.draft": "Borrador",
    "reports.meetings.reportStatus.submitted": "Enviado",
    "reports.meetings.reportStatus.returned": "Devuelto",
    "reports.meetings.reportStatus.cancelled": "Cancelado",
    "reports.attendance.page.description": "Resumen de asistencia por célula en el período.",
    "reports.attendance.filter.period": "Período",
    "reports.attendance.filter.health": "Salud",
    "reports.attendance.filter.all": "Todas",
    "reports.attendance.pageTitle": "Asistencia",
    "reports.attendance.band.healthy": "Saludable",
    "reports.attendance.band.attention": "Atención",
    "reports.attendance.band.critical": "Crítico",
    "reports.attendance.action.clearFilters": "Limpiar filtros",
    "reports.attendance.error": "No fue posible cargar la asistencia",
    "reports.attendance.error.retry": "Inténtalo en unos instantes.",
    "reports.attendance.loading": "Cargando asistencia",
    "reports.attendance.emptyState": "Ningún dato de asistencia",
    "reports.attendance.emptyState.desc": "No hay encuentros concluidos en el período.",
    "reports.attendance.column.cell": "Célula",
    "reports.attendance.column.leader": "Líder",
    "reports.attendance.column.meetings": "Encuentros",
    "reports.attendance.column.rate": "Asistencia",
    "reports.attendance.column.average": "Promedio de presentes",
    "reports.attendance.column.visitors": "Visitantes",
    "reports.attendance.column.health": "Salud",
    "reports.attendanceDetail.page.crumb": "Detalle por persona",
    "reports.attendanceDetail.filter.period": "Período",
    "reports.attendanceDetail.action.reload": "Recargar",
    "reports.attendanceDetail.error": "No fue posible cargar el detalle de asistencia",
    "reports.attendanceDetail.error.retry": "Inténtalo en unos instantes.",
    "reports.attendanceDetail.loading": "Cargando detalle",
    "reports.attendanceDetail.emptyState": "Ninguna persona encontrada",
    "reports.attendanceDetail.emptyState.desc": "No hay datos de asistencia para esta célula en el período.",
    "reports.attendanceDetail.column.present": "Presentes",
    "reports.attendanceDetail.column.absent": "Ausentes",
    "reports.attendanceDetail.column.excused": "Justificados",
    "reports.attendanceDetail.column.rate": "Asistencia",
    "reports.attendanceDetail.pageTitle": "Detalle de asistencia",
    "reports.export.label": "Exportar {format}",
    "bulk.form.legend": "Archivo de importación",
    "bulk.form.hint": "Formatos aceptados: XLSX, CSV y JSON. Límite de 5 MB y 2.000 líneas.",
    "bulk.form.error.empty": "Selecciona un archivo para continuar.",
    "bulk.form.error.extension": "Usa un archivo en formato XLSX, CSV o JSON.",
    "bulk.form.error.size": "El archivo debe tener un máximo de 5 MB.",
    "bulk.form.choose": "Elegir archivo",
    "bulk.form.change": "Cambiar archivo",
    "bulk.form.none": "Ningún archivo seleccionado",
    "bulk.form.submit": "Importar archivo",
    "bulk.form.submitting": "Importando...",
    "bulk.form.download": "Descargar plantilla CSV",
    "bulk.form.back": "Volver a la lista",
    "bulk.form.alertError": "Fallo en el envío",
    "bulk.form.error.generic": "No fue posible importar el archivo. Revisa los datos e inténtalo de nuevo.",
    "bulk.form.toast.title": "Importación concluida",
    "bulk.form.toast.desc": "{created} de {processed} registros creados.",
    "bulk.result.allCreated": "Todos los registros fueron creados",
    "bulk.result.pending": "Importación concluida con pendientes",
    "bulk.result.summary": "{processed} procesados, {created} creados y {failed} con errores.",
    "bulk.result.title": "Resultado por línea",
    "bulk.result.aria": "Resultado de la importación por línea",
    "bulk.column.row": "Línea",
    "bulk.column.status": "Estado",
    "bulk.column.details": "Detalles",
    "bulk.status.created": "Creado",
    "bulk.status.error": "Error",
    "bulk.noObservations": "Sin observaciones",
    "profile.photo.dialog.title": "Foto del perfil",
    "profile.photo.dialog.desc": "Tu foto aparece en tu perfil y en el menú de la cuenta.",
    "profile.photo.previewAlt": "Vista previa de la foto de perfil",
    "profile.photo.choose": "Elegir foto",
    "profile.photo.help": "La imagen se recortará al centro y se optimizará. Máximo de 8 MB.",
    "profile.photo.error.format": "Elige una imagen JPEG, PNG o WebP de hasta 8 MB.",
    "profile.photo.save": "Guardar foto",
    "profile.photo.toast.saved": "Foto actualizada",
    "profile.photo.toast.saved.desc": "Tu nueva foto ya es visible en el panel.",
    "profile.photo.toast.removed": "Foto eliminada",
    "profile.photo.toast.removed.desc": "Tus iniciales volverán a aparecer en el perfil.",
    "profile.photo.error.save": "No fue posible guardar la foto. Inténtalo de nuevo.",
    "profile.photo.error.remove": "No fue posible eliminar la foto.",
    "church.page.title": "Iglesia",
    "church.page.description": "Datos institucionales y ajustes. La edición está disponible solo para administradores.",
    "church.section.institutional": "Datos institucionales",
    "church.field.name": "Nombre",
    "church.field.slug": "Identificador (slug)",
    "church.hint.slug": "Letras minúsculas, números y guiones.",
    "church.hint.phone": "Formato brasileño, p. ej.: (11) 99999-9999.",
    "church.hint.timezone": "Estándar IANA, p. ej.: America/Sao_Paulo.",
    "church.field.weekStart": "Día de inicio de la semana",
    "church.saveData": "Guardar datos",
    "church.saveSettings": "Guardar configuraciones",
    "church.toast.savedData.desc": "La información de la iglesia fue guardada.",
    "church.toast.savedSettings.desc": "Las preferencias de la iglesia fueron guardadas.",
    "church.toast.noChange": "Sin cambios",
    "church.toast.noChange.desc": "No había datos nuevos para guardar.",
    "church.toast.noChangeSettings.desc": "No había configuraciones nuevas para guardar.",
    "church.error.save": "No fue posible guardar. Revisa slug, contacto y dirección.",
    "church.error.saveSettings": "No fue posible guardar las configuraciones. Revisa la zona horaria.",
    "church.error.load": "No fue posible cargar los datos de la iglesia",
    "church.empty.title": "Iglesia no disponible",
    "church.empty.desc": "Los datos de la iglesia no pudieron cargarse.",
    "church.loading.church": "Cargando iglesia",
    "church.address.cep.hint": "Al salir del campo, la dirección se completará con ViaCEP.",
    "church.address.cep.digits": "Informa un CEP de 8 dígitos.",
    "church.address.lookupSuccess": "Dirección completada por el CEP.",
    "church.address.lookupNotFound": "CEP no encontrado. Revisa el número o completa la dirección manualmente.",
    "church.address.lookupError": "No fue posible consultar el CEP. Completa la dirección manualmente.",
    "church.address.lookupLoading": "Consultando CEP…",
    "church.address.field.country": "País",
    "church.label.stateUf": "Estado (UF)",
    "church.field.email": "Correo electrónico",
    "church.section.settings": "Configuración",
    "church.field.timezone": "Zona horaria",
    "church.toast.savedData": "Datos actualizados",
    "church.toast.savedSettings": "Configuración actualizada",
    "church.error.retry": "Inténtalo en unos instantes.",
    "people.page.title": "Personas",
    "people.page.subtitle": "Mantén al día el registro de personas de tu iglesia.",
    "people.new": "Nueva persona",
    "people.error.list": "No fue posible cargar las personas",
    "people.emptyState.title": "Ninguna persona encontrada",
    "people.detail.toast.updated": "Persona actualizada",
    "people.detail.field.observations": "Observaciones",
    "cells.page.title": "Células",
    "cells.new": "Nueva célula",
    "cells.error.list": "No fue posible cargar las células",
    "cells.emptyState.title": "Ninguna célula encontrada",
    "cells.column.name": "Nombre",
    "cells.detail.meetingAt": "{day} a las {time}",
    "cells.detail.error.tryAgain": "No fue posible {action}. Inténtalo de nuevo.",
    "common.success": "Éxito",
    "common.failure": "Fallo",
    "cells.create.back": "Volver a células",
    "cells.create.toast.created": "Célula creada",
    "meetings.page.title": "Encuentros",
    "meetings.new": "Nuevo encuentro",
    "meetings.error.list": "No fue posible cargar los encuentros",
    "meetings.emptyState.title": "Ningún encuentro encontrado",
    "common.confirm": "Confirmar",
    "meetings.detail.error.tryAgain": "No fue posible {action}. Inténtalo de nuevo.",
    "meetings.new.toast.created": "Encuentro creado"
  }
};

export const DEFAULT_LOCALE: AppLocale = "pt-BR";
