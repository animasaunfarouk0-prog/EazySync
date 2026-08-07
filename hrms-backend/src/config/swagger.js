const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "EazySync HRMS API",
    version: "1.0.0",
    description:
      "Full HR management API: multi-tenant Auth, Companies, Departments, Employees, " +
      "Recruitment (jobs, applicants, interviews), Leave, Notifications, Audit logs, " +
      "Goals, Reviews, Reports, Attendance and Payroll.",
  },
  servers: [
    { url: "http://localhost:5000/api/v1", description: "Local development" },
    {
      url: "https://hrms-backend-kfn0.onrender.com/api/v1",
      description: "Production (Render)",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          details: { type: "array", items: { type: "string" } },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              id: { type: "integer" },
              companyId: { type: "integer", nullable: true },
              email: { type: "string" },
              isVerified: { type: "boolean" },
              role: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  name: { type: "string" },
                },
              },
              employee: { type: "object", nullable: true },
            },
          },
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
        },
      },
      TokenPair: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
        },
      },
      Company: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          registrationNumber: { type: "string", nullable: true },
          industry: { type: "string", nullable: true },
          phoneNumber: { type: "string", nullable: true },
          email: { type: "string", nullable: true },
          website: { type: "string", nullable: true },
          address: { type: "string", nullable: true },
        },
      },
      Department: {
        type: "object",
        properties: {
          id: { type: "integer" },
          companyId: { type: "integer" },
          name: { type: "string" },
          headId: { type: "integer", nullable: true },
        },
      },
      Employee: {
        type: "object",
        properties: {
          id: { type: "integer" },
          userId: { type: "integer" },
          companyId: { type: "integer" },
          departmentId: { type: "integer", nullable: true },
          employeeCode: { type: "string", example: "EMP008" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          position: { type: "string", nullable: true },
          employmentType: {
            type: "string",
            enum: ["full_time", "part_time", "contract", "intern"],
            nullable: true,
          },
          status: { type: "string", enum: ["active", "inactive", "exited"] },
          phoneNumber: { type: "string", nullable: true },
          reportsToId: { type: "integer", nullable: true },
        },
      },
      Job: {
        type: "object",
        properties: {
          id: { type: "integer" },
          companyId: { type: "integer" },
          departmentId: { type: "integer", nullable: true },
          jobCode: { type: "string" },
          title: { type: "string" },
          employmentType: {
            type: "string",
            enum: ["full_time", "part_time", "contract", "intern"],
          },
          status: { type: "string", enum: ["draft", "open", "on_hold", "closed"] },
        },
      },
      Applicant: {
        type: "object",
        properties: {
          id: { type: "integer" },
          jobId: { type: "integer" },
          userId: { type: "integer", nullable: true },
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string" },
          resumeUrl: { type: "string", nullable: true },
          status: {
            type: "string",
            enum: [
              "new",
              "in_review",
              "shortlisted",
              "interviewed",
              "offered",
              "hired",
              "rejected",
            ],
          },
        },
      },
      Interview: {
        type: "object",
        properties: {
          id: { type: "integer" },
          applicantId: { type: "integer" },
          scheduledAt: { type: "string", format: "date-time" },
          mode: { type: "string", enum: ["onsite", "remote", "phone"] },
          status: {
            type: "string",
            enum: ["scheduled", "completed", "cancelled", "rescheduled"],
          },
          rating: { type: "number", minimum: 1, maximum: 5, nullable: true },
          notes: { type: "string", nullable: true },
        },
      },
      LeaveType: {
        type: "object",
        properties: {
          id: { type: "integer" },
          companyId: { type: "integer" },
          name: { type: "string" },
          defaultDays: { type: "number", nullable: true },
        },
      },
      LeaveBalance: {
        type: "object",
        properties: {
          id: { type: "integer" },
          employeeId: { type: "integer" },
          leaveTypeId: { type: "integer" },
          year: { type: "integer" },
          totalDays: { type: "number" },
          usedDays: { type: "number" },
          pendingDays: { type: "number" },
          leaveType: { $ref: "#/components/schemas/LeaveType" },
        },
      },
      LeaveRequest: {
        type: "object",
        properties: {
          id: { type: "integer" },
          employeeId: { type: "integer" },
          leaveTypeId: { type: "integer" },
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
          status: {
            type: "string",
            enum: ["pending", "approved", "rejected", "cancelled"],
          },
          reason: { type: "string", nullable: true },
          days: { type: "number" },
        },
      },
      Goal: {
        type: "object",
        properties: {
          id: { type: "integer" },
          employeeId: { type: "integer" },
          title: { type: "string" },
          category: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
          weight: { type: "number", nullable: true },
          status: {
            type: "string",
            enum: ["on_track", "at_risk", "completed", "overdue"],
          },
          progress: { type: "number", nullable: true },
          dueDate: { type: "string", format: "date", nullable: true },
          year: { type: "integer" },
        },
      },
      Review: {
        type: "object",
        properties: {
          id: { type: "integer" },
          employeeId: { type: "integer" },
          reviewType: { type: "string", enum: ["Mid Year", "Annual", "Probation"] },
          status: { type: "string", enum: ["in_progress", "submitted"] },
          overallRating: { type: "number", nullable: true },
          strengths: { type: "string", nullable: true },
          areasForImprovement: { type: "string", nullable: true },
          additionalComments: { type: "string", nullable: true },
        },
      },
      Notification: {
        type: "object",
        properties: {
          id: { type: "integer" },
          userId: { type: "integer" },
          type: { type: "string" },
          title: { type: "string" },
          message: { type: "string" },
          isRead: { type: "boolean" },
          relatedEntityType: { type: "string", nullable: true },
          relatedEntityId: { type: "integer", nullable: true },
        },
      },
      AuditLog: {
        type: "object",
        properties: {
          id: { type: "integer" },
          userId: { type: "integer", nullable: true },
          companyId: { type: "integer", nullable: true },
          action: { type: "string" },
          entityType: { type: "string", nullable: true },
          entityId: { type: "integer", nullable: true },
          details: { type: "object", nullable: true },
        },
      },
      AttendanceRecord: {
        type: "object",
        properties: {
          id: { type: "integer" },
          employeeId: { type: "integer" },
          date: { type: "string", format: "date" },
          status: {
            type: "string",
            enum: ["present", "absent", "late", "weekly_off", "on_leave"],
          },
          clockIn: { type: "string", format: "date-time", nullable: true },
          clockOut: { type: "string", format: "date-time", nullable: true },
        },
      },
      SalaryStructure: {
        type: "object",
        properties: {
          id: { type: "integer" },
          employeeId: { type: "integer" },
          basicSalary: { type: "number" },
          housingAllowance: { type: "number" },
          transportAllowance: { type: "number" },
          otherAllowance: { type: "number" },
          pensionRate: { type: "number" },
          taxRate: { type: "number", nullable: true },
          nhfRate: { type: "number" },
          effectiveFrom: { type: "string", format: "date" },
        },
      },
      Payslip: {
        type: "object",
        properties: {
          id: { type: "integer" },
          employeeId: { type: "integer" },
          month: { type: "integer" },
          year: { type: "integer" },
          grossEarnings: { type: "number" },
          pensionDeduction: { type: "number" },
          taxDeduction: { type: "number" },
          nhfDeduction: { type: "number" },
          otherDeductions: { type: "number" },
          netSalary: { type: "number" },
          status: { type: "string", enum: ["generated", "paid"] },
          paidOn: { type: "string", format: "date-time", nullable: true },
        },
      },
      PayrollRunResult: {
        type: "object",
        properties: {
          month: { type: "integer" },
          year: { type: "integer" },
          generated: { type: "integer" },
          skipped: { type: "integer" },
          total: { type: "integer" },
        },
      },
      MessageResponse: {
        type: "object",
        properties: { message: { type: "string" } },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: "Auth", description: "Registration, login, tokens, password reset, Google Sign-In" },
    { name: "Companies", description: "Company setup and management" },
    { name: "Departments", description: "Department CRUD" },
    { name: "Employees", description: "Employee CRUD and document uploads" },
    { name: "Jobs", description: "Job postings and state lifecycle" },
    { name: "Applicants", description: "Applications, pipeline status, self-service" },
    { name: "Interviews", description: "Interview scheduling and ratings" },
    { name: "Public", description: "Public-facing endpoints (no login required)" },
    { name: "Leave", description: "Leave types, balances, requests and approvals" },
    { name: "Notifications", description: "In-app notifications" },
    { name: "Audit Logs", description: "Tenant audit trail" },
    { name: "Goals", description: "Employee goals and progress" },
    { name: "Reviews", description: "Performance reviews and feedback" },
    { name: "Reports", description: "Aggregated reports and dashboard" },
    { name: "Attendance", description: "Clock in/out and attendance records" },
    { name: "Payroll", description: "Salary structures, payslips and payroll runs" },
  ],
  paths: {
    // ==================== AUTH ====================
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user account",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "firstName", "lastName", "roleName"],
                properties: {
                  email: { type: "string", example: "newhire@techsolutions.com" },
                  password: { type: "string", example: "Password123!" },
                  firstName: { type: "string", example: "Grace" },
                  lastName: { type: "string", example: "Adeyemi" },
                  roleName: {
                    type: "string",
                    enum: ["super_admin", "hr_admin", "manager", "employee", "applicant"],
                  },
                  companyId: { type: "integer", nullable: true, example: 1 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User created; tokens issued", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          400: { description: "Validation failed", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          409: { description: "Email already exists", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in with email and password",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "hradmin@techsolutions.com" },
                  password: { type: "string", example: "Password123!" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Login successful", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          401: { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out (clears stored refresh token)",
        responses: {
          200: { description: "Logged out successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" } } } },
          401: { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Exchange a refresh token for a new access + refresh pair",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: { refreshToken: { type: "string" } },
              },
            },
          },
        },
        responses: {
          200: { description: "New tokens issued", content: { "application/json": { schema: { $ref: "#/components/schemas/TokenPair" } } } },
          401: { description: "Invalid or expired refresh token", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request a password reset token (dev: logged to server console)",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string" } },
              },
            },
          },
        },
        responses: { 200: { description: "Reset instructions sent if the email exists" } },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password using a valid reset token",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "newPassword"],
                properties: {
                  token: { type: "string" },
                  newPassword: { type: "string", example: "NewPassword123!" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Password reset successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" } } } },
          400: { description: "Invalid or expired token", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/auth/google": {
      post: {
        tags: ["Auth"],
        summary: "Sign in / register via Google ID token",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["idToken"],
                properties: {
                  idToken: { type: "string", description: "Google ID token from client-side Google Sign-In" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Signed in / account created", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          401: { description: "Invalid Google ID token", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    // ==================== COMPANIES ====================
    "/companies": {
      post: {
        tags: ["Companies"],
        summary: "Create a company (company setup) - super_admin only",
        description: "Links the user to the new company and re-issues fresh tokens containing the new companyId.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Tech Solutions Ltd." },
                  registrationNumber: { type: "string", nullable: true },
                  industry: { type: "string", nullable: true },
                  phoneNumber: { type: "string", nullable: true },
                  email: { type: "string", nullable: true },
                  website: { type: "string", nullable: true },
                  address: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Company created; fresh tokens returned", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          403: { description: "Requires super_admin role", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/companies/{id}": {
      get: {
        tags: ["Companies"],
        summary: "Get company details - hr_admin, super_admin (own company only)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Company details", content: { "application/json": { schema: { $ref: "#/components/schemas/Company" } } } },
          403: { description: "Not your company", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      patch: {
        tags: ["Companies"],
        summary: "Update company details - hr_admin, super_admin (own company only)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Company" },
            },
          },
        },
        responses: { 200: { description: "Updated company", content: { "application/json": { schema: { $ref: "#/components/schemas/Company" } } } } },
      },
    },

    // ==================== DEPARTMENTS ====================
    "/departments": {
      get: {
        tags: ["Departments"],
        summary: "List all departments in your company - hr_admin, manager",
        responses: {
          200: {
            description: "List of departments",
            content: {
              "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Department" } } },
            },
          },
        },
      },
      post: {
        tags: ["Departments"],
        summary: "Create a department - hr_admin only",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  headId: { type: "integer", nullable: true },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Department created", content: { "application/json": { schema: { $ref: "#/components/schemas/Department" } } } } },
      },
    },
    "/departments/{id}": {
      patch: {
        tags: ["Departments"],
        summary: "Update a department - hr_admin only",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { name: { type: "string" }, headId: { type: "integer", nullable: true } },
              },
            },
          },
        },
        responses: { 200: { description: "Updated department", content: { "application/json": { schema: { $ref: "#/components/schemas/Department" } } } } },
      },
      delete: {
        tags: ["Departments"],
        summary: "Delete a department - hr_admin only",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Department deleted" } },
      },
    },

    // ==================== EMPLOYEES ====================
    "/employees": {
      get: {
        tags: ["Employees"],
        summary: "List employees in your company - hr_admin, manager",
        parameters: [
          { name: "departmentId", in: "query", schema: { type: "integer" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["active", "inactive", "exited"] } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Matches first name, last name, or position" },
        ],
        responses: {
          200: {
            description: "List of employees",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Employee" } } } },
          },
        },
      },
      post: {
        tags: ["Employees"],
        summary: "Create an employee record - hr_admin only",
        description: "userId must reference a User in the same company who does not already have an employee record. employeeCode is auto-generated.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "firstName", "lastName"],
                properties: {
                  userId: { type: "integer", example: 10 },
                  departmentId: { type: "integer", nullable: true },
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  position: { type: "string", nullable: true },
                  employmentType: { type: "string", enum: ["full_time", "part_time", "contract", "intern"] },
                  dateOfJoining: { type: "string", format: "date" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Employee created", content: { "application/json": { schema: { $ref: "#/components/schemas/Employee" } } } },
          404: { description: "User not found in this company", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          409: { description: "User already has an employee record", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/employees/{id}": {
      get: {
        tags: ["Employees"],
        summary: "Get one employee - hr_admin, manager, or the employee themself",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Employee details", content: { "application/json": { schema: { $ref: "#/components/schemas/Employee" } } } },
        },
      },
      patch: {
        tags: ["Employees"],
        summary: "Update an employee - hr_admin (full) or self (restricted fields only)",
        description: "When updating your own record without an elevated role, only phoneNumber, address, emergencyContactName, and emergencyContactPhone are allowed.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Employee" } } },
        },
        responses: {
          200: { description: "Updated employee", content: { "application/json": { schema: { $ref: "#/components/schemas/Employee" } } } },
          400: { description: "Restricted field not allowed for self-update", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        tags: ["Employees"],
        summary: "Delete an employee - hr_admin only",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Employee deleted" } },
      },
    },
    "/employees/{id}/documents": {
      post: {
        tags: ["Employees"],
        summary: "Upload a document for an employee - hr_admin or self",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  document: { type: "string", format: "binary" },
                  documentType: { type: "string", example: "certificate" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Document uploaded" } },
      },
      get: {
        tags: ["Employees"],
        summary: "List documents for an employee - hr_admin or self",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "List of documents" } },
      },
    },

    // ==================== JOBS ====================
    "/jobs": {
      get: {
        tags: ["Jobs"],
        summary: "List jobs - hr_admin, manager",
        responses: {
          200: { description: "List of jobs", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Job" } } } } },
        },
      },
      post: {
        tags: ["Jobs"],
        summary: "Create a job - hr_admin only",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "departmentId"],
                properties: {
                  title: { type: "string", minLength: 3 },
                  departmentId: { type: "integer" },
                  employmentType: { type: "string", enum: ["full_time", "part_time", "contract", "intern"] },
                  status: { type: "string", enum: ["draft", "open", "on_hold", "closed"] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Job created", content: { "application/json": { schema: { $ref: "#/components/schemas/Job" } } } },
          400: { description: "Validation failed", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/jobs/{id}": {
      get: {
        tags: ["Jobs"],
        summary: "Get a job - hr_admin, manager",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Job details", content: { "application/json": { schema: { $ref: "#/components/schemas/Job" } } } },
          404: { description: "Job not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      patch: {
        tags: ["Jobs"],
        summary: "Update a job (incl. status lifecycle) - hr_admin only",
        description: "Valid transitions: draft -> open, open -> on_hold/closed, on_hold -> open/closed. Closed is terminal.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", minLength: 3 },
                  departmentId: { type: "integer" },
                  employmentType: { type: "string", enum: ["full_time", "part_time", "contract", "intern"] },
                  status: { type: "string", enum: ["draft", "open", "on_hold", "closed"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Updated job", content: { "application/json": { schema: { $ref: "#/components/schemas/Job" } } } },
          400: { description: "Invalid transition or validation failed", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        tags: ["Jobs"],
        summary: "Delete a job - hr_admin only",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Job deleted" } },
      },
    },
    "/jobs/{jobId}/applicants": {
      get: {
        tags: ["Jobs", "Applicants"],
        summary: "List applicants for a job - hr_admin, manager",
        parameters: [{ name: "jobId", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "List of applicants", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Applicant" } } } } },
          404: { description: "Job not found in your company", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    // ==================== APPLICANTS ====================
    "/applicants/{id}": {
      get: {
        tags: ["Applicants"],
        summary: "Get one applicant - hr_admin, manager",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Applicant details", content: { "application/json": { schema: { $ref: "#/components/schemas/Applicant" } } } },
          404: { description: "Applicant not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/applicants/{id}/status": {
      patch: {
        tags: ["Applicants"],
        summary: "Move an applicant through the pipeline - hr_admin, manager",
        description: "Allowed sequence: new -> in_review -> shortlisted -> interviewed -> offered -> hired. Rejected is terminal.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["new", "in_review", "shortlisted", "interviewed", "offered", "hired", "rejected"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Status updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Applicant" } } } },
          400: { description: "Invalid or out-of-order transition", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    // ==================== INTERVIEWS ====================
    "/applicants/{id}/interviews": {
      get: {
        tags: ["Interviews"],
        summary: "List interviews for an applicant - hr_admin, manager",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "List of interviews", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Interview" } } } } },
        },
      },
      post: {
        tags: ["Interviews"],
        summary: "Schedule an interview - hr_admin only",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["scheduledAt"],
                properties: {
                  scheduledAt: { type: "string", format: "date-time" },
                  mode: { type: "string", enum: ["onsite", "remote", "phone"] },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Interview scheduled", content: { "application/json": { schema: { $ref: "#/components/schemas/Interview" } } } },
          400: { description: "Validation failed", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/interviews/{id}": {
      patch: {
        tags: ["Interviews"],
        summary: "Update interview status, rating, mode - hr_admin only",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  scheduledAt: { type: "string", format: "date-time" },
                  status: { type: "string", enum: ["scheduled", "completed", "cancelled", "rescheduled"] },
                  rating: { type: "number", minimum: 1, maximum: 5 },
                  mode: { type: "string", enum: ["onsite", "remote", "phone"] },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Updated interview", content: { "application/json": { schema: { $ref: "#/components/schemas/Interview" } } } },
          400: { description: "Validation failed", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    // ==================== PUBLIC ====================
    "/public/jobs": {
      get: {
        tags: ["Public"],
        summary: "List open jobs - public",
        security: [],
        responses: {
          200: { description: "List of open jobs", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Job" } } } } },
        },
      },
    },
    "/public/jobs/{id}": {
      get: {
        tags: ["Public"],
        summary: "Get a public job detail (open jobs only) - public",
        security: [],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Job details", content: { "application/json": { schema: { $ref: "#/components/schemas/Job" } } } },
          404: { description: "Job not found or not open", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/public/jobs/{jobId}/apply": {
      post: {
        tags: ["Public"],
        summary: "Apply to an open job - public (multipart form + resume)",
        security: [],
        parameters: [{ name: "jobId", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["firstName", "lastName", "email", "resume"],
                properties: {
                  firstName: { type: "string", minLength: 5 },
                  lastName: { type: "string", minLength: 5 },
                  email: { type: "string", format: "email" },
                  resume: { type: "string", format: "binary", description: "Resume file (PDF)" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Application submitted", content: { "application/json": { schema: { $ref: "#/components/schemas/Applicant" } } } },
          400: { description: "Validation failed (missing resume, short name, etc.)", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Job not found or not open", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          409: { description: "Already applied with this email", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/public/applicants/me": {
      get: {
        tags: ["Public"],
        summary: "List my applications - applicant only",
        responses: {
          200: { description: "List of the applicant's own applications", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Applicant" } } } } },
        },
      },
    },
    "/public/applicants/me/{id}": {
      get: {
        tags: ["Public"],
        summary: "Get one of my applications - applicant only",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Application details", content: { "application/json": { schema: { $ref: "#/components/schemas/Applicant" } } } },
          404: { description: "Application not found (or not yours)", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    // ==================== LEAVE ====================
    "/leave/types": {
      get: {
        tags: ["Leave"],
        summary: "List leave types - hr_admin, manager",
        responses: {
          200: { description: "List of leave types", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/LeaveType" } } } } },
        },
      },
      post: {
        tags: ["Leave"],
        summary: "Create a leave type - hr_admin only",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Annual Leave" },
                  defaultDays: { type: "number", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Leave type created", content: { "application/json": { schema: { $ref: "#/components/schemas/LeaveType" } } } },
          409: { description: "Leave type already exists", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/leave/types/{id}/balances": {
      post: {
        tags: ["Leave"],
        summary: "Create a leave balance for an employee - hr_admin only",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, description: "leaveTypeId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["employeeId", "year", "totalDays"],
                properties: {
                  employeeId: { type: "integer" },
                  year: { type: "integer", example: 2026 },
                  totalDays: { type: "number", minimum: 0 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Balance created", content: { "application/json": { schema: { $ref: "#/components/schemas/LeaveBalance" } } } },
          404: { description: "Leave type not found in this company", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          409: { description: "Balance already exists for this employee/type/year", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/leave/dashboard": {
      get: {
        tags: ["Leave"],
        summary: "Leave dashboard summary - hr_admin, manager",
        responses: {
          200: { description: "Dashboard counts" },
        },
      },
    },
    "/leave/requests": {
      get: {
        tags: ["Leave"],
        summary: "List leave requests - hr_admin/manager see all, employee sees own",
        responses: {
          200: { description: "List of leave requests", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/LeaveRequest" } } } } },
        },
      },
      post: {
        tags: ["Leave"],
        summary: "Create a leave request - employee only",
        description: "Requires an existing leave balance for the leave type and year; requests beyond the available balance are rejected.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["leaveTypeId", "startDate", "endDate"],
                properties: {
                  leaveTypeId: { type: "integer" },
                  startDate: { type: "string", format: "date", example: "2026-08-15" },
                  endDate: { type: "string", format: "date", example: "2026-08-17" },
                  reason: { type: "string", nullable: true },
                  attachmentUrl: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Leave request created", content: { "application/json": { schema: { $ref: "#/components/schemas/LeaveRequest" } } } },
          400: { description: "Insufficient balance or no balance set up", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/leave/requests/{id}": {
      get: {
        tags: ["Leave"],
        summary: "Get one leave request - hr_admin, manager, employee (own)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Leave request details (includes approvalHistory)", content: { "application/json": { schema: { $ref: "#/components/schemas/LeaveRequest" } } } },
          404: { description: "Request not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/leave/requests/{id}/approve": {
      patch: {
        tags: ["Leave"],
        summary: "Approve a pending request - manager, hr_admin",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { comment: { type: "string", nullable: true } },
              },
            },
          },
        },
        responses: {
          200: { description: "Request approved; pending days moved to used", content: { "application/json": { schema: { $ref: "#/components/schemas/LeaveRequest" } } } },
          400: { description: "Request is not pending", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/leave/requests/{id}/reject": {
      patch: {
        tags: ["Leave"],
        summary: "Reject a pending request - manager, hr_admin",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { comment: { type: "string", nullable: true } },
              },
            },
          },
        },
        responses: {
          200: { description: "Request rejected; pending days released", content: { "application/json": { schema: { $ref: "#/components/schemas/LeaveRequest" } } } },
          400: { description: "Request is not pending", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/leave/requests/{id}/cancel": {
      patch: {
        tags: ["Leave"],
        summary: "Cancel own pending/approved request - employee only",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { reason: { type: "string", nullable: true } },
              },
            },
          },
        },
        responses: {
          200: { description: "Request cancelled", content: { "application/json": { schema: { $ref: "#/components/schemas/LeaveRequest" } } } },
          403: { description: "Cannot cancel another employee's request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          400: { description: "Request cannot be cancelled in its current state", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/leave/balance": {
      get: {
        tags: ["Leave"],
        summary: "My leave balances - employee only",
        responses: {
          200: { description: "List of my balances with leave types", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/LeaveBalance" } } } } },
        },
      },
    },
    "/leave/balance/{employeeId}": {
      get: {
        tags: ["Leave"],
        summary: "An employee's leave balances - hr_admin, manager",
        parameters: [{ name: "employeeId", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "List of balances", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/LeaveBalance" } } } } },
        },
      },
    },
    "/leave/calendar": {
      get: {
        tags: ["Leave"],
        summary: "Leave calendar for a month - hr_admin, manager, employee",
        parameters: [
          { name: "month", in: "query", schema: { type: "integer" } },
          { name: "year", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Calendar entries", content: { "application/json": { schema: { type: "array" } } } },
        },
      },
    },

    // ==================== NOTIFICATIONS ====================
    "/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "List my notifications - authenticated user",
        responses: {
          200: { description: "List of notifications", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Notification" } } } } },
        },
      },
    },
    "/notifications/read-all": {
      patch: {
        tags: ["Notifications"],
        summary: "Mark all my notifications as read",
        responses: { 200: { description: "All marked as read" } },
      },
    },
    "/notifications/{id}/read": {
      patch: {
        tags: ["Notifications"],
        summary: "Mark one notification as read",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Marked as read", content: { "application/json": { schema: { $ref: "#/components/schemas/Notification" } } } },
          404: { description: "Notification not found (or not yours)", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    // ==================== AUDIT LOGS ====================
    "/audit-logs": {
      get: {
        tags: ["Audit Logs"],
        summary: "List audit logs for your company - hr_admin, super_admin",
        responses: {
          200: { description: "List of audit logs", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/AuditLog" } } } } },
          403: { description: "Requires hr_admin or super_admin", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    // ==================== GOALS ====================
    "/goals": {
      get: {
        tags: ["Goals"],
        summary: "List goals - manager/hr_admin see all, employee sees own",
        responses: {
          200: { description: "List of goals", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Goal" } } } } },
        },
      },
      post: {
        tags: ["Goals"],
        summary: "Create a goal for an employee - manager, hr_admin",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["employeeId", "title", "year"],
                properties: {
                  employeeId: { type: "integer" },
                  goalOwnerId: { type: "integer", nullable: true },
                  departmentId: { type: "integer", nullable: true },
                  title: { type: "string" },
                  category: { type: "string", nullable: true },
                  description: { type: "string", nullable: true },
                  weight: { type: "number", minimum: 0, maximum: 100 },
                  dueDate: { type: "string", format: "date", nullable: true },
                  status: { type: "string", enum: ["on_track", "at_risk", "completed", "overdue"] },
                  progress: { type: "number", minimum: 0, maximum: 100 },
                  year: { type: "integer", example: 2026 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Goal created", content: { "application/json": { schema: { $ref: "#/components/schemas/Goal" } } } },
          404: { description: "Employee not found in your company", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/goals/{id}": {
      get: {
        tags: ["Goals"],
        summary: "Get one goal - hr_admin, manager, employee (own)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Goal details", content: { "application/json": { schema: { $ref: "#/components/schemas/Goal" } } } },
          403: { description: "Cannot view another employee's goal", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Goal not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      patch: {
        tags: ["Goals"],
        summary: "Update a goal - manager/hr_admin full access, employee own progress only",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", minLength: 1 },
                  category: { type: "string", nullable: true },
                  description: { type: "string", nullable: true },
                  weight: { type: "number", minimum: 0, maximum: 100 },
                  dueDate: { type: "string", format: "date", nullable: true },
                  status: { type: "string", enum: ["on_track", "at_risk", "completed", "overdue"] },
                  progress: { type: "number", minimum: 0, maximum: 100 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Updated goal", content: { "application/json": { schema: { $ref: "#/components/schemas/Goal" } } } },
          403: { description: "Access denied", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    // ==================== REVIEWS ====================
    "/reviews": {
      get: {
        tags: ["Reviews"],
        summary: "List reviews - manager/hr_admin see all, employee sees submitted own",
        responses: {
          200: { description: "List of reviews", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Review" } } } } },
        },
      },
      post: {
        tags: ["Reviews"],
        summary: "Create a review for an employee - hr_admin, manager",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["employeeId"],
                properties: {
                  employeeId: { type: "integer" },
                  reviewType: { type: "string", enum: ["Mid Year", "Annual", "Probation"] },
                  reviewPeriodStart: { type: "string", format: "date", nullable: true },
                  reviewPeriodEnd: { type: "string", format: "date", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Review created", content: { "application/json": { schema: { $ref: "#/components/schemas/Review" } } } },
          404: { description: "Employee not found in your company", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/reviews/{id}": {
      get: {
        tags: ["Reviews"],
        summary: "Get one review - role and visibility dependent",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Review details", content: { "application/json": { schema: { $ref: "#/components/schemas/Review" } } } },
          403: { description: "Not visible (e.g. draft not yet submitted)", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      patch: {
        tags: ["Reviews"],
        summary: "Update a review - manager only",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  reviewType: { type: "string", enum: ["Mid Year", "Annual", "Probation"] },
                  reviewPeriodStart: { type: "string", format: "date", nullable: true },
                  reviewPeriodEnd: { type: "string", format: "date", nullable: true },
                  overallRating: { type: "number", minimum: 0, maximum: 5, nullable: true },
                  strengths: { type: "string", nullable: true },
                  areasForImprovement: { type: "string", nullable: true },
                  additionalComments: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Updated review", content: { "application/json": { schema: { $ref: "#/components/schemas/Review" } } } },
        },
      },
    },
    "/reviews/{id}/feedback": {
      post: {
        tags: ["Reviews"],
        summary: "Submit reviewer feedback (computes overall score) - manager only",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  overallRating: { type: "number", minimum: 0, maximum: 5, nullable: true },
                  strengths: { type: "string", nullable: true },
                  areasForImprovement: { type: "string", nullable: true },
                  additionalComments: { type: "string", nullable: true },
                  goalRatings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        goalId: { type: "integer" },
                        employeeRating: { type: "number", maximum: 5, nullable: true },
                        reviewerRating: { type: "number", maximum: 5, nullable: true },
                      },
                    },
                  },
                  competencyRatings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        competencyName: { type: "string" },
                        rating: { type: "number", maximum: 5, nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Feedback submitted; review marked submitted", content: { "application/json": { schema: { $ref: "#/components/schemas/Review" } } } },
          403: { description: "Only the assigned reviewer can submit", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/reviews/{id}/feedback/draft": {
      patch: {
        tags: ["Reviews"],
        summary: "Save a draft of feedback (no submit) - manager only",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  overallRating: { type: "number", minimum: 0, maximum: 5, nullable: true },
                  strengths: { type: "string", nullable: true },
                  areasForImprovement: { type: "string", nullable: true },
                  additionalComments: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Draft saved" } },
      },
    },

    // ==================== REPORTS ====================
    "/reports/employee-summary": {
      get: {
        tags: ["Reports"],
        summary: "Company employee summary - hr_admin only",
        responses: { 200: { description: "Employee summary" } },
      },
    },
    "/reports/department": {
      get: {
        tags: ["Reports"],
        summary: "Department summary with review ratings - hr_admin only",
        responses: { 200: { description: "Department summary" } },
      },
    },
    "/reports/leave": {
      get: {
        tags: ["Reports"],
        summary: "Leave report (counts by status) - hr_admin, manager",
        responses: { 200: { description: "Leave report" } },
      },
    },
    "/reports/attendance": {
      get: {
        tags: ["Reports"],
        summary: "Attendance summary and trend - hr_admin, manager",
        responses: { 200: { description: "Attendance report" } },
      },
    },
    "/reports/recruitment": {
      get: {
        tags: ["Reports"],
        summary: "Recruitment report (jobs + applicants stats) - hr_admin only",
        responses: { 200: { description: "Recruitment report" } },
      },
    },
    "/reports/payroll-summary": {
      get: {
        tags: ["Reports"],
        summary: "Payroll summary totals - hr_admin only",
        responses: { 200: { description: "Payroll summary" } },
      },
    },
    "/dashboard/admin": {
      get: {
        tags: ["Reports"],
        summary: "Company-wide admin dashboard counts - hr_admin only",
        responses: { 200: { description: "Dashboard counts" } },
      },
    },

    // ==================== ATTENDANCE ====================
    "/attendance/clock-in": {
      post: {
        tags: ["Attendance"],
        summary: "Clock in for today (auto late status after 9am) - employee only",
        responses: {
          200: { description: "Clocked in", content: { "application/json": { schema: { $ref: "#/components/schemas/AttendanceRecord" } } } },
          409: { description: "Already clocked in today", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/attendance/clock-out": {
      post: {
        tags: ["Attendance"],
        summary: "Clock out - employee only",
        responses: {
          200: { description: "Clocked out", content: { "application/json": { schema: { $ref: "#/components/schemas/AttendanceRecord" } } } },
          400: { description: "Must clock in first", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/attendance/me": {
      get: {
        tags: ["Attendance"],
        summary: "My attendance records - employee only",
        responses: {
          200: { description: "My attendance records", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/AttendanceRecord" } } } } },
        },
      },
    },
    "/attendance": {
      get: {
        tags: ["Attendance"],
        summary: "List attendance records with filters - hr_admin, manager",
        parameters: [
          { name: "month", in: "query", schema: { type: "integer" } },
          { name: "year", in: "query", schema: { type: "integer" } },
          { name: "from", in: "query", schema: { type: "string", format: "date" } },
          { name: "to", in: "query", schema: { type: "string", format: "date" } },
          { name: "departmentId", in: "query", schema: { type: "integer" } },
          { name: "employeeId", in: "query", schema: { type: "integer" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["present", "absent", "late", "weekly_off", "on_leave"] } },
        ],
        responses: {
          200: { description: "List of attendance records", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/AttendanceRecord" } } } } },
        },
      },
      post: {
        tags: ["Attendance"],
        summary: "Manually create an attendance record - hr_admin, manager",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["employeeId", "date", "status"],
                properties: {
                  employeeId: { type: "integer" },
                  date: { type: "string", format: "date", example: "2026-07-15" },
                  status: { type: "string", enum: ["present", "absent", "late", "weekly_off", "on_leave"] },
                  clockIn: { type: "string", example: "09:00:00", nullable: true },
                  clockOut: { type: "string", example: "17:30:00", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Record created", content: { "application/json": { schema: { $ref: "#/components/schemas/AttendanceRecord" } } } },
          409: { description: "Record already exists for this employee and date", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/attendance/{id}": {
      get: {
        tags: ["Attendance"],
        summary: "Get one attendance record - hr_admin, manager, employee (own)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Attendance record", content: { "application/json": { schema: { $ref: "#/components/schemas/AttendanceRecord" } } } },
          403: { description: "Cannot view another employee's record", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Record not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      patch: {
        tags: ["Attendance"],
        summary: "Correct an attendance record - hr_admin, manager",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["present", "absent", "late", "weekly_off", "on_leave"] },
                  clockIn: { type: "string", nullable: true },
                  clockOut: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Updated record", content: { "application/json": { schema: { $ref: "#/components/schemas/AttendanceRecord" } } } } },
      },
    },

    // ==================== PAYROLL ====================
    "/payroll/salary-structures": {
      get: {
        tags: ["Payroll"],
        summary: "List salary structures - hr_admin only",
        responses: {
          200: { description: "List of salary structures", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/SalaryStructure" } } } } },
        },
      },
      post: {
        tags: ["Payroll"],
        summary: "Create a salary structure for an employee - hr_admin only",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["employeeId", "basicSalary", "effectiveFrom"],
                properties: {
                  employeeId: { type: "integer" },
                  basicSalary: { type: "number", minimum: 0 },
                  housingAllowance: { type: "number", minimum: 0, default: 0 },
                  transportAllowance: { type: "number", minimum: 0, default: 0 },
                  otherAllowance: { type: "number", minimum: 0, default: 0 },
                  pensionRate: { type: "number", minimum: 0, maximum: 100, default: 8 },
                  taxRate: { type: "number", minimum: 0, maximum: 100, nullable: true },
                  nhfRate: { type: "number", minimum: 0, maximum: 100, default: 2.5 },
                  effectiveFrom: { type: "string", format: "date", example: "2026-01-01" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Salary structure created", content: { "application/json": { schema: { $ref: "#/components/schemas/SalaryStructure" } } } },
          404: { description: "Employee not found in this company", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/payroll/salary-structures/{id}": {
      get: {
        tags: ["Payroll"],
        summary: "Get one salary structure - hr_admin only",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Salary structure", content: { "application/json": { schema: { $ref: "#/components/schemas/SalaryStructure" } } } },
          404: { description: "Salary structure not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      patch: {
        tags: ["Payroll"],
        summary: "Update a salary structure - hr_admin only",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  basicSalary: { type: "number", minimum: 0 },
                  housingAllowance: { type: "number", minimum: 0 },
                  transportAllowance: { type: "number", minimum: 0 },
                  otherAllowance: { type: "number", minimum: 0 },
                  pensionRate: { type: "number", minimum: 0, maximum: 100 },
                  taxRate: { type: "number", minimum: 0, maximum: 100, nullable: true },
                  nhfRate: { type: "number", minimum: 0, maximum: 100 },
                  effectiveFrom: { type: "string", format: "date" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Updated salary structure", content: { "application/json": { schema: { $ref: "#/components/schemas/SalaryStructure" } } } } },
      },
    },
    "/payroll/run": {
      post: {
        tags: ["Payroll"],
        summary: "Run payroll for a month - hr_admin only",
        description: "Generates payslips for active employees with a salary structure. Idempotent per employee/month/year.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["month", "year"],
                properties: {
                  month: { type: "integer", minimum: 1, maximum: 12 },
                  year: { type: "integer", minimum: 2000, maximum: 2100 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Payroll run result", content: { "application/json": { schema: { $ref: "#/components/schemas/PayrollRunResult" } } } },
        },
      },
    },
    "/payroll/payslips/me": {
      get: {
        tags: ["Payroll"],
        summary: "My payslips - employee only",
        responses: {
          200: { description: "My payslips", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Payslip" } } } } },
        },
      },
    },
    "/payroll/payslips": {
      get: {
        tags: ["Payroll"],
        summary: "List payslips with filters - hr_admin, manager",
        parameters: [
          { name: "month", in: "query", schema: { type: "integer" } },
          { name: "year", in: "query", schema: { type: "integer" } },
          { name: "departmentId", in: "query", schema: { type: "integer" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["generated", "paid"] } },
        ],
        responses: {
          200: { description: "List of payslips", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Payslip" } } } } },
        },
      },
    },
    "/payroll/payslips/{id}": {
      get: {
        tags: ["Payroll"],
        summary: "Get one payslip - hr_admin, manager, employee (own only)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Payslip", content: { "application/json": { schema: { $ref: "#/components/schemas/Payslip" } } } },
          403: { description: "Cannot view another employee's payslip", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Payslip not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/payroll/payslips/{id}/mark-paid": {
      patch: {
        tags: ["Payroll"],
        summary: "Mark a payslip as paid - hr_admin only",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Payslip marked paid", content: { "application/json": { schema: { $ref: "#/components/schemas/Payslip" } } } },
          409: { description: "Payslip already marked paid", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
  },
};

export default swaggerSpec;
