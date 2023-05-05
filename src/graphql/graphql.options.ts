import { Injectable } from '@nestjs/common';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { YogaDriver, YogaDriverConfig } from '@graphql-yoga/nestjs';
import { useResponseCache } from '@envelop/response-cache';
import { useLogger, type SetSchemaFn, type Plugin } from '@envelop/core';

import { DocumentNode, GraphQLArgs, GraphQLSchema } from 'graphql';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { setDataSource } from 'nestjs-graphql-easy';
import config from 'config';

import { LoggerStore } from '../logger/logger.store';

import { GraphQLSchemaLoaderService } from './schema-loader/schema-loader.service';

const GRAPHQL_SETTINGS = config.get<IGraphQLSettings>('GRAPHQL_SETTINGS');

const setSchemaUpdater: (setFn: (schemaUpdater: SetSchemaFn) => GraphQLSchema) => Plugin = (fn) => ({
  onPluginInit({ setSchema: set_schema }) {
    fn(set_schema);
  },
});

@Injectable()
export class GraphQLOptions implements GqlOptionsFactory {
  public schemaUpdater: SetSchemaFn = null;

  constructor(private readonly dataSource: DataSource, private readonly schemaLoaderService: GraphQLSchemaLoaderService) {
    setDataSource(this.dataSource);

    this.schemaLoaderService.schema$.subscribe((schema: GraphQLSchema) => {
      if (this.schemaUpdater != null) {
        this.schemaUpdater(schema);
      }
    });
  }

  public setSchemaUpdater(updater: SetSchemaFn) {
    this.schemaUpdater = updater;
  }

  public createGqlOptions(): Promise<YogaDriverConfig> | YogaDriverConfig {
    return {
      ...GRAPHQL_SETTINGS,
      autoSchemaFile: true,
      driver: YogaDriver,
      context: ({ req }: { req: Request & { logger_store: LoggerStore; current_user: ICurrentUser } }) => ({
        req,
        logger_store: req.logger_store,
        current_user: req.current_user || ({ id: 1 } as ICurrentUser),
      }),
      transformSchema: async (schema: GraphQLSchema) => {
        this.schemaLoaderService.setCurrentSchema(schema);

        await this.schemaLoaderService.reloadSchemas();

        return this.schemaLoaderService.schema$.value;
      },
      plugins: [
        setSchemaUpdater(this.setSchemaUpdater.bind(this)),
        useResponseCache({
          session: ({ current_user }: { current_user: ICurrentUser }) => String(current_user.id),
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
