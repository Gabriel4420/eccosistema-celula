import { parseServerEnvironment } from "@mission-atos/config/server";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const environment = parseServerEnvironment(process.env);
  const application = await NestFactory.create(AppModule);
  application.use(cookieParser());
  application.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          connectSrc: [
            "'self'",
            "https://viacep.com.br",
            "http://localhost:3001",
          ],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: "same-origin" },
      hsts: { maxAge: 31_536_000, includeSubDomains: true },
    }),
  );
  application.enableCors({
    credentials: true,
    origin: environment.CORS_ORIGINS.split(",").map((value) => value.trim()),
  });
  const openApi = SwaggerModule.createDocument(
    application,
    new DocumentBuilder()
      .setTitle("Mission Atos API")
      .setVersion("0.0.0")
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup("docs", application, openApi);

  await application.listen(environment.PORT);
}

void bootstrap();
