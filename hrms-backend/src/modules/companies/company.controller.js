import * as companyService from "./company.service.js";

export async function create(req, res, next) {
  try {
    const result = await companyService.createCompany(
      req.user.userId,
      req.body
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const companyId = Number(req.params.id);
    const company = await companyService.getCompanyById(
      companyId,
      req.companyId
    );
    res.status(200).json(company);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const companyId = Number(req.params.id);
    const company = await companyService.updateCompany(
      companyId,
      req.companyId,
      req.body
    );
    res.status(200).json(company);
  } catch (err) {
    next(err);
  }
}
