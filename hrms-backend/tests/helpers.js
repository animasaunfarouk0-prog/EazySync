import bcrypt from "bcrypt";
import request from "supertest";
import app from "../src/app.js";
import prisma from "../src/config/prisma.js";

export const SALT_ROUNDS = 4;
export const DEFAULT_PASSWORD = "Password123!";

let emailCounter = 0;
export const uniqueEmail = (prefix) =>
  `${prefix}_${Date.now()}_${emailCounter++}@example.com`;

export const auth = (token) => ({ Authorization: `Bearer ${token}` });

export const ROLE_NAMES = [
  "super_admin",
  "hr_admin",
  "manager",
  "employee",
  "applicant",
];

async function seedRoles() {
  for (const name of ROLE_NAMES) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

export async function resetDb() {
  const tables = await prisma.$queryRawUnsafe(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
  );
  const names = tables
    .map((t) => t.tablename)
    .filter((n) => n !== "_prisma_migrations");
  if (names.length) {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "${names.join('", "')}" RESTART IDENTITY CASCADE`
    );
  }
  await seedRoles();
}

export async function createUser({
  roleName,
  companyId = null,
  email,
  password = DEFAULT_PASSWORD,
}) {
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) throw new Error(`Role not found: ${roleName}`);
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  return prisma.user.create({
    data: { email, passwordHash, companyId, roleId: role.id },
  });
}

export async function login(email, password = DEFAULT_PASSWORD) {
  return request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });
}

export async function loginAs(user) {
  const res = await login(user.email);
  return res.body.accessToken;
}

export async function createCompanyViaApi(superToken, name) {
  const res = await request(app)
    .post("/api/v1/companies")
    .set(auth(superToken))
    .send({ name });
  if (res.status !== 201) throw new Error(`createCompany failed: ${JSON.stringify(res.body)}`);
  return res.body.company;
}

export async function createDepartmentViaApi(hrToken, name) {
  const res = await request(app)
    .post("/api/v1/departments")
    .set(auth(hrToken))
    .send({ name });
  if (res.status !== 201) throw new Error(`createDepartment failed: ${JSON.stringify(res.body)}`);
  return res.body;
}

export async function createEmployeeViaApi(hrToken, data) {
  const res = await request(app)
    .post("/api/v1/employees")
    .set(auth(hrToken))
    .send(data);
  if (res.status !== 201) throw new Error(`createEmployee failed: ${JSON.stringify(res.body)}`);
  return res.body;
}

export async function makeOrg() {
  const suffix = `${Date.now()}${emailCounter++}`;

  const superUser = await createUser({
    roleName: "super_admin",
    email: uniqueEmail("super"),
  });
  const superToken = await loginAs(superUser);
  const company = await createCompanyViaApi(superToken, `Acme ${suffix}`);

  const hrUser = await createUser({
    roleName: "hr_admin",
    companyId: company.id,
    email: uniqueEmail("hr"),
  });
  const mgrUser = await createUser({
    roleName: "manager",
    companyId: company.id,
    email: uniqueEmail("mgr"),
  });
  const empUser = await createUser({
    roleName: "employee",
    companyId: company.id,
    email: uniqueEmail("emp"),
  });
  const applicantUser = await createUser({
    roleName: "applicant",
    companyId: null,
    email: uniqueEmail("applicant"),
  });

  const hrToken = await loginAs(hrUser);
  const department = await createDepartmentViaApi(hrToken, `Engineering ${suffix}`);

  const mgrEmployee = await createEmployeeViaApi(hrToken, {
    userId: mgrUser.id,
    firstName: "Manager",
    lastName: "Doe",
    departmentId: department.id,
    position: "Team Lead",
    employmentType: "full_time",
  });
  const empEmployee = await createEmployeeViaApi(hrToken, {
    userId: empUser.id,
    firstName: "Employee",
    lastName: "Doe",
    departmentId: department.id,
    reportsToId: mgrEmployee.id,
    position: "Engineer",
    employmentType: "full_time",
  });

  const mgrToken = await loginAs(mgrUser);
  const empToken = await loginAs(empUser);
  const applicantToken = await loginAs(applicantUser);

  return {
    suffix,
    company,
    superUser,
    superToken: await loginAs(superUser),
    hrUser,
    hrToken,
    mgrUser,
    mgrToken,
    mgrEmployee,
    empUser,
    empToken,
    empEmployee,
    applicantUser,
    applicantToken,
    department,
  };
}

export async function createLeaveTypeViaApi(hrToken, name = "Annual Leave") {
  const res = await request(app)
    .post("/api/v1/leave/types")
    .set(auth(hrToken))
    .send({ name, defaultDays: 21 });
  if (res.status !== 201) throw new Error(`createLeaveType failed: ${JSON.stringify(res.body)}`);
  return res.body;
}

export async function createLeaveBalanceViaApi(hrToken, leaveTypeId, employeeId, totalDays = 21) {
  const res = await request(app)
    .post(`/api/v1/leave/types/${leaveTypeId}/balances`)
    .set(auth(hrToken))
    .send({ employeeId, year: new Date().getFullYear(), totalDays });
  if (res.status !== 201) throw new Error(`createLeaveBalance failed: ${JSON.stringify(res.body)}`);
  return res.body;
}

export { app, prisma, request };
