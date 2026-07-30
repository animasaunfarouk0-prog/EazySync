import * as goalService from "./goal.service.js";

export async function list(req, res, next) {
  try {
    const { status, year, category, departmentId } = req.query;
    const goals = await goalService.listGoals(req.companyId, req.user, {
      status,
      year,
      category,
      departmentId,
    });
    res.status(200).json(goals);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const goalId = Number(req.params.id);
    const goal = await goalService.getGoalById(
      req.companyId,
      req.user,
      goalId
    );
    res.status(200).json(goal);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const goal = await goalService.createGoal(req.companyId, req.body);
    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const goalId = Number(req.params.id);
    const goal = await goalService.updateGoal(
      req.companyId,
      req.user,
      goalId,
      req.body
    );
    res.status(200).json(goal);
  } catch (err) {
    next(err);
  }
}
