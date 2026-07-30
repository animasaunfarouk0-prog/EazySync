import * as leaveService from "./leave.service.js";

export async function dashboard(req, res, next) {
  try {
    const data = await leaveService.getDashboard(req.companyId);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const { status, leaveTypeId, from, to } = req.query;
    const requests = await leaveService.listRequests(
      req.companyId,
      req.user,
      { status, leaveTypeId, from, to }
    );
    res.status(200).json(requests);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const requestId = Number(req.params.id);
    const request = await leaveService.getRequestById(
      req.companyId,
      req.user,
      requestId
    );
    res.status(200).json(request);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const request = await leaveService.createRequest(
      req.companyId,
      req.user.employeeId,
      req.body
    );
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
}

export async function approve(req, res, next) {
  try {
    const requestId = Number(req.params.id);
    const request = await leaveService.approveRequest(
      req.companyId,
      req.user,
      requestId,
      req.body
    );
    res.status(200).json(request);
  } catch (err) {
    next(err);
  }
}

export async function reject(req, res, next) {
  try {
    const requestId = Number(req.params.id);
    const request = await leaveService.rejectRequest(
      req.companyId,
      req.user,
      requestId,
      req.body
    );
    res.status(200).json(request);
  } catch (err) {
    next(err);
  }
}

export async function cancel(req, res, next) {
  try {
    const requestId = Number(req.params.id);
    const request = await leaveService.cancelRequest(
      req.companyId,
      req.user,
      requestId,
      req.body
    );
    res.status(200).json(request);
  } catch (err) {
    next(err);
  }
}

export async function myBalance(req, res, next) {
  try {
    const balance = await leaveService.getMyBalance(
      req.companyId,
      req.user.employeeId
    );
    res.status(200).json(balance);
  } catch (err) {
    next(err);
  }
}

export async function employeeBalance(req, res, next) {
  try {
    const employeeId = Number(req.params.employeeId);
    const balance = await leaveService.getEmployeeBalance(
      req.companyId,
      employeeId
    );
    res.status(200).json(balance);
  } catch (err) {
    next(err);
  }
}

export async function calendar(req, res, next) {
  try {
    const { month, year } = req.query;
    const events = await leaveService.getCalendar(
      req.companyId,
      req.user,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined
    );
    res.status(200).json(events);
  } catch (err) {
    next(err);
  }
}
