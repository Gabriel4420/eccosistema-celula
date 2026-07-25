import { Inject, Injectable, type OnModuleDestroy } from "@nestjs/common";
import type { RuntimeDatabaseClient } from "@mission-atos/database";
import { DATABASE_CLIENT } from "../../identity.tokens";

@Injectable()
export class DatabaseLifecycle implements OnModuleDestroy {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: RuntimeDatabaseClient
  ) {}

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
