import { MiddlewareConsumer, Module } from '@nestjs/common';

import { DatabaseModule } from './database/database.module';
import { HealthzModule } from './healthz/healthz.module';
import { LoggerModule } from './logger/logger.module';
import { LoggerMiddleware } from './logger/logger.middleware';
import { ModelsModule } from './models/models.module';
import { GraphQLModule } from './graphql/graphql.module';

@Module({
  imports: [LoggerModule, HealthzModule, DatabaseModule, ModelsModule, GraphQLModule],
  controllers: [],
  providers: [],
})
export class AppModule {
  public configure(consumer: MiddlewareConsumer): void | MiddlewareConsumer {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
