import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class createContactInvitation1627308741903 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "contact_invitation",
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
                    name: "sender_id",
                    type: "uuid"
                },
                {
                    name: "receiver_id",
                    type: "uuid"
                },
                {
                    name: "pending",
                    type: "boolean",
                    default: true
                },
                {
                    name: "created_at",
                    type: "timestamp with time zone",
                }
            ],
            foreignKeys: [
                {
                    name: "ReceiverInvitation",
                    columnNames: ["receiver_id"],
                    referencedTableName: "user",
                    referencedColumnNames: ["id"]
                },
                {
                    name: "SenderInvitation",
                    columnNames: ["sender_id"],
                    referencedTableName: "user",
                    referencedColumnNames: ["id"]
                }
            ]
        }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("contact_invitation")
    }

}
