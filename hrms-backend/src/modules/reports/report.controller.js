import * as reportService from "./report.service.js";

export async function employeeSummary(req, res, next) {
  try {
    const { departmentId } = req.query;
    const data = await reportService.employeeSummary(req.companyId, {
      departmentId,
    });
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

export async function departmentSummary(req, res, next) {
  try {
    const data = await reportService.departmentSummary(req.companyId);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

export async function leaveReport(req, res, next) {
  try {
    const { from, to, departmentId } = req.query;
    const data = await reportService.leaveReport(req.companyId, {
      from,
      to,
      departmentId,
    });
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

export async function attendanceReport(req, res, next) {
  try {
    const { from, to, departmentId } = req.query;
    const data = await reportService.attendanceReport(req.companyId, {
      from,
      to,
      departmentId,
    });
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

export async function recruitmentReport(req, res, next) {
  try {
    const data = await reportService.recruitmentReport(req.companyId);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

export async function payrollSummary(req, res, next) {
  try {
    const { month, year, departmentId } = req.query;
    const data = await reportService.payrollSummary(req.companyId, {
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      departmentId,
    });
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

export async function adminDashboard(req, res, next) {
  try {
    const data = await reportService.adminDashboard(req.companyId);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}
