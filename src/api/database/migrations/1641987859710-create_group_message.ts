import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class createGroupMessage1641987859710 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'group_message',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        isUnique: true,
                        isGenerated: true,
                        unsigned: true,
                        generationStrategy: 'uuid',
                        default: `uuid_generate_v4()`,
                    },
                    {
                        name: 'group_id',
                        type: 'uuid',
                        unsigned: true,
                    },
                    {
                        name: 'sender_id',
                        type: 'uuid',
                        unsigned: true,
                    },
                    {
                        name: 'text',
                        type: 'text',
                        unsigned: true,
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp with time zone',
                        unsigned: true,
                    },
                ],
                foreignKeys: [
                    {
                        name: 'GroupMessages',
                        columnNames: ['group_id'],
                        referencedTableName: 'group',
                        referencedColumnNames: ['id'],
                        onUpdate: 'CASCADE',
                        onDelete: 'CASCADE',
                    },
                    {
                        name: 'UserSender',
                        columnNames: ['sender_id'],
                        referencedTableName: 'user',
                        referencedColumnNames: ['id'],
                        onUpdate: 'CASCADE',
                        onDelete: 'CASCADE',
                    },
                ],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('group_message');
    }
}
