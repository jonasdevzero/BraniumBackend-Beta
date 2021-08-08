import { MigrationInterface, QueryRunner, Table } from "typeorm"

export class createContact1627308427763 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "contact",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    isUnique: true,
                    isGenerated: true,
                    unsigned: true,
                    generationStrategy: "uuid",
                    default: `uuid_generate_v4()`,
                },
                {
                    name: "user_id",
                    type: "uuid",
                },
                {
                    name: "contact_user_id",
                    type: "uuid",
                },
                {
                    name: "unread_messages",
                    type: "integer",
                },
                {
                    name: "last_message_time",
                    type: "timestamp with time zone"
                },
                {
                    name: "blocked",
                    type: "boolean",
                },
                {
                    name: "you_blocked",
                    type: "boolean",
                },
            ],
            foreignKeys: [
                {
                    name: "ContactUser",
                    columnNames: ["user_id"],
                    referencedTableName: "user",
                    referencedColumnNames: ["id"],
                    onUpdate: "CASCADE",
                },
                {
                    name: "ContactUserContact",
                    columnNames: ["contact_user_id"],
                    referencedTableName: "user",
                    referencedColumnNames: ["id"],
                    onUpdate: "CASCADE",
                },
            ]
        }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("contact")
    }

}
