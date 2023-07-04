import { GraphQLModule as NestJSGraphQLModule, GraphQLSchemaHost } from '@nestjs/graphql';
import { Global, Inject, Module, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { YogaDriverConfig, YogaDriver } from '@graphql-yoga/nestjs';

import { Application } from 'express';
import { useSofa } from 'sofa-api';

import { LoggerStore } from '../logger/logger.store';

import { GraphQLOptions } from './graphql.options';
import { GraphQLSchemaLoaderModule } from './schema-loader/schema-loader.module';

@Global()
@Module({
  imports: [
    NestJSGraphQLModule.forRootAsync<YogaDriverConfig>({
      imports: [GraphQLSchemaLoaderModule],
      useClass: GraphQLOptions,
      inject: [],
      driver: YogaDriver,
    }),
  ],
  providers: [],
  exports: [],
})
export class GraphQLModule implements OnModuleInit {
  constructor(
    @Inject(GraphQLSchemaHost) private readonly schemaHost: GraphQLSchemaHost,
    @Inject(HttpAdapterHost) private readonly httpAdapterHost: HttpAdapterHost
  ) {}

  onModuleInit(): void {
    const { schema } = this.schemaHost;
    const { httpAdapter } = this.httpAdapterHost;

    const app: Application = httpAdapter.getInstance();

    app.use(
      useSofa({
        schema,
        basePath: '',
        depthLimit: 0,
        context: ({ req }: { req: Request & { logger_store: LoggerStore } }) => ({
          req,
          logger_store: req.logger_store,
        }),
      })
    );
  }
}
