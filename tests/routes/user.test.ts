import { build } from "../helper";

describe("user routes tests", () => {
  const app = build();

  test("index route test", async () => {
    const res = await app.inject({
      url: "/user",
    });

    expect(JSON.parse(res.payload)).toEqual({ user: [] });
  });
});
