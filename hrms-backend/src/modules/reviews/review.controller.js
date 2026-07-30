import * as reviewService from "./review.service.js";

export async function list(req, res, next) {
  try {
    const { status, reviewType } = req.query;
    const reviews = await reviewService.listReviews(req.companyId, req.user, {
      status,
      reviewType,
    });
    res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const reviewId = Number(req.params.id);
    const review = await reviewService.getReviewById(
      req.companyId,
      req.user,
      reviewId
    );
    res.status(200).json(review);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const review = await reviewService.createReview(
      req.companyId,
      req.user.userId,
      req.body
    );
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const reviewId = Number(req.params.id);
    const review = await reviewService.updateReview(
      req.companyId,
      reviewId,
      req.body
    );
    res.status(200).json(review);
  } catch (err) {
    next(err);
  }
}

export async function submitFeedback(req, res, next) {
  try {
    const reviewId = Number(req.params.id);
    const review = await reviewService.submitFeedback(
      req.companyId,
      req.user,
      reviewId,
      req.body
    );
    res.status(200).json(review);
  } catch (err) {
    next(err);
  }
}

export async function saveFeedbackDraft(req, res, next) {
  try {
    const reviewId = Number(req.params.id);
    const review = await reviewService.saveFeedbackDraft(
      req.companyId,
      req.user,
      reviewId,
      req.body
    );
    res.status(200).json(review);
  } catch (err) {
    next(err);
  }
}
