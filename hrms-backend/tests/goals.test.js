import { auth, request, app, makeOrg } from "./helpers.js";

describe("GOALS (Person 4)", () => {
  let org;
  beforeEach(async () => {
    org = await makeOrg();
  });

  const year = new Date().getFullYear();
  const goalPayload = (overrides = {}) => ({
    employeeId: org.empEmployee.id,
    goalOwnerId: org.mgrEmployee.id,
    departmentId: org.department.id,
    title: "Ship the mobile app",
    category: "Product",
    weight: 30,
    year,
    ...overrides,
  });

  it("manager creates a goal for an employee", async () => {
    const res = await request(app)
      .post("/api/v1/goals")
      .set(auth(org.mgrToken))
      .send(goalPayload());
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Ship the mobile app");
    expect(res.body.status).toBe("on_track");
    expect(Number(res.body.progress)).toBe(0);
  });

  it("employee cannot create goals (403)", async () => {
    const res = await request(app)
      .post("/api/v1/goals")
      .set(auth(org.empToken))
      .send(goalPayload());
    expect(res.status).toBe(403);
  });

  it("employee only sees their own goals; manager sees all", async () => {
    await request(app)
      .post("/api/v1/goals")
      .set(auth(org.mgrToken))
      .send(goalPayload({ title: "Employee goal" }));
    await request(app)
      .post("/api/v1/goals")
      .set(auth(org.mgrToken))
      .send(goalPayload({ employeeId: org.mgrEmployee.id, title: "Manager goal" }));

    const mine = await request(app)
      .get("/api/v1/goals")
      .set(auth(org.empToken));
    expect(mine.status).toBe(200);
    expect(mine.body.some((g) => g.title === "Employee goal")).toBe(true);
    expect(mine.body.some((g) => g.title === "Manager goal")).toBe(false);

    const all = await request(app)
      .get("/api/v1/goals")
      .set(auth(org.mgrToken));
    expect(all.body.some((g) => g.title === "Manager goal")).toBe(true);
  });

  it("employee cannot view another employee's goal (403)", async () => {
    const goal = await request(app)
      .post("/api/v1/goals")
      .set(auth(org.mgrToken))
      .send(goalPayload({ employeeId: org.mgrEmployee.id }));
    const res = await request(app)
      .get(`/api/v1/goals/${goal.body.id}`)
      .set(auth(org.empToken));
    expect(res.status).toBe(403);
  });

  it("employee can update their own goal progress", async () => {
    const goal = await request(app)
      .post("/api/v1/goals")
      .set(auth(org.mgrToken))
      .send(goalPayload());
    const res = await request(app)
      .patch(`/api/v1/goals/${goal.body.id}`)
      .set(auth(org.empToken))
      .send({ progress: 50, status: "at_risk" });
    expect(res.status).toBe(200);
    expect(Number(res.body.progress)).toBe(50);
  });

  it("employee cannot update another employee's goal (403)", async () => {
    const goal = await request(app)
      .post("/api/v1/goals")
      .set(auth(org.mgrToken))
      .send(goalPayload({ employeeId: org.mgrEmployee.id }));
    const res = await request(app)
      .patch(`/api/v1/goals/${goal.body.id}`)
      .set(auth(org.empToken))
      .send({ progress: 10 });
    expect(res.status).toBe(403);
  });

  it("goals are scoped to the tenant", async () => {
    const goal = await request(app)
      .post("/api/v1/goals")
      .set(auth(org.mgrToken))
      .send(goalPayload());
    const orgB = await makeOrg();
    const res = await request(app)
      .get(`/api/v1/goals/${goal.body.id}`)
      .set(auth(orgB.hrToken));
    expect(res.status).toBe(404);
  });

  it("creating a goal for an employee outside the company is 404", async () => {
    const orgB = await makeOrg();
    const res = await request(app)
      .post("/api/v1/goals")
      .set(auth(org.mgrToken))
      .send(goalPayload({ employeeId: orgB.empEmployee.id }));
    expect(res.status).toBe(404);
  });
});
