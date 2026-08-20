import {
  Catch,
  HttpException
} from "@nestjs/common";
import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { ZodError } from "zod";
import { PublicApplicationError } from "@mission-atos/domain";

@Catch()
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    if (exception instanceof PublicApplicationError) {
      response.status(applicationErrorStatus(exception.code)).json({
        error: { code: exception.code, message: exception.message, details: {} }
      });
      return;
    }
    if (exception instanceof ZodError) {
      const reservedChurchSlug = exception.issues.some(
        (issue) => issue.message === "Reserved church slug"
      );
      response.status(400).json({
        error: {
          code: reservedChurchSlug
            ? "CHURCH_SLUG_RESERVED"
            : "VALIDATION_ERROR",
          message: reservedChurchSlug
            ? "Church slug is reserved"
            : "Invalid request",
          details: {}
        }
      });
      return;
    }
    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }
    response.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected error",
        details: {}
      }
    });
  }
}

function applicationErrorStatus(code: string): number {
  const statuses: Readonly<Record<string, number>> = {
    AUTH_INVALID_CREDENTIALS: 401,
    AUTH_REFRESH_INVALID: 401,
    AUTH_UNAUTHENTICATED: 401,
    AUTH_FORBIDDEN: 403,
    AUTH_RATE_LIMITED: 429,
    VALIDATION_ERROR: 400,
    USER_NOT_FOUND: 404,
    ROLE_NOT_FOUND: 404,
    USER_EMAIL_CONFLICT: 409,
    LAST_ACTIVE_ADMIN: 409,
    USER_ROLE_CONFLICT: 409,
    CHURCH_NOT_FOUND: 404,
    CHURCH_SLUG_CONFLICT: 409,
    CHURCH_SLUG_RESERVED: 400,
    PERSON_NOT_FOUND: 404,
    PERSON_DUPLICATE: 409,
    CELL_ACCESS_DENIED: 403,
    CELL_NOT_FOUND: 404,
    CELL_LEADERSHIP_CANDIDATE_NOT_FOUND: 404,
    CELL_LEADER_NOT_ELIGIBLE: 409,
    CELL_TRAINEE_NOT_ELIGIBLE: 409,
    CELL_SUPERVISOR_NOT_FOUND: 404,
    CELL_SUPERVISOR_CONFLICT: 409,
    CELL_CODE_CONFLICT: 409,
    CELL_LEADERSHIP_CONFLICT: 409,
    CELL_STATUS_TRANSITION_INVALID: 409,
    MEETING_ACCESS_DENIED: 403,
    MEETING_NOT_FOUND: 404,
    MEETING_CELL_NOT_FOUND: 404,
    MEETING_CELL_STATUS_INVALID: 409,
    MEETING_DATE_CONFLICT: 409,
    MEETING_STATUS_TRANSITION_INVALID: 409,
    MEETING_NOT_EDITABLE: 409,
    MEETING_REPORT_NOT_EDITABLE: 409,
    MEETING_TRANSACTION_RETRY_EXHAUSTED: 503,
    IDEMPOTENCY_KEY_CONFLICT: 409
  };
  return statuses[code] ?? 500;
}
