import { auth, request, app, makeOrg } from "./helpers.js";

describe("ATTENDANCE", () => {
  let org;
  beforeEach(async () => {
    org = await makeOrg();
  });

  it("employee clocks in (status present or late)", async () => {
    const res = await request(app)
      .post("/api/v1/attendance/clock-in")
      .set(auth(org.empToken));
    expect(res.status).toBe(200);
    expect(["present", "late"]).toContain(res.body.status);
    expect(res.body.clockIn).toBeDefined();
  });

  it("duplicate clock-in returns 409", async () => {
    await request(app).post("/api/v1/attendance/clock-in").set(auth(org.empToken));
    const res = await request(app)
      .post("/api/v1/attendance/clock-in")
      .set(auth(org.empToken));
    expect(res.status).toBe(409);
  });

  it("clock-out without clock-in returns 400", async () => {
    const res = await request(app)
      .post("/api/v1/attendance/clock-out")
      .set(auth(org.empToken));
    expect(res.status).toBe(400);
  });

  it("employee clocks in then out", async () => {
    await request(app).post("/api/v1/attendance/clock-in").set(auth(org.empToken));
    const res = await request(app)
      .post("/api/v1/attendance/clock-out")
      .set(auth(org.empToken));
    expect(res.status).toBe(200);
    expect(res.body.clockOut).toBeDefined();
  });

  it("manager cannot clock in (403)", async () => {
    const res = await request(app)
      .post("/api/v1/attendance/clock-in")
      .set(auth(org.mgrToken));
    expect(res.status).toBe(403);
  });

  it("hr manually creates an attendance record for an employee", async () => {
    const res = await request(app)
      .post("/api/v1/attendance")
      .set(auth(org.hrToken))
      .send({
        employeeId: org.empEmployee.id,
        date: "2026-07-15",
        status: "on_leave",
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("on_leave");

    const dup = await request(app)
      .post("/api/v1/attendance")
      .set(auth(org.hrToken))
      .send({
        employeeId: org.empEmployee.id,
        date: "2026-07-15",
        status: "present",
      });
    expect(dup.status).toBe(409);
  });

  it("hr and manager can list records; manager can create", async () => {
    await request(app)
      .post("/api/v1/attendance")
      .set(auth(org.hrToken))
      .send({ employeeId: org.empEmployee.id, date: "2026-07-15", status: "present" });
    await request(app)
      .post("/api/v1/attendance")
      .set(auth(org.mgrToken))
      .send({ employeeId: org.mgrEmployee.id, date: "2026-07-16", status: "absent" });

    const res = await request(app)
      .get("/api/v1/attendance")
      .set(auth(org.hrToken));
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it("employee /me only returns their own records", async () => {
    await request(app)
      .post("/api/v1/attendance")
      .set(auth(org.hrToken))
      .send({ employeeId: org.empEmployee.id, date: "2026-07-15", status: "present" });
    await request(app)
      .post("/api/v1/attendance")
      .set(auth(org.hrToken))
      .send({ employeeId: org.mgrEmployee.id, date: "2026-07-16", status: "present" });

    const res = await request(app)
      .get("/api/v1/attendance/me")
      .set(auth(org.empToken));
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].employeeId).toBe(org.empEmployee.id);
  });

  it("employee cannot list all records (403)", async () => {
    const res = await request(app)
      .get("/api/v1/attendance")
      .set(auth(org.empToken));
    expect(res.status).toBe(403);
  });

  it("employee can fetch their own record but not another's", async () => {
    const mine = await request(app)
      .post("/api/v1/attendance")
      .set(auth(org.hrToken))
      .send({ employeeId: org.empEmployee.id, date: "2026-07-15", status: "present" });
    const other = await request(app)
      .post("/api/v1/attendance")
      .set(auth(org.hrToken))
      .send({ employeeId: org.mgrEmployee.id, date: "2026-07-16", status: "present" });

    const ok = await request(app)
      .get(`/api/v1/attendance/${mine.body.id}`)
      .set(auth(org.empToken));
    expect(ok.status).toBe(200);

    const denied = await request(app)
      .get(`/api/v1/attendance/${other.body.id}`)
      .set(auth(org.empToken));
    expect(denied.status).toBe(403);
  });

  it("manager corrects a record", async () => {
    const rec = await request(app)
      .post("/api/v1/attendance")
      .set(auth(org.hrToken))
      .send({ employeeId: org.empEmployee.id, date: "2026-07-15", status: "late" });
    const res = await request(app)
      .patch(`/api/v1/attendance/${rec.body.id}`)
      .set(auth(org.mgrToken))
      .send({ status: "present" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("present");
  });

  it("attendance is scoped to the tenant", async () => {
    const rec = await request(app)
      .post("/api/v1/attendance")
      .set(auth(org.hrToken))
      .send({ employeeId: org.empEmployee.id, date: "2026-07-15", status: "present" });
    const orgB = await makeOrg();
    const list = await request(app)
      .get("/api/v1/attendance")
      .set(auth(orgB.hrToken));
    expect(list.status).toBe(200);
    expect(list.body.length).toBe(0);

    const get = await request(app)
      .get(`/api/v1/attendance/${rec.body.id}`)
      .set(auth(orgB.hrToken));
    expect(get.status).toBe(404);
  });

  it("manual record stores clockIn/clockOut times", async () => {
    const res = await request(app)
      .post("/api/v1/attendance")
      .set(auth(org.hrToken))
      .send({
        employeeId: org.empEmployee.id,
        date: "2026-07-15",
        status: "present",
        clockIn: "09:00:00",
        clockOut: "17:30:00",
      });
    expect(res.status).toBe(201);
    expect(res.body.clockIn).toBeDefined();
    expect(res.body.clockOut).toBeDefined();
  });
});
