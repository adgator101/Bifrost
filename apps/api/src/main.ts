import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.setGlobalPrefix('v1');
	app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

	const config = new DocumentBuilder()
		.setTitle('Bifrost API')
		.setDescription('Bifrost API')
		.setVersion('0.0.1')
		.addBearerAuth()
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('docs', app, document);

	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
