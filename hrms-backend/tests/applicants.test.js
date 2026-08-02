import { auth, request, app, makeOrg, prisma } from "./helpers.js";

describe("APPLICANTS (recruitment)", () => {
  let org;
  beforeEach(async () => {
    org = await makeOrg();
  });

  const openJob = async () => {
    const res = await request(app)
      .post("/api/v1/jobs")
      .set(auth(org.hrToken))
      .send({
        title: "Open Position",
        departmentId: org.department.id,
        employmentType: "full_time",
        status: "open",
      });
    return res.body;
  };

  const apply = (jobId, overrides = {}) => {
    const r = request(app).post(`/api/v1/public/jobs/${jobId}/apply`);
    const fields = {
      firstName: "Adeola",
      lastName: "Balogun",
      email: `candidate_${Date.now()}@example.com`,
      phoneNumber: "08012345678",
      coverLetter: "I am a great fit",
      ...overrides,
    };
    for (const [key, value] of Object.entries(fields)) {
      r.field(key, value);
    }
    return r.attach("resume", Buffer.from("%PDF-1.4 fake"), {
      filename: "resume.pdf",
      contentType: "application/pdf",
    });
  };

  it("public user can apply to an open job", async () => {
    const job = await openJob();
    const res = await apply(job.id);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("new");
    expect(res.body.jobId).toBe(job.id);
  });

  it("apply requires a resume file", async () => {
    const job = await openJob();
    const res = await request(app)
      .post(`/api/v1/public/jobs/${job.id}/apply`)
      .field("firstName", "Adeola")
      .field("lastName", "Balogun")
      .field("email", "no_resume@example.com");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validation failed/);
  });

  it("cannot apply to a job that is not open", async () => {
    const res = await request(app)
      .post("/api/v1/jobs")
      .set(auth(org.hrToken))
      .send({ title: "Draft Role", departmentId: org.department.id, status: "draft" });
    const applyRes = await apply(res.body.id);
    expect(applyRes.status).toBe(400);
  });

  it("duplicate application returns 409", async () => {
    const job = await openJob();
    await apply(job.id, { email: "dupe@example.com" });
    const dup = await apply(job.id, { email: "dupe@example.com" });
    expect(dup.status).toBe(409);
  });

  it("hr can list applicants per job; other tenants get 404", async () => {
    const job = await openJob();
    await apply(job.id);

    const ok = await request(app)
      .get(`/api/v1/jobs/${job.id}/applicants`)
      .set(auth(org.hrToken));
    expect(ok.status).toBe(200);
    expect(ok.body.length).toBe(1);

    const orgB = await makeOrg();
    const cross = await request(app)
      .get(`/api/v1/jobs/${job.id}/applicants`)
      .set(auth(orgB.hrToken));
    expect(cross.status).toBe(404);
  });

  it("hr can fetch a single applicant; other tenants get 404", async () => {
    const job = await openJob();
    const applied = await apply(job.id);

    const ok = await request(app)
      .get(`/api/v1/applicants/${applied.body.id}`)
      .set(auth(org.hrToken));
    expect(ok.status).toBe(200);

    const orgB = await makeOrg();
    const cross = await request(app)
      .get(`/api/v1/applicants/${applied.body.id}`)
      .set(auth(orgB.hrToken));
    expect(cross.status).toBe(404);
  });

  it("applicant state machine allows valid transitions and rejects skips", async () => {
    const job = await openJob();
    const applied = await apply(job.id);
    const id = applied.body.id;

    const step = (status) =>
      request(app)
        .patch(`/api/v1/applicants/${id}/status`)
        .set(auth(org.hrToken))
        .send({ status });

    expect((await step("in_review")).status).toBe(200);
    expect((await step("shortlisted")).status).toBe(200);
    expect((await step("interviewed")).status).toBe(200);
    expect((await step("offered")).status).toBe(200);
    expect((await step("hired")).status).toBe(200);

    const skip = await step("rejected");
    expect(skip.status).toBe(400);
  });

  it("cannot move a rejected applicant", async () => {
    const job = await openJob();
    const applied = await apply(job.id);
    await request(app)
      .patch(`/api/v1/applicants/${applied.body.id}/status`)
      .set(auth(org.hrToken))
      .send({ status: "rejected" });
    const res = await request(app)
      .patch(`/api/v1/applicants/${applied.body.id}/status`)
      .set(auth(org.hrToken))
      .send({ status: "in_review" });
    expect(res.status).toBe(400);
  });

  it("applicant user can list their own applications", async () => {
    const job = await openJob();
    const applicant = await prisma.applicant.create({
      data: {
        jobId: job.id,
        userId: org.applicantUser.id,
        firstName: "Adeola",
        lastName: "Balogun",
        email: org.applicantUser.email,
        resumeUrl: "http://localhost/uploads/r.pdf",
      },
    });

    const me = await request(app)
      .get("/api/v1/public/applicants/me")
      .set(auth(org.applicantToken));
    expect(me.status).toBe(200);
    expect(me.body.some((a) => a.id === applicant.id)).toBe(true);

    const one = await request(app)
      .get(`/api/v1/public/applicants/me/${applicant.id}`)
      .set(auth(org.applicantToken));
    expect(one.status).toBe(200);
    expect(one.body.id).toBe(applicant.id);
  });

  it("non-applicant role cannot use /me endpoints", async () => {
    const res = await request(app)
      .get("/api/v1/public/applicants/me")
      .set(auth(org.empToken));
    expect(res.status).toBe(403);
  });
});
