import { auth, request, app, makeOrg } from "./helpers.js";

describe("INTERVIEWS (recruitment)", () => {
  let org;
  beforeEach(async () => {
    org = await makeOrg();
  });

  const setupApplicant = async (status = "shortlisted") => {
    const job = await request(app)
      .post("/api/v1/jobs")
      .set(auth(org.hrToken))
      .send({
        title: "Open Role",
        departmentId: org.department.id,
        status: "open",
      });
    const applied = await request(app)
      .post(`/api/v1/public/jobs/${job.body.id}/apply`)
      .field("firstName", "Adeola")
      .field("lastName", "Balogun")
      .field("email", `cand_${Date.now()}@example.com`)
      .attach("resume", Buffer.from("%PDF-1.4 fake"), {
        filename: "resume.pdf",
        contentType: "application/pdf",
      });
    const id = applied.body.id;
    if (status === "new") return { jobId: job.body.id, applicantId: id };
    const flow = ["in_review", "shortlisted"];
    for (const s of flow) {
      if (flow.indexOf(s) > flow.indexOf(status)) break;
      await request(app)
        .patch(`/api/v1/applicants/${id}/status`)
        .set(auth(org.hrToken))
        .send({ status: s });
    }
    return { jobId: job.body.id, applicantId: id };
  };

  it("hr schedules an interview for a shortlisted applicant (auto-advances)", async () => {
    const { applicantId } = await setupApplicant("shortlisted");
    const res = await request(app)
      .post(`/api/v1/applicants/${applicantId}/interviews`)
      .set(auth(org.hrToken))
      .send({
        scheduledAt: "2026-08-10T10:00:00.000Z",
        mode: "onsite",
        interviewerId: org.mgrEmployee.id,
      });
    expect(res.status).toBe(201);
    expect(res.body.mode).toBe("onsite");

    const applicant = await request(app)
      .get(`/api/v1/applicants/${applicantId}`)
      .set(auth(org.hrToken));
    expect(applicant.body.status).toBe("interviewed");
  });

  it("scheduling an interview for a new applicant does not advance status", async () => {
    const { applicantId } = await setupApplicant("new");
    await request(app)
      .post(`/api/v1/applicants/${applicantId}/interviews`)
      .set(auth(org.hrToken))
      .send({ scheduledAt: "2026-08-10T10:00:00.000Z", mode: "remote" });
    const applicant = await request(app)
      .get(`/api/v1/applicants/${applicantId}`)
      .set(auth(org.hrToken));
    expect(applicant.body.status).toBe("new");
  });

  it("manager can view interviews, only hr can schedule", async () => {
    const { applicantId } = await setupApplicant("shortlisted");
    const created = await request(app)
      .post(`/api/v1/applicants/${applicantId}/interviews`)
      .set(auth(org.hrToken))
      .send({ scheduledAt: "2026-08-10T10:00:00.000Z", mode: "phone" });

    const mgrList = await request(app)
      .get(`/api/v1/applicants/${applicantId}/interviews`)
      .set(auth(org.mgrToken));
    expect(mgrList.status).toBe(200);
    expect(mgrList.body.some((i) => i.id === created.body.id)).toBe(true);

    const mgrCreate = await request(app)
      .post(`/api/v1/applicants/${applicantId}/interviews`)
      .set(auth(org.mgrToken))
      .send({ scheduledAt: "2026-08-11T10:00:00.000Z" });
    expect(mgrCreate.status).toBe(403);
  });

  it("hr can update interview status, rating and mode", async () => {
    const { applicantId } = await setupApplicant("shortlisted");
    const created = await request(app)
      .post(`/api/v1/applicants/${applicantId}/interviews`)
      .set(auth(org.hrToken))
      .send({ scheduledAt: "2026-08-10T10:00:00.000Z", mode: "onsite" });

    const res = await request(app)
      .patch(`/api/v1/interviews/${created.body.id}`)
      .set(auth(org.hrToken))
      .send({ status: "completed", rating: 4, mode: "remote" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("completed");
    expect(res.body.rating).toBe(4);
  });

  it("rejects invalid rating", async () => {
    const { applicantId } = await setupApplicant("shortlisted");
    const created = await request(app)
      .post(`/api/v1/applicants/${applicantId}/interviews`)
      .set(auth(org.hrToken))
      .send({ scheduledAt: "2026-08-10T10:00:00.000Z" });
    const res = await request(app)
      .patch(`/api/v1/interviews/${created.body.id}`)
      .set(auth(org.hrToken))
      .send({ rating: 9 });
    expect(res.status).toBe(400);
  });

  it("interviews are scoped to the tenant", async () => {
    const { applicantId } = await setupApplicant("shortlisted");
    const created = await request(app)
      .post(`/api/v1/applicants/${applicantId}/interviews`)
      .set(auth(org.hrToken))
      .send({ scheduledAt: "2026-08-10T10:00:00.000Z" });

    const orgB = await makeOrg();
    const list = await request(app)
      .get(`/api/v1/applicants/${applicantId}/interviews`)
      .set(auth(orgB.hrToken));
    expect(list.status).toBe(404);

    const upd = await request(app)
      .patch(`/api/v1/interviews/${created.body.id}`)
      .set(auth(orgB.hrToken))
      .send({ status: "cancelled" });
    expect(upd.status).toBe(404);
  });
});
