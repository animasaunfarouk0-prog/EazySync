import { auth, request, app, makeOrg } from "./helpers.js";

describe("DEPARTMENTS", () => {
  it("hr_admin can create, list and update departments", async () => {
    const org = await makeOrg();
    const created = await request(app)
      .post("/api/v1/departments")
      .set(auth(org.hrToken))
      .send({ name: "Marketing" });
    expect(created.status).toBe(201);
    expect(created.body.name).toBe("Marketing");

    const list = await request(app)
      .get("/api/v1/departments")
      .set(auth(org.hrToken));
    expect(list.status).toBe(200);
    expect(list.body.some((d) => d.name === "Marketing")).toBe(true);

    const updated = await request(app)
      .patch(`/api/v1/departments/${created.body.id}`)
      .set(auth(org.hrToken))
      .send({ name: "Growth" });
    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe("Growth");
  });

  it("hr_admin can delete a department", async () => {
    const org = await makeOrg();
    const created = await request(app)
      .post("/api/v1/departments")
      .set(auth(org.hrToken))
      .send({ name: "Temp Dept" });
    const res = await request(app)
      .delete(`/api/v1/departments/${created.body.id}`)
      .set(auth(org.hrToken));
    expect(res.status).toBe(200);
  });

  it("employee cannot create a department (403)", async () => {
    const org = await makeOrg();
    const res = await request(app)
      .post("/api/v1/departments")
      .set(auth(org.empToken))
      .send({ name: "Nope" });
    expect(res.status).toBe(403);
  });

  it("manager can list departments", async () => {
    const org = await makeOrg();
    const res = await request(app)
      .get("/api/v1/departments")
      .set(auth(org.mgrToken));
    expect(res.status).toBe(200);
  });

  it("departments are scoped to the tenant", async () => {
    const orgA = await makeOrg();
    const orgB = await makeOrg();
    const inB = await request(app)
      .post("/api/v1/departments")
      .set(auth(orgB.hrToken))
      .send({ name: "OrgB Only" });
    const listA = await request(app)
      .get("/api/v1/departments")
      .set(auth(orgA.hrToken));
    expect(listA.body.some((d) => d.id === inB.body.id)).toBe(false);
  });
});
