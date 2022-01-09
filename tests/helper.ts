import App from "../src/app";

function build() {
  const app = App();

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(() => app.close());

  return app;
}

export { build };
