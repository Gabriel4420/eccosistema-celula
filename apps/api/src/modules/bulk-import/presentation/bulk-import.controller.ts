import { BadRequestException, Controller, HttpCode, HttpStatus, Inject, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { importResultEnvelopeSchema } from "@mission-atos/contracts";
import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { CurrentPrincipal } from "../../permissions/presentation/decorators/current-principal.decorator";
import { Roles } from "../../permissions/presentation/decorators/roles.decorator";
import { BulkImportCommands } from "../application/bulk-import.commands";
import { parseImportFile, detectFormat } from "../infrastructure/parsers/parse-import-file";
import { BulkImportError, type ParsedFile } from "../infrastructure/parsers/file-parser.types";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 2000;

@ApiTags("import")
@ApiBearerAuth()
@Controller("import")
export class BulkImportController {
  constructor(@Inject(BulkImportCommands) private readonly commands: BulkImportCommands) {}

  @Roles("ADMIN", "PASTOR") @Post("people") @HttpCode(HttpStatus.OK) @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_BYTES } }))
  @ApiOperation({ summary: "Bulk import people from xlsx, csv or json" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 200, description: "Import result with per-row outcomes", schema: { type: "object" } })
  @ApiResponse({ status: 400, description: "Invalid file" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "ADMIN or PASTOR required" })
  async importPeople(@CurrentPrincipal() principal: AuthenticatedPrincipal, @UploadedFile() file: Express.Multer.File) {
    const parsed = await this.readAndParse(file);
    const result = await this.commands.importPeople(principal, parsed.rows, parsed.format, file.originalname);
    return presentResult(result);
  }

  @Roles("ADMIN", "PASTOR") @Post("cells") @HttpCode(HttpStatus.OK) @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_BYTES } }))
  @ApiOperation({ summary: "Bulk import cells from xlsx, csv or json" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 200, description: "Import result with per-row outcomes", schema: { type: "object" } })
  @ApiResponse({ status: 400, description: "Invalid file" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "ADMIN or PASTOR required" })
  async importCells(@CurrentPrincipal() principal: AuthenticatedPrincipal, @UploadedFile() file: Express.Multer.File) {
    const parsed = await this.readAndParse(file);
    const result = await this.commands.importCells(principal, parsed.rows, parsed.format, file.originalname);
    return presentResult(result);
  }

  @Roles("ADMIN") @Post("users") @HttpCode(HttpStatus.OK) @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_BYTES } }))
  @ApiOperation({ summary: "Bulk import users from xlsx, csv or json" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 200, description: "Import result with per-row outcomes", schema: { type: "object" } })
  @ApiResponse({ status: 400, description: "Invalid file" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "ADMIN required" })
  async importUsers(@CurrentPrincipal() principal: AuthenticatedPrincipal, @UploadedFile() file: Express.Multer.File) {
    const parsed = await this.readAndParse(file);
    const result = await this.commands.importUsers(principal, parsed.rows, parsed.format, file.originalname);
    return presentResult(result);
  }

  private async readAndParse(file: Express.Multer.File): Promise<ParsedFile> {
    if (!file) {
      throw new BadRequestException("file is required");
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException("File exceeds the 5MB limit");
    }
    try {
      const format = detectFormat(file.mimetype, file.originalname);
      const parsed = await parseImportFile(file.buffer, file.mimetype, file.originalname);
      if (parsed.rows.length === 0) {
        throw new BulkImportError("BULK_EMPTY_FILE", "The file has no data rows");
      }
      if (parsed.rows.length > MAX_ROWS) {
        throw new BulkImportError("BULK_TOO_MANY_ROWS", `File exceeds the ${MAX_ROWS} rows limit`);
      }
      return { ...parsed, format };
    } catch (error) {
      if (error instanceof BulkImportError) {
        throw new BadRequestException({
          error: { code: error.code, message: error.message, details: error.details }
        });
      }
      throw error;
    }
  }
}

function presentResult(result: unknown): unknown {
  const envelope = importResultEnvelopeSchema.parse({ data: result, meta: {} });
  return envelope;
}
