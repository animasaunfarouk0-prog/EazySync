const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "HRMS Backend API",
    version: "1.0.0",
    description:
      "HR Management System API — Foundation module (Auth, Companies, Departments, Employees). " +
      "Built by Person 1 on the backend team. Other modules (Recruitment, Leave, Performance, " +
      "Notifications) will be added here as they are completed.",
  },
  servers: [
    { url: "http://localhost:5000/api/v1", description: "Local development" },
    // I'll add the production URL here once deployed, e.g.:
    // { url: 'https://hrms-backend.onrender.com/api/v1', description: 'Production' },
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
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          companyId: { type: "integer", nullable: true },
          email: { type: "string" },
          isVerified: { type: "boolean" },
          role: {
            type: "object",
            properties: { id: { type: "integer" }, name: { type: "string" } },
          },
          employee: { type: "object", nullable: true },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
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
      Department: {
        type: "object",
        properties: {
          id: { type: "integer" },
          companyId: { type: "integer" },
          name: { type: "string" },
          headId: { type: "integer", nullable: true },
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
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    {
      name: "Auth",
      description:
        "Registration, login, tokens, password reset, Google Sign-In",
    },
    { name: "Companies", description: "Company setup and management" },
    { name: "Departments", description: "Department CRUD" },
    { name: "Employees", description: "Employee CRUD and document uploads" },
  ],
  paths: {
    // ------------------------- AUTH Part-------------------------
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "email",
                  "password",
                  "firstName",
                  "lastName",
                  "roleName",
                ],
                properties: {
                  email: {
                    type: "string",
                    example: "newhire@techsolutions.com",
                  },
                  password: { type: "string", example: "Password123!" },
                  firstName: { type: "string", example: "Grace" },
                  lastName: { type: "string", example: "Adeyemi" },
                  roleName: {
                    type: "string",
                    enum: [
                      "super_admin",
                      "hr_admin",
                      "manager",
                      "employee",
                      "applicant",
                    ],
                  },
                  companyId: { type: "integer", nullable: true, example: 1 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "User created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          409: {
            description: "Email already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
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
                  email: {
                    type: "string",
                    example: "hradmin@techsolutions.com",
                  },
                  password: { type: "string", example: "Password123!" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          401: {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out (clears stored refresh token)",
        responses: {
          200: { description: "Logged out successfully" },
          401: {
            description: "Not authenticated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary:
          "Exchange a refresh token for a new access + refresh token pair",
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
          200: { description: "New tokens issued" },
          401: {
            description: "Invalid or expired refresh token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary:
          "Request a password reset token (dev: logged to server console)",
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
        responses: {
          200: { description: "Reset instructions sent if the email exists" },
        },
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
          200: { description: "Password reset successfully" },
          400: {
            description: "Invalid or expired token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
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
                  idToken: {
                    type: "string",
                    description:
                      "Google ID token from client-side Google Sign-In",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Signed in / account created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          401: {
            description: "Invalid Google ID token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },

    // ------------------------- COMPANIES Part-------------------------
    "/companies": {
      post: {
        tags: ["Companies"],
        summary: "Create a company (Company Setup step) — super_admin only",
        description:
          "Links the requesting user to the new company and re-issues fresh tokens containing the new companyId.",
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
          201: { description: "Company created; fresh tokens returned" },
          403: {
            description: "Requires super_admin role",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/companies/{id}": {
      get: {
        tags: ["Companies"],
        summary:
          "Get company details — hr_admin, super_admin (own company only)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: {
            description: "Company details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Company" },
              },
            },
          },
          403: {
            description: "Not your company",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["Companies"],
        summary:
          "Update company details — hr_admin, super_admin (own company only)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Company" },
            },
          },
        },
        responses: { 200: { description: "Updated company" } },
      },
    },

    // ------------------------- DEPARTMENTS Part-------------------------
    "/departments": {
      get: {
        tags: ["Departments"],
        summary: "List all departments in your company — hr_admin, manager",
        responses: {
          200: {
            description: "List of departments",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Department" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Departments"],
        summary: "Create a department — hr_admin only",
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
        responses: { 201: { description: "Department created" } },
      },
    },
    "/departments/{id}": {
      patch: {
        tags: ["Departments"],
        summary: "Update a department — hr_admin only",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  headId: { type: "integer", nullable: true },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Updated department" } },
      },
      delete: {
        tags: ["Departments"],
        summary: "Delete a department — hr_admin only",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: { 200: { description: "Department deleted" } },
      },
    },

    // ------------------------- EMPLOYEES Part-------------------------
    "/employees": {
      get: {
        tags: ["Employees"],
        summary: "List employees in your company — hr_admin, manager",
        parameters: [
          { name: "departmentId", in: "query", schema: { type: "integer" } },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["active", "inactive", "exited"] },
          },
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Matches first name, last name, or position",
          },
        ],
        responses: {
          200: {
            description: "List of employees",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Employee" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Employees"],
        summary: "Create an employee record — hr_admin only",
        description:
          "userId must reference a User in the same company who does not already have an employee record. employeeCode is auto-generated.",
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
                  employmentType: {
                    type: "string",
                    enum: ["full_time", "part_time", "contract", "intern"],
                  },
                  dateOfJoining: { type: "string", format: "date" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Employee created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Employee" },
              },
            },
          },
          404: {
            description: "User not found in this company",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          409: {
            description: "User already has an employee record",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/employees/{id}": {
      get: {
        tags: ["Employees"],
        summary:
          "Get one employee — hr_admin, manager, or the employee themself",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: {
            description: "Employee details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Employee" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["Employees"],
        summary:
          "Update an employee — hr_admin (full access) or self (restricted fields only)",
        description:
          "When updating your own record without an elevated role, only phoneNumber, address, emergencyContactName, and emergencyContactPhone are allowed.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Employee" },
            },
          },
        },
        responses: {
          200: { description: "Updated employee" },
          400: {
            description: "Restricted field not allowed for self-update",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Employees"],
        summary: "Delete an employee — hr_admin only",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: { 200: { description: "Employee deleted" } },
      },
    },
    "/employees/{id}/documents": {
      post: {
        tags: ["Employees"],
        summary: "Upload a document for an employee — hr_admin or self",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
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
        summary: "List documents for an employee — hr_admin or self",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: { 200: { description: "List of documents" } },
      },
    },
  },
};

export default swaggerSpec;
