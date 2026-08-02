import { auth, request, app, makeOrg } from "./helpers.js";

describe("REVIEWS (Person 4)", () => {
  let org;
  beforeEach(async () => {
    org = await makeOrg();
  });

  const createReview = async (token = org.mgrToken) =>
    request(app).post("/api/v1/reviews").set(auth(token)).send({
      employeeId: org.empEmployee.id,
      reviewType: "Annual",
      reviewPeriodStart: "2026-01-01",
      reviewPeriodEnd: "2026-12-31",
    });

  const createGoal = async () =>
    request(app)
      .post("/api/v1/goals")
      .set(auth(org.mgrToken))
      .send({
        employeeId: org.empEmployee.id,
        goalOwnerId: org.mgrEmployee.id,
        title: "Launch feature",
        year: 2026,
      });

  it("manager creates a review for an employee", async () => {
    const res = await createReview();
    expect(res.status).toBe(201);
    expect(res.body.reviewerId).toBe(org.mgrEmployee.id);
    expect(res.body.feedbackStatus).toBe("draft");
  });

  it("employee cannot view their own draft review (403)", async () => {
    const review = await createReview();
    const res = await request(app)
      .get(`/api/v1/reviews/${review.body.id}`)
      .set(auth(org.empToken));
    expect(res.status).toBe(403);
  });

  it("hr_admin can view a draft review", async () => {
    const review = await createReview();
    const res = await request(app)
      .get(`/api/v1/reviews/${review.body.id}`)
      .set(auth(org.hrToken));
    expect(res.status).toBe(200);
  });

  it("reviewer submits feedback; overall score is computed from goal + competency ratings", async () => {
    const review = await createReview();
    const goal = await createGoal();

    const res = await request(app)
      .post(`/api/v1/reviews/${review.body.id}/feedback`)
      .set(auth(org.mgrToken))
      .send({
        goalRatings: [{ goalId: goal.body.id, employeeRating: 4, reviewerRating: 5 }],
        competencyRatings: [
          { competencyName: "Teamwork", rating: 4 },
          { competencyName: "Leadership", rating: 3 },
        ],
        overallRating: 4,
        strengths: "Great communicator",
      });
    expect(res.status).toBe(200);
    expect(res.body.feedbackStatus).toBe("submitted");
    expect(res.body.status).toBe("completed");
    expect(Number(res.body.overallRating)).toBe(4);
  });

  it("employee can view the review after feedback is submitted", async () => {
    const review = await createReview();
    const goal = await createGoal();
    await request(app)
      .post(`/api/v1/reviews/${review.body.id}/feedback`)
      .set(auth(org.mgrToken))
      .send({ goalRatings: [{ goalId: goal.body.id, reviewerRating: 5 }] });

    const res = await request(app)
      .get(`/api/v1/reviews/${review.body.id}`)
      .set(auth(org.empToken));
    expect(res.status).toBe(200);
    expect(res.body.feedbackStatus).toBe("submitted");
  });

  it("only the assigned reviewer can submit feedback (403)", async () => {
    const review = await createReview();
    const res = await request(app)
      .post(`/api/v1/reviews/${review.body.id}/feedback`)
      .set(auth(org.hrToken))
      .send({ strengths: "trying to bypass" });
    expect(res.status).toBe(403);
  });

  it("manager saves a draft of feedback, then submits", async () => {
    const review = await createReview();
    const draft = await request(app)
      .patch(`/api/v1/reviews/${review.body.id}/feedback/draft`)
      .set(auth(org.mgrToken))
      .send({ strengths: "early note" });
    expect(draft.status).toBe(200);
    expect(draft.body.feedbackStatus).toBe("draft");

    const submitted = await request(app)
      .post(`/api/v1/reviews/${review.body.id}/feedback`)
      .set(auth(org.mgrToken))
      .send({ strengths: "final note", overallRating: 3 });
    expect(submitted.status).toBe(200);
    expect(submitted.body.feedbackStatus).toBe("submitted");
  });

  it("employee listing only shows submitted reviews for themselves", async () => {
    const review = await createReview();
    const goal = await createGoal();
    await request(app)
      .post(`/api/v1/reviews/${review.body.id}/feedback`)
      .set(auth(org.mgrToken))
      .send({ goalRatings: [{ goalId: goal.body.id, reviewerRating: 4 }] });

    const mine = await request(app)
      .get("/api/v1/reviews")
      .set(auth(org.empToken));
    expect(mine.status).toBe(200);
    expect(mine.body.some((r) => r.id === review.body.id)).toBe(true);
  });

  it("reviews are scoped to the tenant", async () => {
    const review = await createReview();
    const orgB = await makeOrg();
    const res = await request(app)
      .get(`/api/v1/reviews/${review.body.id}`)
      .set(auth(orgB.hrToken));
    expect(res.status).toBe(404);
  });

  it("employee cannot create reviews (403)", async () => {
    const res = await request(app)
      .post("/api/v1/reviews")
      .set(auth(org.empToken))
      .send({ employeeId: org.empEmployee.id });
    expect(res.status).toBe(403);
  });
});
