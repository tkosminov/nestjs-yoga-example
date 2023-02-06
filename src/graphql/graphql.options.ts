import { Injectable } from '@nestjs/common';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { YogaDriver, YogaDriverConfig } from '@graphql-yoga/nestjs';

import { GraphQLSchema } from 'graphql';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { setDataSource } from 'nestjs-graphql-easy';

import { LoggerStore } from '../logger/logger.store';

@Injectable()
export class GraphQLOptions implements GqlOptionsFactory {
  constructor(private readonly dataSource: DataSource) {
    setDataSource(this.dataSource);
  }

  public createGqlOptions(): Promise<YogaDriverConfig> | YogaDriverConfig {
    return {
      graphiql: true,
      driver: YogaDriver,
      autoSchemaFile: __dirname + '/schema.graphql',
      context: ({ req }: { req: Request & { logger_store: LoggerStore } }) => ({
        req,
        logger_store: req.logger_store,
      }),
      transformSchema: (schema: GraphQLSchema) => {
        return schema;
      },
    };
  }
}
