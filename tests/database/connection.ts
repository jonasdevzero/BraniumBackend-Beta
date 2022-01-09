import { createConnection, getConnection } from "typeorm";

export default {
  async connect() {
    const entities = "./src/api/models/*.ts";
    const migrations = "./src/api/database/migrations/*.ts";

    return await createConnection({
      type: "postgres",
      url: "postgres://postgres:postgres@localhost:5432/branium_test",
      synchronize: true,
      logging: false,
      dropSchema: true,
      entities: [entities],
      migrations: [migrations],
      cli: {
        migrationsDir: "./src/api/database/migrations",
      },
    });
  },

  async close() {
    await getConnection().close();
  },

  async clear() {
    const connection = getConnection();
    const entities = connection.entityMetadatas;

    await Promise.all(
      entities.map(async (entity) => {
        const repository = connection.getRepository(entity.name);
        await repository.query(`DELETE FROM "${entity.tableName}"`);
      })
    );
  },
};
