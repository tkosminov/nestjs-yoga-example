import { Injectable } from '@nestjs/common';
import { SubschemaConfig } from '@graphql-tools/delegate';
import { AsyncExecutor } from '@graphql-tools/utils';
import { schemaFromExecutor } from '@graphql-tools/wrap';
import { stitchSchemas } from '@graphql-tools/stitch';
import { stitchingDirectives } from '@graphql-tools/stitching-directives';
import { fetch } from '@whatwg-node/fetch';

import { GraphQLSchema, print } from 'graphql';
import { AbortController } from 'node-abort-controller';
import config from 'config';
import { BehaviorSubject, interval } from 'rxjs';

const { stitchingDirectivesTransformer } = stitchingDirectives();
const GRAPHQL_REMOTE_API = config.get<IGraphQLRemoteApi>('GRAPHQL_REMOTE_API');

@Injectable()
export class GraphQLSchemaLoaderService {
  private current_schema: GraphQLSchema = null;
  private subschemas: (SubschemaConfig | GraphQLSchema)[] = [];

  public readonly schema$: BehaviorSubject<GraphQLSchema | null> = new BehaviorSubject(null);

  constructor() {
    interval(30_000).subscribe(async () => {
      await this.reloadSchemas();
    });
  }

  public setCurrentSchema(schema: GraphQLSchema) {
    this.current_schema = schema;
  }

  public async reloadSchemas() {
    this.subschemas = [this.current_schema];

    await Promise.all(Object.values(GRAPHQL_REMOTE_API).map((api_uri) => this.loadSchema(api_uri)));

    this.schema$.next(
      stitchSchemas({
        subschemaConfigTransforms: [stitchingDirectivesTransformer],
        subschemas: this.subschemas,
      })
    );
  }

  private async loadSchema(uri: string) {
    console.log(`Load ${uri} GraphQLSchema - started`);

    try {
      const subschema: SubschemaConfig = {
        schema: await schemaFromExecutor(this.createExecutor(uri, true)),
        executor: this.createExecutor(uri, false),
        batch: true,
      };

      this.subschemas.push(subschema);

      console.log(`Load ${uri} GraphQLSchema - completed`);
    } catch (error) {
      console.error(`Load ${uri} GraphQLSchema - failed`);
    }
  }

  private createExecutor(uri: string, abort: boolean): AsyncExecutor {
    return async ({ document, variables, operationName, extensions }) => {
      const query = print(document);

      const abort_controller: AbortController = new AbortController();
      let time_out: NodeJS.Timeout = null;

      if (abort) {
        time_out = setTimeout(function () {
          abort_controller.abort();
        }, 20_000);
      }

      const fetch_result = await fetch(uri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Accept: 'application/json',
        },
        body: JSON.stringify({ query, variables, operationName, extensions }),
        signal: abort_controller.signal as AbortSignal,
      });

      if (time_out) {
        clearTimeout(time_out);
        time_out = null;
      }

      return fetch_result.json();
    };
  }
}
