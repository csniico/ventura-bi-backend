import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { networkInterfaces } from 'os';

function getLocalIpAddress(): string {
  const nets = networkInterfaces();

  for (const name of Object.keys(nets)) {
    const netInfo = nets[name];
    if (!netInfo) continue;

    for (const net of netInfo) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
      if (net.family === familyV4Value && !net.internal) {
        return net.address;
      }
    }
  }

  return 'localhost';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser())
  app.enableCors({
    origin: ['*'],
    credentials: true,
  });

  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
        enableCircularCheck: true,
      },
    }),
  );

  const adapter = app.getHttpAdapter() as ExpressAdapter;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const instance = adapter.getInstance();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  instance.disable('x-powered-by');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Service')
    .setDescription('The best application ever')
    .setVersion('0.0.1')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('SERVER_PORT', 3000);

  await app.listen(port, '0.0.0.0'); // Listen on all network interfaces

  const localIp = getLocalIpAddress();
  console.log(`App started successfully!`);
  console.log(`Local:            http://localhost:${port}`);
  console.log(`Network:          http://${localIp}:${port}`);
  console.log(`API Docs:         http://${localIp}:${port}/api/docs`);
}
bootstrap().catch(console.error);
