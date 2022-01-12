import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class createGroupMessageMedia1641992117092
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'group_media_message',
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
                    },
                    {
                        name: 'url',
                        type: 'text',
                    },
                    {
                        name: 'type',
                        type: 'varchar',
                    },
                ],
                foreignKeys: [
                    {
                        name: 'GroupMediaMessage',
                        columnNames: ['message_id'],
                        referencedTableName: 'group_message',
                        referencedColumnNames: ['id'],
                        onUpdate: 'CASCADE',
                        onDelete: 'CASCADE',
                    },
                ],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('group_media_message');
    }
}
