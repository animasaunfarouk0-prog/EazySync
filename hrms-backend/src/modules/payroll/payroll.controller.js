import * as payrollService from "./payroll.service.js";

export async function createSalaryStructure(req, res, next) {
  try {
    const structure = await payrollService.createSalaryStructure(
      req.companyId,
      req.body
    );
    res.status(201).json(structure);
  } catch (err) {
    next(err);
  }
}

export async function updateSalaryStructure(req, res, next) {
  try {
    const structure = await payrollService.updateSalaryStructure(
      req.companyId,
      Number(req.params.id),
      req.body
    );
    res.status(200).json(structure);
  } catch (err) {
    next(err);
  }
}

export async function listSalaryStructures(req, res, next) {
  try {
    const structures = await payrollService.listSalaryStructures(req.companyId);
    res.status(200).json(structures);
  } catch (err) {
    next(err);
  }
}

export async function getSalaryStructure(req, res, next) {
  try {
    const structure = await payrollService.getSalaryStructure(
      req.companyId,
      Number(req.params.id)
    );
    res.status(200).json(structure);
  } catch (err) {
    next(err);
  }
}

export async function runPayroll(req, res, next) {
  try {
    const result = await payrollService.runPayroll(req.companyId, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listPayslips(req, res, next) {
  try {
    const { month, year, departmentId, status } = req.query;
    const payslips = await payrollService.listPayslips(req.companyId, {
      month,
      year,
      departmentId,
      status,
    });
    res.status(200).json(payslips);
  } catch (err) {
    next(err);
  }
}

export async function getPayslip(req, res, next) {
  try {
    const payslip = await payrollService.getPayslip(
      req.companyId,
      req.user,
      Number(req.params.id)
    );
    res.status(200).json(payslip);
  } catch (err) {
    next(err);
  }
}

export async function myPayslips(req, res, next) {
  try {
    const payslips = await payrollService.myPayslips(
      req.companyId,
      req.user.employeeId
    );
    res.status(200).json(payslips);
  } catch (err) {
    next(err);
  }
}

export async function markPayslipPaid(req, res, next) {
  try {
    const payslip = await payrollService.markPayslipPaid(
      req.companyId,
      Number(req.params.id)
    );
    res.status(200).json(payslip);
  } catch (err) {
    next(err);
  }
}
