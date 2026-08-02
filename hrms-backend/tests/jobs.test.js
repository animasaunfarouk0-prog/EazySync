import { auth, request, app, makeOrg } from "./helpers.js";

describe("JOBS (recruitment)", () => {
  let org;
  beforeEach(async () => {
    org = await makeOrg();
  });

  const createJobPayload = (overrides = {}) => ({
    title: "Software Engineer",
    departmentId: org.department.id,
    description: "Build things",
    requirements: "5 years",
    location: "Lagos",
    employmentType: "full_time",
    status: "draft",
    ...overrides,
  });

  it("hr_admin creates a job with an auto-generated code", async () => {
    const res = await request(app)
      .post("/api/v1/jobs")
      .set(auth(org.hrToken))
      .send(createJobPayload());
    expect(res.status).toBe(201);
    expect(res.body.jobCode).toMatch(/^JOB-\d{4}$/);
    expect(res.body.companyId).toBe(org.company.id);
  });

  it("employee cannot create a job (403)", async () => {
    const res = await request(app)
      .post("/api/v1/jobs")
      .set(auth(org.empToken))
      .send(createJobPayload());
    expect(res.status).toBe(403);
  });

  it("hr_admin and manager can list jobs", async () => {
    await request(app).post("/api/v1/jobs").set(auth(org.hrToken)).send(createJobPayload());
    const byHr = await request(app).get("/api/v1/jobs").set(auth(org.hrToken));
    expect(byHr.status).toBe(200);
    expect(byHr.body.length).toBe(1);
    const byMgr = await request(app).get("/api/v1/jobs").set(auth(org.mgrToken));
    expect(byMgr.status).toBe(200);
  });

  it("job state machine allows draft -> open but not open -> draft", async () => {
    const job = await request(app)
      .post("/api/v1/jobs")
      .set(auth(org.hrToken))
      .send(createJobPayload());
    const ok = await request(app)
      .patch(`/api/v1/jobs/${job.body.id}`)
      .set(auth(org.hrToken))
      .send({ status: "open" });
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe("open");

    const bad = await request(app)
      .patch(`/api/v1/jobs/${job.body.id}`)
      .set(auth(org.hrToken))
      .send({ status: "draft" });
    expect(bad.status).toBe(400);
  });

  it("closed job cannot be reopened", async () => {
    const job = await request(app)
      .post("/api/v1/jobs")
      .set(auth(org.hrToken))
      .send(createJobPayload({ status: "open" }));
    await request(app)
      .patch(`/api/v1/jobs/${job.body.id}`)
      .set(auth(org.hrToken))
      .send({ status: "closed" });
    const reopen = await request(app)
      .patch(`/api/v1/jobs/${job.body.id}`)
      .set(auth(org.hrToken))
      .send({ status: "open" });
    expect(reopen.status).toBe(400);
  });

  it("hr_admin can delete a job", async () => {
    const job = await request(app)
      .post("/api/v1/jobs")
      .set(auth(org.hrToken))
      .send(createJobPayload());
    const res = await request(app)
      .delete(`/api/v1/jobs/${job.body.id}`)
      .set(auth(org.hrToken));
    expect(res.status).toBe(200);
  });

  it("public jobs endpoint only returns open jobs", async () => {
    await request(app)
      .post("/api/v1/jobs")
      .set(auth(org.hrToken))
      .send(createJobPayload({ title: "Draft Role", status: "draft" }));
    await request(app)
      .post("/api/v1/jobs")
      .set(auth(org.hrToken))
      .send(createJobPayload({ title: "Open Role", status: "open" }));

    const res = await request(app).get("/api/v1/public/jobs");
    expect(res.status).toBe(200);
    const titles = res.body.map((j) => j.title);
    expect(titles).toContain("Open Role");
    expect(titles).not.toContain("Draft Role");
  });

  it("public job detail hides non-open jobs", async () => {
    const job = await request(app)
      .post("/api/v1/jobs")
      .set(auth(org.hrToken))
      .send(createJobPayload({ status: "draft" }));
    const res = await request(app).get(`/api/v1/public/jobs/${job.body.id}`);
    expect(res.status).toBe(404);
  });

  it("jobs are scoped to the tenant", async () => {
    const orgB = await makeOrg();
    const job = await request(app)
      .post("/api/v1/jobs")
      .set(auth(org.hrToken))
      .send(createJobPayload());
    const res = await request(app)
      .get(`/api/v1/jobs/${job.body.id}`)
      .set(auth(orgB.hrToken));
    expect(res.status).toBe(404);
  });
});
