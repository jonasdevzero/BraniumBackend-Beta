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
                    name: "viewed",
                    type: "boolean"
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
                    name: "created_at",
                    type: "timestamp with time zone",
                    unsigned: true
                }
            ],
            foreignKeys: [
                {
                    name: "ContactMessages",
                    columnNames: ["contact_id"],
                    referencedTableName: "contact",
                    referencedColumnNames: ["id"],
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
                }
            ]
        }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("contact_message")
    }

}
