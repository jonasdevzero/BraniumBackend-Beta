import { MigrationInterface, QueryRunner, Table } from "typeorm"

export class createUser1627307998479 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "user",
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
                    name: "name",
                    type: "varchar",
                },
                {
                    name: "username",
                    type: "varchar",
                    isUnique: true,
                },
                {
                    name: "email",
                    type: "varchar",
                    isUnique: true,
                },
                {
                    name: "password",
                    type: "varchar",
                },
                {
                    name: "picture",
                    type: "text",
                    isNullable: true,
                },
                {
                    name: "reset_token",
                    type: "varchar",
                    isNullable: true,
                    isUnique: true,
                },
                {
                    name: "expire_token",
                    type: "timestamp with time zone",
                    isNullable: true,
                },
                {
                    name: "created_at",
                    type: "timestamp with time zone",
                    unsigned: true,
                },
                {
                    name: "updated_at",
                    type: "timestamp with time zone",
                },
                {
                    name: "deleted_at",
                    type: "timestamp",
                    isNullable: true,                    
                }
            ]
        }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("user")
    }

}
