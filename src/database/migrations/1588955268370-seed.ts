/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { MigrationInterface, QueryRunner } from 'typeorm';

import { Book } from '../../models/book/book.entity';
import { Section } from '../../models/section/section.entity';

export class seed1588955268370 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.connection
      .createQueryBuilder()
      .insert()
      .into(Book)
      .values([
        {
          id: 'be5f23d4-82e9-4603-9282-84015adf081b',
          title: 'Book 1',
        },
        {
          id: '0d38ac59-3803-47e0-a4fb-b95e5fd74c42',
          title: 'Book 2',
        },
      ])
      .execute();

    await queryRunner.connection
      .createQueryBuilder()
      .insert()
      .into(Section)
      .values([
        {
          id: '57c82b1d-2f5e-4145-8dc6-b2d883236ef1',
          book_id: 'be5f23d4-82e9-4603-9282-84015adf081b',
          title: 'Book 1 Section 1',
        },
        {
          id: 'c3e29f78-1803-4e04-9979-ad6167a7c762',
          book_id: '0d38ac59-3803-47e0-a4fb-b95e5fd74c42',
          title: 'Book 2 Section 1',
        },
      ])
      .execute();
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
