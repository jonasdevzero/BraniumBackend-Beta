import { MigrationInterface, QueryRunner, Table } from "typeorm"

export class createContactMessage1627309257892 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "contact_message",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    isUnique: true,
                    isGenerated: true,
                    unsigned: true,
                    generationStrategy: "uuid",
                    default: `uuid_generate_v4()`
                },
                {
                    name: "contact_id", // The id of table contact
                    type: "uuid",
                    unsigned: true
                },
                {
                    name: "text",
                    type: "text",
                    unsigned: true
                },
                {
                    name: "sender_id",
                    type: "uuid",
                    unsigned: true
                },
                {
                    name: "bidirectional_id",
                    type: "uuid",
                    unsigned: true
                },
                {
                    name: "refence_message_id",
                    type: "uuid",
                    unsigned: true,
                    isNullable: true,
                },
                {
                    name: "created_at",
                    type: "timestamp with time zone",
                    unsigned: true
                },
                {
                    name: "deleted_at",
                    type: "timestamp",
                    isNullable: true
                }
            ],
            foreignKeys: [
                {
                    name: "ContactMessages",
                    columnNames: ["contact_id"],
                    referencedTableName: "contact",
                    referencedColumnNames: ["id"],
                    onUpdate: "CASCADE"
                }
            ]
        }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("contact_message")
    }

}
