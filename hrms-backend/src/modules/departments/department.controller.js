import * as departmentService from "./department.service.js";

export async function list(req, res, next) {
  try {
    const departments = await departmentService.listDepartments(req.companyId);
    res.status(200).json(departments);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const department = await departmentService.createDepartment(
      req.companyId,
      req.body
    );
    res.status(201).json(department);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const departmentId = Number(req.params.id);
    const department = await departmentService.updateDepartment(
      req.companyId,
      departmentId,
      req.body
    );
    res.status(200).json(department);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const departmentId = Number(req.params.id);
    await departmentService.deleteDepartment(req.companyId, departmentId);
    res.status(200).json({ message: "Department deleted successfully" });
  } catch (err) {
    next(err);
  }
}
