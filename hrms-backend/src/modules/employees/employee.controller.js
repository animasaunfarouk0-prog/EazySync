const employeeService = require("./employee.service");

async function list(req, res, next) {
  try {
    const { departmentId, status, search } = req.query;
    const employees = await employeeService.listEmployees(req.companyId, {
      departmentId,
      status,
      search,
    });
    res.status(200).json(employees);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const employee = await employeeService.createEmployee(
      req.companyId,
      req.body
    );
    res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const employeeId = Number(req.params.id);
    const employee = await employeeService.getEmployeeById(
      req.companyId,
      employeeId
    );
    res.status(200).json(employee);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const employeeId = Number(req.params.id);
    const employee = await employeeService.updateEmployee(
      req.companyId,
      employeeId,
      req.body
    );
    res.status(200).json(employee);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const employeeId = Number(req.params.id);
    await employeeService.deleteEmployee(req.companyId, employeeId);
    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (err) {
    next(err);
  }
}

async function uploadDocument(req, res, next) {
  try {
    const employeeId = Number(req.params.id);

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const documentType = req.body.documentType || "other";

    const document = await employeeService.addDocument(
      req.companyId,
      employeeId,
      {
        documentType,
        fileUrl,
      }
    );

    res.status(201).json(document);
  } catch (err) {
    next(err);
  }
}

async function listDocuments(req, res, next) {
  try {
    const employeeId = Number(req.params.id);
    const documents = await employeeService.listDocuments(
      req.companyId,
      employeeId
    );
    res.status(200).json(documents);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  create,
  getById,
  update,
  remove,
  uploadDocument,
  listDocuments,
};
