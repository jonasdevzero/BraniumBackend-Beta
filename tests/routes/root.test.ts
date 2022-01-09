import { build } from "../helper";

describe("root tests", () => {
  const app = build();

  test("default root test", async () => {
    const res = await app.inject({
      url: "/",
    });

    expect(JSON.parse(res.payload)).toEqual({ message: "ok" });
  });
});
