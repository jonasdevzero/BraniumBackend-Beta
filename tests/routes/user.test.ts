import { build } from "../helper";
import { getRepository } from "typeorm";
import { PreRegistration } from "../../src/api/models";

describe("user routes tests", () => {
  const app = build();
  let jwt = "";

  test("index route test", async () => {
    const res = await app.inject({
      url: "/user",
    });

    expect(JSON.parse(res.payload)).toEqual({ user: [] });
  });

  test("preRegistration route test", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/user/pre_registration",
      payload: {
        name: "test",
        email: "devtest@test.com",
      },
    });

    expect(res.statusCode).toEqual(201);
  });

  test("registration route test", async () => {
    const [registration] = await getRepository(PreRegistration).find();

    const res = await app.inject({
      method: "POST",
      url: `/user/registration/${registration.id}`,
      payload: {
        username: "devtest",
        password: "123456",
        confirm_password: "123456",
      },
    });

    const { token } = JSON.parse(res.payload);
    jwt = `Bearer ${token}`;

    expect(res.statusCode).toEqual(201);
  });

  test("auth route test", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/user/auth",
      headers: {
        authorization: jwt,
      },
    });

    const { user } = JSON.parse(res.payload);
    const { name, username, email } = user;

    expect(res.statusCode).toEqual(200);
    expect({
      name: "test",
      username: "devtest",
      email: "devtest@test.com",
    }).toEqual({ name, username, email });
  });
});
