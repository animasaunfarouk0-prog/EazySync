import { auth, request, app, makeOrg, createUser, loginAs, uniqueEmail } from "./helpers.js";

describe("COMPANIES", () => {
  it("super_admin can create a company and gets new tokens", async () => {
    const superUser = await createUser({ roleName: "super_admin", email: uniqueEmail("super") });
    const token = await loginAs(superUser);
    const res = await request(app)
      .post("/api/v1/companies")
      .set(auth(token))
      .send({ name: "Global Corp" });
    expect(res.status).toBe(201);
    expect(res.body.company.name).toBe("Global Corp");
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it("non-super_admin cannot create a company", async () => {
    const org = await makeOrg();
    const res = await request(app)
      .post("/api/v1/companies")
      .set(auth(org.hrToken))
      .send({ name: "Nope" });
    expect(res.status).toBe(403);
  });

  it("hr_admin can fetch their own company", async () => {
    const org = await makeOrg();
    const res = await request(app)
      .get(`/api/v1/companies/${org.company.id}`)
      .set(auth(org.hrToken));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(org.company.id);
  });

  it("hr_admin cannot fetch another company", async () => {
    const orgA = await makeOrg();
    const orgB = await makeOrg();
    const res = await request(app)
      .get(`/api/v1/companies/${orgA.company.id}`)
      .set(auth(orgB.hrToken));
    expect(res.status).toBe(403);
  });

  it("hr_admin can update their company name", async () => {
    const org = await makeOrg();
    const res = await request(app)
      .patch(`/api/v1/companies/${org.company.id}`)
      .set(auth(org.hrToken))
      .send({ name: "Acme Renamed" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Acme Renamed");
  });

  it("requires auth", async () => {
    const res = await request(app).get("/api/v1/companies/1");
    expect(res.status).toBe(401);
  });
});
