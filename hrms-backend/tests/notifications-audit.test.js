import { auth, request, app, makeOrg, prisma } from "./helpers.js";

describe("NOTIFICATIONS", () => {
  let org;
  beforeEach(async () => {
    org = await makeOrg();
  });

  it("lists notifications for the authenticated user", async () => {
    await prisma.notification.create({
      data: {
        userId: org.empUser.id,
        type: "leave",
        title: "Leave approved",
        message: "Your leave was approved",
      },
    });
    const res = await request(app)
      .get("/api/v1/notifications")
      .set(auth(org.empToken));
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].isRead).toBe(false);
  });

  it("does not leak another user's notifications", async () => {
    await prisma.notification.create({
      data: {
        userId: org.empUser.id,
        type: "leave",
        title: "Secret",
      },
    });
    const res = await request(app)
      .get("/api/v1/notifications")
      .set(auth(org.mgrToken));
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);
  });

  it("marks a single notification as read", async () => {
    const notif = await prisma.notification.create({
      data: { userId: org.empUser.id, type: "leave", title: "Hi" },
    });
    const res = await request(app)
      .patch(`/api/v1/notifications/${notif.id}/read`)
      .set(auth(org.empToken));
    expect(res.status).toBe(200);
    expect(res.body.isRead).toBe(true);
  });

  it("marks all notifications as read", async () => {
    await prisma.notification.createMany({
      data: [
        { userId: org.empUser.id, type: "leave", title: "A" },
        { userId: org.empUser.id, type: "goal", title: "B" },
      ],
    });
    const res = await request(app)
      .patch("/api/v1/notifications/read-all")
      .set(auth(org.empToken));
    expect(res.status).toBe(200);
    const unread = await prisma.notification.count({
      where: { userId: org.empUser.id, isRead: false },
    });
    expect(unread).toBe(0);
  });

  it("marking another user's notification is 404", async () => {
    const notif = await prisma.notification.create({
      data: { userId: org.empUser.id, type: "leave", title: "Hi" },
    });
    const res = await request(app)
      .patch(`/api/v1/notifications/${notif.id}/read`)
      .set(auth(org.mgrToken));
    expect(res.status).toBe(404);
  });
});

describe("AUDIT LOGS", () => {
  let org;
  beforeEach(async () => {
    org = await makeOrg();
  });

  it("hr_admin can list audit logs for their company", async () => {
    await request(app)
      .post("/api/v1/departments")
      .set(auth(org.hrToken))
      .send({ name: "Audited Dept" });

    const res = await request(app)
      .get("/api/v1/audit-logs")
      .set(auth(org.hrToken));
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.logs.some((l) => l.module === "departments")).toBe(true);
  });

  it("employee cannot access audit logs (403)", async () => {
    const res = await request(app)
      .get("/api/v1/audit-logs")
      .set(auth(org.empToken));
    expect(res.status).toBe(403);
  });

  it("audit logs are scoped to the tenant", async () => {
    const orgB = await makeOrg();
    await request(app)
      .post("/api/v1/departments")
      .set(auth(orgB.hrToken))
      .send({ name: "OrgB Dept" });

    const res = await request(app)
      .get("/api/v1/audit-logs")
      .set(auth(org.hrToken));
    expect(res.status).toBe(200);
    const orgBLogs = res.body.logs.filter((l) => l.user?.id === orgB.hrUser.id);
    expect(orgBLogs.length).toBe(0);
  });
});
