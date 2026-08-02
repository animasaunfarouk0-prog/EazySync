import { auth, request, app, makeOrg } from "./helpers.js";

describe("REPORTS (Person 4)", () => {
  let org;
  beforeEach(async () => {
    org = await makeOrg();
  });

  it("employee summary returns company counts", async () => {
    const res = await request(app)
      .get("/api/v1/reports/employee-summary")
      .set(auth(org.hrToken));
    expect(res.status).toBe(200);
    expect(res.body.totalEmployees).toBe(2);
    expect(res.body.activeEmployees).toBe(2);
    expect(res.body.departmentDistribution.length).toBeGreaterThan(0);
  });

  it("department summary returns departments with review rating", async () => {
    const res = await request(app)
      .get("/api/v1/reports/department")
      .set(auth(org.hrToken));
    expect(res.status).toBe(200);
    expect(res.body.some((d) => d.id === org.department.id)).toBe(true);
    expect(res.body[0]).toHaveProperty("_count");
  });

  it("leave report counts requests and groups by status", async () => {
    const type = await request(app)
      .post("/api/v1/leave/types")
      .set(auth(org.hrToken))
      .send({ name: "Annual Leave" });
    await request(app)
      .post("/api/v1/leave/requests")
      .set(auth(org.empToken))
      .send({
        leaveTypeId: type.body.id,
        startDate: "2026-08-15",
        endDate: "2026-08-17",
      });

    const res = await request(app)
      .get("/api/v1/reports/leave")
      .set(auth(org.hrToken));
    expect(res.status).toBe(200);
    expect(res.body.totalRequests).toBe(1);

    const byMgr = await request(app)
      .get("/api/v1/reports/leave")
      .set(auth(org.mgrToken));
    expect(byMgr.status).toBe(200);
  });

  it("attendance report returns summary and trend", async () => {
    const res = await request(app)
      .get("/api/v1/reports/attendance")
      .set(auth(org.hrToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.summary)).toBe(true);
    expect(Array.isArray(res.body.monthlyTrend)).toBe(true);
  });

  it("recruitment report returns job and applicant stats", async () => {
    const job = await request(app)
      .post("/api/v1/jobs")
      .set(auth(org.hrToken))
      .send({ title: "Engineer", departmentId: org.department.id, status: "open" });
    await request(app)
      .post(`/api/v1/public/jobs/${job.body.id}/apply`)
      .field("firstName", "Adeola")
      .field("lastName", "Balogun")
      .field("email", `cand_${Date.now()}@example.com`)
      .attach("resume", Buffer.from("%PDF-1.4 fake"), {
        filename: "resume.pdf",
        contentType: "application/pdf",
      });

    const res = await request(app)
      .get("/api/v1/reports/recruitment")
      .set(auth(org.hrToken));
    expect(res.status).toBe(200);
    expect(res.body.jobs.total).toBe(1);
    expect(res.body.applicants.total).toBe(1);
  });

  it("payroll summary returns zeroed totals when no payslips exist", async () => {
    const res = await request(app)
      .get("/api/v1/reports/payroll-summary")
      .set(auth(org.hrToken));
    expect(res.status).toBe(200);
    expect(res.body.totalPayslips).toBe(0);
  });

  it("admin dashboard returns company-wide counts", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard/admin")
      .set(auth(org.hrToken));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("pendingLeaveCount");
    expect(res.body).toHaveProperty("departmentCount");
    expect(res.body).toHaveProperty("employeeCounts");
  });

  it("hr-only reports are forbidden for manager (403)", async () => {
    const paths = [
      "/api/v1/reports/employee-summary",
      "/api/v1/reports/department",
      "/api/v1/reports/recruitment",
      "/api/v1/reports/payroll-summary",
      "/api/v1/dashboard/admin",
    ];
    for (const p of paths) {
      const res = await request(app).get(p).set(auth(org.mgrToken));
      expect(res.status).toBe(403);
    }
  });

  it("reports are scoped to the tenant", async () => {
    const orgB = await makeOrg();
    const res = await request(app)
      .get("/api/v1/reports/employee-summary")
      .set(auth(orgB.hrToken));
    expect(res.status).toBe(200);
    expect(res.body.totalEmployees).toBe(2);
  });
});
