import App from "../src/app";
import db_test from "./database/connection";
import { socketConnection } from "../src/api/websocket/connection";

function build() {
  const app = App();

  beforeAll(async () => {
    await db_test.connect();

    app.ready(err => {
        if (err) throw err;

        app.ws.on('connection', socket => socketConnection(socket, app));
    });
  });
  
  afterAll(async () => {
    await db_test.clear();
    await db_test.close();
    await app.close();
  });

  return app;
}

export { build };
