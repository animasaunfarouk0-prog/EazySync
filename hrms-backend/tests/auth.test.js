import { auth, prisma, request, app, uniqueEmail } from "./helpers.js";

describe("AUTH", () => {
  describe("POST /api/v1/auth/register", () => {
    it("registers a user successfully and returns tokens", async () => {
      const email = uniqueEmail("reg");
      const res = await request(app).post("/api/v1/auth/register").send({
        email,
        password: "Password123!",
        firstName: "Test",
        lastName: "User",
        roleName: "employee",
      });
      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe(email);
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it("rejects duplicate email with 409", async () => {
      const email = uniqueEmail("dup");
      const body = {
        email,
        password: "Password123!",
        firstName: "A",
        lastName: "B",
        roleName: "employee",
      };
      await request(app).post("/api/v1/auth/register").send(body);
      const res = await request(app).post("/api/v1/auth/register").send(body);
      expect(res.status).toBe(409);
      expect(res.body.error).toBeDefined();
    });

    it("rejects invalid roleName with 400", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: uniqueEmail("badrole"),
        password: "Password123!",
        firstName: "A",
        lastName: "B",
        roleName: "not_a_role",
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("rejects missing password with 400", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: uniqueEmail("nopass"),
        firstName: "A",
        lastName: "B",
        roleName: "employee",
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("logs in with correct credentials", async () => {
      const email = uniqueEmail("login");
      await request(app).post("/api/v1/auth/register").send({
        email,
        password: "Password123!",
        firstName: "A",
        lastName: "B",
        roleName: "hr_admin",
      });
      const res = await request(app).post("/api/v1/auth/login").send({
        email,
        password: "Password123!",
      });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe(email);
    });

    it("rejects wrong password with 401", async () => {
      const email = uniqueEmail("badpw");
      await request(app).post("/api/v1/auth/register").send({
        email,
        password: "Password123!",
        firstName: "A",
        lastName: "B",
        roleName: "employee",
      });
      const res = await request(app).post("/api/v1/auth/login").send({
        email,
        password: "WrongPass1!",
      });
      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it("rejects unknown email with 401", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "nobody@example.com",
        password: "Password123!",
      });
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    it("rotates refresh tokens", async () => {
      const email = uniqueEmail("refresh");
      const reg = await request(app).post("/api/v1/auth/register").send({
        email,
        password: "Password123!",
        firstName: "A",
        lastName: "B",
        roleName: "employee",
      });
      const refreshToken = reg.body.refreshToken;

      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.refreshToken).not.toBe(refreshToken);

      const reuse = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken });
      expect(reuse.status).toBe(401);
    });

    it("rejects a garbage token", async () => {
      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: "not-a-token" });
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/v1/auth/forgot-password + reset-password", () => {
    it("issues a reset token and allows password reset", async () => {
      const email = uniqueEmail("forgot");
      await request(app).post("/api/v1/auth/register").send({
        email,
        password: "Password123!",
        firstName: "A",
        lastName: "B",
        roleName: "employee",
      });

      const forgot = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email });
      expect(forgot.status).toBe(200);

      const user = await prisma.user.findUnique({ where: { email } });
      expect(user.resetToken).toBeDefined();

      const reset = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({ token: user.resetToken, newPassword: "NewPass123!" });
      expect(reset.status).toBe(200);

      const loginOld = await request(app).post("/api/v1/auth/login").send({
        email,
        password: "Password123!",
      });
      expect(loginOld.status).toBe(401);

      const loginNew = await request(app).post("/api/v1/auth/login").send({
        email,
        password: "NewPass123!",
      });
      expect(loginNew.status).toBe(200);
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("clears the refresh token", async () => {
      const email = uniqueEmail("logout");
      const reg = await request(app).post("/api/v1/auth/register").send({
        email,
        password: "Password123!",
        firstName: "A",
        lastName: "B",
        roleName: "employee",
      });
      const res = await request(app)
        .post("/api/v1/auth/logout")
        .set(auth(reg.body.accessToken));
      expect(res.status).toBe(200);

      const refresh = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: reg.body.refreshToken });
      expect(refresh.status).toBe(401);
    });
  });

  describe("POST /api/v1/auth/google", () => {
    it("rejects an invalid Google id token", async () => {
      const res = await request(app)
        .post("/api/v1/auth/google")
        .send({ idToken: "invalid-token" });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Invalid Google/i);
    });
  });
});
