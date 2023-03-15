import { Injectable } from '@nestjs/common';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { YogaDriver, YogaDriverConfig } from '@graphql-yoga/nestjs';
import { useResponseCache } from '@envelop/response-cache';
import { useLogger } from '@envelop/core';

import { DocumentNode, GraphQLArgs, GraphQLSchema } from 'graphql';
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
      autoSchemaFile: true,
      context: ({ req }: { req: Request & { logger_store: LoggerStore } }) => ({
        req,
        logger_store: req.logger_store,
        current_user: null,
      }),
      transformSchema: (schema: GraphQLSchema) => {
        return schema;
      },
      plugins: [
        useResponseCache({
          session: ({ current_user }: { current_user: unknown }) => String(current_user),
          ttl: process.env.CACHE_TTL ? +process.env.CACHE_TTL : 5_000,
          invalidateViaMutation: true,
        }),
        useLogger({
          logFn: (
            event_name: string,
            {
              args,
            }: {
              args: GraphQLArgs & {
                document: DocumentNode;
                contextValue: {
                  req: Request;
                  logger_store: LoggerStore;
                  params: {
                    query: string;
                  };
                };
              };
              result?: unknown;
            }
          ) => {
            const ctx = args.contextValue;
            const logger_store: LoggerStore = ctx.logger_store;

            let operation: string;
            const selections: string[] = [];

            args.document.definitions.forEach((definition) => {
              if (definition.kind === 'OperationDefinition') {
                operation = definition.operation;

                definition.selectionSet.selections.forEach((selection) => {
                  if (selection.kind === 'Field') {
                    selections.push(selection.name.value);
                  }
                });
              }
            });

            logger_store.info(`GraphQL ${event_name}`, { event: event_name, operation, selections });
          },
        }),
      ],
    };
  }
}
