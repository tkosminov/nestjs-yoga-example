import { GraphQLModule as NestJSGraphQLModule, GraphQLSchemaHost } from '@nestjs/graphql';
import { Global, Inject, Module, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { YogaDriverConfig, YogaDriver } from '@graphql-yoga/nestjs';

import { Application } from 'express';
import { OpenAPI, useSofa } from 'sofa-api';
import { serve, setup } from 'swagger-ui-express';

import { LoggerStore } from '../logger/logger.store';

import { GraphQLOptions } from './graphql.options';

@Global()
@Module({
  imports: [
    NestJSGraphQLModule.forRootAsync<YogaDriverConfig>({
      imports: [],
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

    const open_api = OpenAPI({
      schema,
      info: {
        title: 'NestJS-Yoga REST API',
        version: '1.0.0',
      },
    });

    app.use(
      '/graphql-rest',
      useSofa({
        schema,
        basePath: '/graphql-rest',
        depthLimit: 0,
        onRoute(info) {
          open_api.addRoute(info, {
            basePath: '/graphql-rest',
          });
        },
        context: ({ req }: { req: Request & { logger_store: LoggerStore } }) => ({
          req,
          logger_store: req.logger_store,
        }),
      })
    );

    const open_api_definitions = open_api.get();
    app.use('/api/graphql-rest', serve, setup(open_api_definitions));
  }
}
