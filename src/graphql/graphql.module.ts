import { GraphQLModule as NestJSGraphQLModule } from '@nestjs/graphql';
import { Global, Module } from '@nestjs/common';
import { YogaDriverConfig, YogaDriver } from '@graphql-yoga/nestjs';

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
export class GraphQLModule {}
