import * as attendanceService from "./attendance.service.js";

export async function clockIn(req, res, next) {
  try {
    const record = await attendanceService.clockIn(
      req.companyId,
      req.user.employeeId
    );
    res.status(200).json(record);
  } catch (err) {
    next(err);
  }
}

export async function clockOut(req, res, next) {
  try {
    const record = await attendanceService.clockOut(
      req.companyId,
      req.user.employeeId
    );
    res.status(200).json(record);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const record = await attendanceService.createAttendanceRecord(
      req.companyId,
      req.body
    );
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const { status, from, to, departmentId, employeeId, month, year } = req.query;
    const records = await attendanceService.listAttendance(req.companyId, {
      status,
      from,
      to,
      departmentId,
      employeeId,
      month,
      year,
    });
    res.status(200).json(records);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const record = await attendanceService.getAttendanceRecord(
      req.companyId,
      req.user,
      Number(req.params.id)
    );
    res.status(200).json(record);
  } catch (err) {
    next(err);
  }
}

export async function myRecords(req, res, next) {
  try {
    const { month, year } = req.query;
    const records = await attendanceService.listAttendance(req.companyId, {
      employeeId: req.user.employeeId,
      month,
      year,
    });
    res.status(200).json(records);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const record = await attendanceService.updateAttendanceRecord(
      req.companyId,
      Number(req.params.id),
      req.body
    );
    res.status(200).json(record);
  } catch (err) {
    next(err);
  }
}
