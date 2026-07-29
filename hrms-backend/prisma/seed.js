import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function hash(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log("Seeding roles...");
  const roleNames = [
    "super_admin",
    "hr_admin",
    "manager",
    "employee",
    "applicant",
  ];
  const roles = {};
  for (const name of roleNames) {
    roles[name] = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Seeding companies...");
  const techSolutions = await prisma.company.create({
    data: {
      name: "Tech Solutions Ltd.",
      registrationNumber: "RC1234567",
      industry: "Technology",
      phoneNumber: "+2348012345678",
      email: "info@techsolutions.com",
      website: "www.techsolutions.com",
      address: "12 Freedom Drive, Lagos, Nigeria",
    },
  });

  const greenfield = await prisma.company.create({
    data: {
      name: "Greenfield Resources",
      registrationNumber: "RC7654321",
      industry: "Agriculture",
      phoneNumber: "+2348098765432",
      email: "info@greenfieldresources.com",
      website: "www.greenfieldresources.com",
      address: "5 Ogunlana Drive, Abeokuta, Nigeria",
    },
  });

  console.log("Seeding departments...");
  const engineering = await prisma.department.create({
    data: { name: "Engineering", companyId: techSolutions.id },
  });
  const hr = await prisma.department.create({
    data: { name: "Human Resources", companyId: techSolutions.id },
  });
  const sales = await prisma.department.create({
    data: { name: "Sales", companyId: techSolutions.id },
  });

  console.log("Seeding users + employees...");
  const defaultPassword = await hash("Password123!");

  const superAdminUser = await prisma.user.create({
    data: {
      email: "superadmin@techsolutions.com",
      passwordHash: defaultPassword,
      isVerified: true,
      companyId: techSolutions.id,
      roleId: roles.super_admin.id,
    },
  });
  await prisma.employee.create({
    data: {
      userId: superAdminUser.id,
      companyId: techSolutions.id,
      departmentId: engineering.id,
      employeeCode: "EMP001",
      firstName: "John",
      lastName: "Doe",
      position: "Founder / CEO",
      employmentType: "full_time",
      dateOfJoining: new Date("2023-01-15"),
      status: "active",
    },
  });

  const hrAdminUser = await prisma.user.create({
    data: {
      email: "hradmin@techsolutions.com",
      passwordHash: defaultPassword,
      isVerified: true,
      companyId: techSolutions.id,
      roleId: roles.hr_admin.id,
    },
  });
  const hrAdminEmployee = await prisma.employee.create({
    data: {
      userId: hrAdminUser.id,
      companyId: techSolutions.id,
      departmentId: hr.id,
      employeeCode: "EMP002",
      firstName: "Mary",
      lastName: "Joseph",
      position: "HR Manager",
      employmentType: "full_time",
      dateOfJoining: new Date("2023-05-20"),
      status: "active",
    },
  });

  await prisma.department.update({
    where: { id: hr.id },
    data: { headId: hrAdminEmployee.id },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: "manager@techsolutions.com",
      passwordHash: defaultPassword,
      isVerified: true,
      companyId: techSolutions.id,
      roleId: roles.manager.id,
    },
  });
  const managerEmployee = await prisma.employee.create({
    data: {
      userId: managerUser.id,
      companyId: techSolutions.id,
      departmentId: engineering.id,
      employeeCode: "EMP003",
      firstName: "David",
      lastName: "Okafor",
      position: "Engineering Lead",
      employmentType: "full_time",
      dateOfJoining: new Date("2023-03-10"),
      status: "active",
    },
  });

  await prisma.department.update({
    where: { id: engineering.id },
    data: { headId: managerEmployee.id },
  });

  const employeeSeeds = [
    {
      first: "Esther",
      last: "Obi",
      code: "EMP004",
      position: "Marketing Lead",
      dept: sales.id,
    },
    {
      first: "Paul",
      last: "Eze",
      code: "EMP005",
      position: "Operations Associate",
      dept: sales.id,
    },
    {
      first: "Linda",
      last: "Samuel",
      code: "EMP006",
      position: "Support Executive",
      dept: sales.id,
    },
    {
      first: "Mike",
      last: "Johnson",
      code: "EMP007",
      position: "DevOps Engineer",
      dept: engineering.id,
    },
  ];

  for (const e of employeeSeeds) {
    const user = await prisma.user.create({
      data: {
        email: `${e.first.toLowerCase()}.${e.last.toLowerCase()}@techsolutions.com`,
        passwordHash: defaultPassword,
        isVerified: true,
        companyId: techSolutions.id,
        roleId: roles.employee.id,
      },
    });

    await prisma.employee.create({
      data: {
        userId: user.id,
        companyId: techSolutions.id,
        departmentId: e.dept,
        employeeCode: e.code,
        firstName: e.first,
        lastName: e.last,
        position: e.position,
        employmentType: "full_time",
        dateOfJoining: new Date("2024-01-01"),
        reportsToId:
          e.dept === engineering.id ? managerEmployee.id : hrAdminEmployee.id,
        status: "active",
      },
    });
  }

  await prisma.user.create({
    data: {
      email: "sarah.johnson@example.com",
      passwordHash: defaultPassword,
      isVerified: true,
      roleId: roles.applicant.id,
      companyId: null,
    },
  });

  console.log("Seed complete.");

  console.log("Test accounts (all passwords: Password123!):");
  console.log("  super_admin: superadmin@techsolutions.com");
  console.log("  hr_admin:    hradmin@techsolutions.com");
  console.log("  manager:     manager@techsolutions.com");
  console.log("  applicant:   sarah.johnson@example.com");
  console.log(
    `  greenfield company id: ${greenfield.id} (empty, for multi-tenant isolation testing)`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
