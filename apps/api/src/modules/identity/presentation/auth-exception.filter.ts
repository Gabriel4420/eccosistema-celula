import {
  Catch,
  HttpException
} from "@nestjs/common";
import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { ZodError } from "zod";
import { AuthError } from "../domain/auth-error";

@Catch()
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    if (exception instanceof AuthError) {
      response.status(exception.status).json({
        error: { code: exception.code, message: exception.message, details: {} }
      });
      return;
    }
    if (exception instanceof ZodError) {
      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request",
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
