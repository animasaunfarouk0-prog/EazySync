const companyService = require("./company.service");

async function create(req, res, next) {
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

async function getById(req, res, next) {
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

async function update(req, res, next) {
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

module.exports = { create, getById, update };
