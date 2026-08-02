import { auth, request, app, makeOrg, createUser, uniqueEmail } from "./helpers.js";

describe("EMPLOYEES", () => {
  it("hr_admin creates an employee with an auto-generated code", async () => {
    const org = await makeOrg();
    const freshUser = await createUser({
      roleName: "employee",
      companyId: org.company.id,
      email: uniqueEmail("fresh"),
    });
    const res = await request(app)
      .post("/api/v1/employees")
      .set(auth(org.hrToken))
      .send({
        userId: freshUser.id,
        firstName: "John",
        lastName: "Smith",
        departmentId: org.department.id,
        position: "Software Engineer",
        employmentType: "full_time",
      });
    expect(res.status).toBe(201);
    expect(res.body.employeeCode).toMatch(/^EMP\d{3}$/);
    expect(res.body.firstName).toBe("John");
  });

  it("duplicate employee record for same user returns 409", async () => {
    const org = await makeOrg();
    const body = {
      userId: org.empUser.id,
      firstName: "A",
      lastName: "B",
      departmentId: org.department.id,
    };
    await request(app).post("/api/v1/employees").set(auth(org.hrToken)).send(body);
    const res = await request(app)
      .post("/api/v1/employees")
      .set(auth(org.hrToken))
      .send(body);
    expect(res.status).toBe(409);
  });

  it("cannot create employee for user outside the company (404)", async () => {
    const orgA = await makeOrg();
    const orgB = await makeOrg();
    const res = await request(app)
      .post("/api/v1/employees")
      .set(auth(orgA.hrToken))
      .send({ userId: orgB.empUser.id, firstName: "X", lastName: "Y" });
    expect(res.status).toBe(404);
  });

  it("employee can view their own record, manager and hr can view others", async () => {
    const org = await makeOrg();

    const self = await request(app)
      .get(`/api/v1/employees/${org.empEmployee.id}`)
      .set(auth(org.empToken));
    expect(self.status).toBe(200);
    expect(self.body.id).toBe(org.empEmployee.id);

    const byMgr = await request(app)
      .get(`/api/v1/employees/${org.empEmployee.id}`)
      .set(auth(org.mgrToken));
    expect(byMgr.status).toBe(200);

    const byHr = await request(app)
      .get(`/api/v1/employees/${org.empEmployee.id}`)
      .set(auth(org.hrToken));
    expect(byHr.status).toBe(200);
  });

  it("employee cannot view another employee's record (403)", async () => {
    const org = await makeOrg();
    const res = await request(app)
      .get(`/api/v1/employees/${org.mgrEmployee.id}`)
      .set(auth(org.empToken));
    expect(res.status).toBe(403);
  });

  it("hr_admin can update and delete an employee", async () => {
    const org = await makeOrg();
    const upd = await request(app)
      .patch(`/api/v1/employees/${org.empEmployee.id}`)
      .set(auth(org.hrToken))
      .send({ position: "Senior Engineer", status: "inactive" });
    expect(upd.status).toBe(200);
    expect(upd.body.position).toBe("Senior Engineer");

    const del = await request(app)
      .delete(`/api/v1/employees/${org.empEmployee.id}`)
      .set(auth(org.hrToken));
    expect(del.status).toBe(200);
  });

  it("employee self-update is restricted to safe fields", async () => {
    const org = await makeOrg();
    const res = await request(app)
      .patch(`/api/v1/employees/${org.empEmployee.id}`)
      .set(auth(org.empToken))
      .send({ phoneNumber: "08011111111" });
    expect(res.status).toBe(200);

    const blocked = await request(app)
      .patch(`/api/v1/employees/${org.empEmployee.id}`)
      .set(auth(org.empToken))
      .send({ position: "CEO" });
    expect(blocked.status).toBe(400);
  });

  it("manager can list employees", async () => {
    const org = await makeOrg();
    const res = await request(app)
      .get("/api/v1/employees")
      .set(auth(org.mgrToken));
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it("employees are scoped to the tenant", async () => {
    const orgA = await makeOrg();
    const orgB = await makeOrg();
    const res = await request(app)
      .get(`/api/v1/employees/${orgA.empEmployee.id}`)
      .set(auth(orgB.hrToken));
    expect(res.status).toBe(404);
  });
});
