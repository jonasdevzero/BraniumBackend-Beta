import App from "../src/app";
import db_test from "./database/connection";

function build() {
  const app = App();

  beforeAll(async () => {
    await db_test.connect();
    await app.ready();
  });
  
  afterAll(async () => {
    await db_test.clear();
    await db_test.close();
    await app.close();
  });

  return app;
}

export { build };
