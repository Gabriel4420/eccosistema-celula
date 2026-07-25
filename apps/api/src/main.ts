import { parseServerEnvironment } from "@mission-atos/config/server";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const environment = parseServerEnvironment(process.env);
  const application = await NestFactory.create(AppModule);
  application.use(cookieParser());
  application.enableCors({
    credentials: true,
    origin: environment.CORS_ORIGINS.split(",").map((value) => value.trim())
  });
  const openApi = SwaggerModule.createDocument(
    application,
    new DocumentBuilder()
      .setTitle("Mission Atos API")
      .setVersion("0.0.0")
      .addBearerAuth()
      .build()
  );
  SwaggerModule.setup("docs", application, openApi);

  await application.listen(environment.PORT);
}

void bootstrap();
