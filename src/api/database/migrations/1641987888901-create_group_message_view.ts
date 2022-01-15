import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class createGroupMessageView1641987888901 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'group_message_view',
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
                        name: 'message_id',
                        type: 'uuid',
                        unsigned: true,
                    },
                    {
                        name: 'viewed',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'viewed_at',
                        type: 'timestamp with time zone',
                        isNullable: true,
                    },
                    {
                        name: 'viewer_id',
                        type: 'uuid',
                        unsigned: true,
                    },
                ],
                foreignKeys: [
                    {
                        name: 'MessageViews',
                        columnNames: ['message_id'],
                        referencedTableName: 'group_message',
                        referencedColumnNames: ['id'],
                        onUpdate: 'CASCADE',
                        onDelete: 'CASCADE',
                    },
                    {
                        name: 'MessageViewer',
                        columnNames: ['viewer_id'],
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
        await queryRunner.dropTable('group_message_view');
    }
}
