import { parseServerEnvironment } from "@mission-atos/config/server";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const environment = parseServerEnvironment(process.env);
  const application = await NestFactory.create(AppModule);

  await application.listen(environment.PORT);
}

void bootstrap();
