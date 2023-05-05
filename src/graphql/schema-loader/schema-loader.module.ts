import { Module } from '@nestjs/common';

import { GraphQLSchemaLoaderService } from './schema-loader.service';

@Module({
  imports: [],
  providers: [GraphQLSchemaLoaderService],
  controllers: [],
  exports: [GraphQLSchemaLoaderService],
})
export class GraphQLSchemaLoaderModule {}
