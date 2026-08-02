import { auth, request, app, makeOrg, prisma, createUser, uniqueEmail, loginAs } from "./helpers.js";

describe("LEAVE (Person 3)", () => {
  let org;
  beforeEach(async () => {
    org = await makeOrg();
  });

  const year = new Date().getFullYear();
  const days = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  };

  it("hr creates a leave type; duplicate is 409", async () => {
    const res = await request(app)
      .post("/api/v1/leave/types")
      .set(auth(org.hrToken))
      .send({ name: "Sick Leave", defaultDays: 10 });
    expect(res.status).toBe(201);

    const dup = await request(app)
      .post("/api/v1/leave/types")
      .set(auth(org.hrToken))
      .send({ name: "Sick Leave" });
    expect(dup.status).toBe(409);
  });

  it("hr creates a balance; duplicate for same year is 409", async () => {
    const type = await request(app)
      .post("/api/v1/leave/types")
      .set(auth(org.hrToken))
      .send({ name: "Annual Leave", defaultDays: 21 });

    const res = await request(app)
      .post(`/api/v1/leave/types/${type.body.id}/balances`)
      .set(auth(org.hrToken))
      .send({ employeeId: org.empEmployee.id, year, totalDays: 21 });
    expect(res.status).toBe(201);
    expect(Number(res.body.totalDays)).toBe(21);

    const dup = await request(app)
      .post(`/api/v1/leave/types/${type.body.id}/balances`)
      .set(auth(org.hrToken))
      .send({ employeeId: org.empEmployee.id, year, totalDays: 21 });
    expect(dup.status).toBe(409);
  });

  it("employee creates a leave request (single transaction history entry)", async () => {
    const type = await request(app)
      .post("/api/v1/leave/types")
      .set(auth(org.hrToken))
      .send({ name: "Annual Leave" });
    await request(app)
      .post(`/api/v1/leave/types/${type.body.id}/balances`)
      .set(auth(org.hrToken))
      .send({ employeeId: org.empEmployee.id, year, totalDays: 21 });

    const res = await request(app)
      .post("/api/v1/leave/requests")
      .set(auth(org.empToken))
      .send({
        leaveTypeId: type.body.id,
        startDate: `${year}-08-15`,
        endDate: `${year}-08-17`,
        reason: "Vacation",
      });
    expect(res.status).toBe(201);
    expect(Number(res.body.totalDays)).toBe(3);
    expect(res.body.status).toBe("pending");

    const history = await prisma.leaveApprovalHistory.findMany({
      where: { leaveRequestId: res.body.id },
    });
    expect(history.map((h) => h.action)).toEqual(["submitted"]);
  });

  it("rejects a request exceeding the available balance", async () => {
    const type = await request(app)
      .post("/api/v1/leave/types")
      .set(auth(org.hrToken))
      .send({ name: "Annual Leave" });
    await request(app)
      .post(`/api/v1/leave/types/${type.body.id}/balances`)
      .set(auth(org.hrToken))
      .send({ employeeId: org.empEmployee.id, year, totalDays: 2 });

    const res = await request(app)
      .post("/api/v1/leave/requests")
      .set(auth(org.empToken))
      .send({
        leaveTypeId: type.body.id,
        startDate: `${year}-08-15`,
        endDate: `${year}-08-17`,
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Insufficient leave balance/i);
  });

  it("manager approves a pending request; balance moves pending -> used; history appends", async () => {
    const type = await request(app)
      .post("/api/v1/leave/types")
      .set(auth(org.hrToken))
      .send({ name: "Annual Leave" });
    const balance = await request(app)
      .post(`/api/v1/leave/types/${type.body.id}/balances`)
      .set(auth(org.hrToken))
      .send({ employeeId: org.empEmployee.id, year, totalDays: 21 });
    const req = await request(app)
      .post("/api/v1/leave/requests")
      .set(auth(org.empToken))
      .send({
        leaveTypeId: type.body.id,
        startDate: `${year}-08-15`,
        endDate: `${year}-08-17`,
      });

    const res = await request(app)
      .patch(`/api/v1/leave/requests/${req.body.id}/approve`)
      .set(auth(org.mgrToken))
      .send({ comment: "Approved, enjoy!" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("approved");

    const balanceAfter = await prisma.leaveBalance.findUnique({
      where: { id: balance.body.id },
    });
    expect(Number(balanceAfter.pendingDays)).toBe(0);
    expect(Number(balanceAfter.usedDays)).toBe(3);

    const detail = await request(app)
      .get(`/api/v1/leave/requests/${req.body.id}`)
      .set(auth(org.mgrToken));
    expect(
      detail.body.approvalHistory.map((h) => h.action)
    ).toEqual(["submitted", "approved"]);
  });

  it("cannot approve a non-pending request", async () => {
    const type = await request(app)
      .post("/api/v1/leave/types")
      .set(auth(org.hrToken))
      .send({ name: "Annual Leave" });
    const req = await request(app)
      .post("/api/v1/leave/requests")
      .set(auth(org.empToken))
      .send({
        leaveTypeId: type.body.id,
        startDate: `${year}-08-15`,
        endDate: `${year}-08-17`,
      });
    await request(app)
      .patch(`/api/v1/leave/requests/${req.body.id}/approve`)
      .set(auth(org.mgrToken))
      .send({});
    const again = await request(app)
      .patch(`/api/v1/leave/requests/${req.body.id}/approve`)
      .set(auth(org.mgrToken))
      .send({});
    expect(again.status).toBe(400);
  });

  it("employee cannot approve leave; reject releases pending days", async () => {
    const type = await request(app)
      .post("/api/v1/leave/types")
      .set(auth(org.hrToken))
      .send({ name: "Annual Leave" });
    const balance = await request(app)
      .post(`/api/v1/leave/types/${type.body.id}/balances`)
      .set(auth(org.hrToken))
      .send({ employeeId: org.empEmployee.id, year, totalDays: 21 });
    const req = await request(app)
      .post("/api/v1/leave/requests")
      .set(auth(org.empToken))
      .send({
        leaveTypeId: type.body.id,
        startDate: `${year}-08-15`,
        endDate: `${year}-08-17`,
      });

    const denied = await request(app)
      .patch(`/api/v1/leave/requests/${req.body.id}/approve`)
      .set(auth(org.empToken))
      .send({});
    expect(denied.status).toBe(403);

    const rejected = await request(app)
      .patch(`/api/v1/leave/requests/${req.body.id}/reject`)
      .set(auth(org.mgrToken))
      .send({ comment: "Too busy" });
    expect(rejected.status).toBe(200);

    const balanceAfter = await prisma.leaveBalance.findUnique({
      where: { id: balance.body.id },
    });
    expect(Number(balanceAfter.pendingDays)).toBe(0);
  });

  it("employee can cancel own pending request; cannot cancel another's", async () => {
    const type = await request(app)
      .post("/api/v1/leave/types")
      .set(auth(org.hrToken))
      .send({ name: "Annual Leave" });
    await request(app)
      .post(`/api/v1/leave/types/${type.body.id}/balances`)
      .set(auth(org.hrToken))
      .send({ employeeId: org.empEmployee.id, year, totalDays: 21 });
    const req = await request(app)
      .post("/api/v1/leave/requests")
      .set(auth(org.empToken))
      .send({
        leaveTypeId: type.body.id,
        startDate: `${year}-08-15`,
        endDate: `${year}-08-17`,
      });

    const mgrCancel = await request(app)
      .patch(`/api/v1/leave/requests/${req.body.id}/cancel`)
      .set(auth(org.mgrToken))
      .send({ reason: "nope" });
    expect(mgrCancel.status).toBe(403);

    const ok = await request(app)
      .patch(`/api/v1/leave/requests/${req.body.id}/cancel`)
      .set(auth(org.empToken))
      .send({ reason: "Changed plans" });
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe("cancelled");
  });

  it("employee listing only shows their own requests", async () => {
    const type = await request(app)
      .post("/api/v1/leave/types")
      .set(auth(org.hrToken))
      .send({ name: "Annual Leave" });

    const empReq = await request(app)
      .post("/api/v1/leave/requests")
      .set(auth(org.empToken))
      .send({ leaveTypeId: type.body.id, startDate: `${year}-08-15`, endDate: `${year}-08-17` });

    const otherUser = await createUser({
      roleName: "employee",
      companyId: org.company.id,
      email: uniqueEmail("other"),
    });
    const otherEmp = await request(app)
      .post("/api/v1/employees")
      .set(auth(org.hrToken))
      .send({ userId: otherUser.id, firstName: "Other", lastName: "Employee", departmentId: org.department.id });
    const otherToken = await loginAs(otherUser);
    const otherReq = await request(app)
      .post("/api/v1/leave/requests")
      .set(auth(otherToken))
      .send({ leaveTypeId: type.body.id, startDate: `${year}-09-01`, endDate: `${year}-09-02` });
    expect(otherReq.status).toBe(201);

    const mine = await request(app)
      .get("/api/v1/leave/requests")
      .set(auth(org.empToken));
    expect(mine.status).toBe(200);
    expect(mine.body.some((r) => r.id === empReq.body.id)).toBe(true);
    expect(mine.body.some((r) => r.id === otherReq.body.id)).toBe(false);

    const all = await request(app)
      .get("/api/v1/leave/requests")
      .set(auth(org.hrToken));
    expect(all.body.some((r) => r.id === otherReq.body.id)).toBe(true);
  });

  it("employee balance endpoint returns balance with leave type", async () => {
    const type = await request(app)
      .post("/api/v1/leave/types")
      .set(auth(org.hrToken))
      .send({ name: "Annual Leave" });
    await request(app)
      .post(`/api/v1/leave/types/${type.body.id}/balances`)
      .set(auth(org.hrToken))
      .send({ employeeId: org.empEmployee.id, year, totalDays: 21 });

    const res = await request(app)
      .get("/api/v1/leave/balance")
      .set(auth(org.empToken));
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].leaveType.name).toBe("Annual Leave");
  });

  it("dashboard, calendar and types endpoints respond", async () => {
    const dash = await request(app)
      .get("/api/v1/leave/dashboard")
      .set(auth(org.hrToken));
    expect(dash.status).toBe(200);
    expect(dash.body).toHaveProperty("pendingCount");

    const cal = await request(app)
      .get(`/api/v1/leave/calendar?month=${new Date().getMonth() + 1}&year=${year}`)
      .set(auth(org.mgrToken));
    expect(cal.status).toBe(200);
    expect(Array.isArray(cal.body)).toBe(true);

    const types = await request(app)
      .get("/api/v1/leave/types")
      .set(auth(org.mgrToken));
    expect(types.status).toBe(200);
  });
});
