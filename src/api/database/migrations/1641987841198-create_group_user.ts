import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class createGroupUser1641987841198 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'group_user',
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
                        name: 'user_id',
                        type: 'uuid',
                        unsigned: true,
                    },
                    {
                        name: 'unread_messages',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'role',
                        type: 'integer',
                    },
                    {
                        name: 'role_since',
                        type: 'timestamp with time zone',
                    },
                    {
                        name: 'member_since',
                        type: 'timestamp with time zone',
                        unsigned: true,
                    },
                ],
                foreignKeys: [
                    {
                        name: 'GroupUsers',
                        columnNames: ['group_id'],
                        referencedTableName: 'group',
                        referencedColumnNames: ['id'],
                        onUpdate: 'CASCADE',
                        onDelete: 'CASCADE',
                    },
                    {
                        name: 'UserGroup',
                        columnNames: ['user_id'],
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
        await queryRunner.dropTable('group_user');
    }
}
