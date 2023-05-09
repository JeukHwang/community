import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const port = 3000;
  await app.listen(port);
  console.log(`Listening on port http://localhost:${port}`);
}
bootstrap();
