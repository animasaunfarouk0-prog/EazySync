import { auth, request, app, makeOrg } from "./helpers.js";

describe("PAYROLL", () => {
  let org;
  beforeEach(async () => {
    org = await makeOrg();
  });

  const structurePayload = (overrides = {}) => ({
    employeeId: org.empEmployee.id,
    basicSalary: 100000,
    housingAllowance: 20000,
    transportAllowance: 10000,
    otherAllowance: 5000,
    pensionRate: 8,
    taxRate: 10,
    nhfRate: 2.5,
    effectiveFrom: "2026-01-01",
    ...overrides,
  });

  it("hr creates and lists salary structures", async () => {
    const res = await request(app)
      .post("/api/v1/payroll/salary-structures")
      .set(auth(org.hrToken))
      .send(structurePayload());
    expect(res.status).toBe(201);
    expect(Number(res.body.basicSalary)).toBe(100000);

    const list = await request(app)
      .get("/api/v1/payroll/salary-structures")
      .set(auth(org.hrToken));
    expect(list.status).toBe(200);
    expect(list.body.some((s) => s.id === res.body.id)).toBe(true);
  });

  it("manager cannot manage salary structures (403)", async () => {
    const res = await request(app)
      .post("/api/v1/payroll/salary-structures")
      .set(auth(org.mgrToken))
      .send(structurePayload());
    expect(res.status).toBe(403);
  });

  it("hr updates a salary structure", async () => {
    const created = await request(app)
      .post("/api/v1/payroll/salary-structures")
      .set(auth(org.hrToken))
      .send(structurePayload());
    const res = await request(app)
      .patch(`/api/v1/payroll/salary-structures/${created.body.id}`)
      .set(auth(org.hrToken))
      .send({ basicSalary: 150000 });
    expect(res.status).toBe(200);
    expect(Number(res.body.basicSalary)).toBe(150000);
  });

  it("cannot create a structure for an employee outside the company (404)", async () => {
    const orgB = await makeOrg();
    const res = await request(app)
      .post("/api/v1/payroll/salary-structures")
      .set(auth(org.hrToken))
      .send(structurePayload({ employeeId: orgB.empEmployee.id }));
    expect(res.status).toBe(404);
  });

  it("run payroll generates payslips with computed net salary", async () => {
    await request(app)
      .post("/api/v1/payroll/salary-structures")
      .set(auth(org.hrToken))
      .send(structurePayload());

    const run = await request(app)
      .post("/api/v1/payroll/run")
      .set(auth(org.hrToken))
      .send({ month: 1, year: 2026 });
    expect(run.status).toBe(201);
    expect(run.body.generated).toBe(1);
    expect(run.body.total).toBe(2);

    const payslips = await request(app)
      .get("/api/v1/payroll/payslips?month=1&year=2026")
      .set(auth(org.hrToken));
    expect(payslips.body.length).toBe(1);

    const p = payslips.body[0];
    expect(Number(p.grossEarnings)).toBe(135000);
    expect(Number(p.pensionDeduction)).toBe(10800);
    expect(Number(p.taxDeduction)).toBe(13500);
    expect(Number(p.nhfDeduction)).toBe(3375);
    expect(Number(p.netSalary)).toBe(107325);
    expect(p.status).toBe("generated");
  });

  it("re-running payroll for the same month skips existing payslips", async () => {
    await request(app)
      .post("/api/v1/payroll/salary-structures")
      .set(auth(org.hrToken))
      .send(structurePayload());

    await request(app)
      .post("/api/v1/payroll/run")
      .set(auth(org.hrToken))
      .send({ month: 2, year: 2026 });
    const again = await request(app)
      .post("/api/v1/payroll/run")
      .set(auth(org.hrToken))
      .send({ month: 2, year: 2026 });
    expect(again.body.generated).toBe(0);
    expect(again.body.skipped).toBe(2);
  });

  it("employee sees only their own payslips", async () => {
    await request(app)
      .post("/api/v1/payroll/salary-structures")
      .set(auth(org.hrToken))
      .send(structurePayload());
    await request(app)
      .post("/api/v1/payroll/salary-structures")
      .set(auth(org.hrToken))
      .send(structurePayload({ employeeId: org.mgrEmployee.id }));
    await request(app)
      .post("/api/v1/payroll/run")
      .set(auth(org.hrToken))
      .send({ month: 3, year: 2026 });

    const mine = await request(app)
      .get("/api/v1/payroll/payslips/me")
      .set(auth(org.empToken));
    expect(mine.status).toBe(200);
    expect(mine.body.length).toBe(1);
    expect(mine.body[0].employeeId).toBe(org.empEmployee.id);
  });

  it("employee cannot view another employee's payslip (403)", async () => {
    await request(app)
      .post("/api/v1/payroll/salary-structures")
      .set(auth(org.hrToken))
      .send(structurePayload({ employeeId: org.mgrEmployee.id }));
    await request(app)
      .post("/api/v1/payroll/run")
      .set(auth(org.hrToken))
      .send({ month: 4, year: 2026 });

    const other = await request(app)
      .get("/api/v1/payroll/payslips")
      .set(auth(org.hrToken));
    const mgrPayslip = other.body[0];

    const res = await request(app)
      .get(`/api/v1/payroll/payslips/${mgrPayslip.id}`)
      .set(auth(org.empToken));
    expect(res.status).toBe(403);
  });

  it("hr marks a payslip as paid; double mark returns 409", async () => {
    await request(app)
      .post("/api/v1/payroll/salary-structures")
      .set(auth(org.hrToken))
      .send(structurePayload());
    await request(app)
      .post("/api/v1/payroll/run")
      .set(auth(org.hrToken))
      .send({ month: 5, year: 2026 });

    const payslips = await request(app)
      .get("/api/v1/payroll/payslips")
      .set(auth(org.hrToken));
    const id = payslips.body[0].id;

    const paid = await request(app)
      .patch(`/api/v1/payroll/payslips/${id}/mark-paid`)
      .set(auth(org.hrToken));
    expect(paid.status).toBe(200);
    expect(paid.body.status).toBe("paid");
    expect(paid.body.paidOn).toBeDefined();

    const again = await request(app)
      .patch(`/api/v1/payroll/payslips/${id}/mark-paid`)
      .set(auth(org.hrToken));
    expect(again.status).toBe(409);
  });

  it("manager cannot run payroll (403) but can view payslips", async () => {
    await request(app)
      .post("/api/v1/payroll/salary-structures")
      .set(auth(org.hrToken))
      .send(structurePayload());
    await request(app)
      .post("/api/v1/payroll/run")
      .set(auth(org.hrToken))
      .send({ month: 6, year: 2026 });

    const run = await request(app)
      .post("/api/v1/payroll/run")
      .set(auth(org.mgrToken))
      .send({ month: 7, year: 2026 });
    expect(run.status).toBe(403);

    const list = await request(app)
      .get("/api/v1/payroll/payslips")
      .set(auth(org.mgrToken));
    expect(list.status).toBe(200);
  });

  it("payroll is scoped to the tenant", async () => {
    await request(app)
      .post("/api/v1/payroll/salary-structures")
      .set(auth(org.hrToken))
      .send(structurePayload());
    await request(app)
      .post("/api/v1/payroll/run")
      .set(auth(org.hrToken))
      .send({ month: 8, year: 2026 });

    const orgB = await makeOrg();
    const list = await request(app)
      .get("/api/v1/payroll/payslips")
      .set(auth(orgB.hrToken));
    expect(list.status).toBe(200);
    expect(list.body.length).toBe(0);
  });

  it("run payroll validates month range", async () => {
    const res = await request(app)
      .post("/api/v1/payroll/run")
      .set(auth(org.hrToken))
      .send({ month: 13, year: 2026 });
    expect(res.status).toBe(400);
  });
});
