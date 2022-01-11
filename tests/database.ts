import { createConnection, getConnection } from "typeorm";

export default {
  async connect() {
    const url = process.env.TYPEORM_TEST_URL as string
    const entities = process.env.TYPEORM_ENTITIES as string
    const migrations = process.env.TYPEORM_MIGRATIONS as string
    const migrationsDir = process.env.TYPEORM_MIGRATIONS_DIR as string

    return await createConnection({
      type: "postgres",
      url,
      synchronize: true,
      logging: false,
      dropSchema: true,
      entities: [entities],
      migrations: [migrations],
      cli: {
        migrationsDir,
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
