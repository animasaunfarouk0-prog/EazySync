import Joi from "joi";

export const createReviewSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  reviewType: Joi.string()
    .valid("Mid Year", "Annual", "Probation")
    .optional()
    .allow(null, ""),
  reviewPeriodStart: Joi.date().optional().allow(null),
  reviewPeriodEnd: Joi.date().optional().allow(null),
});

export const updateReviewSchema = Joi.object({
  reviewType: Joi.string()
    .valid("Mid Year", "Annual", "Probation")
    .optional()
    .allow(null, ""),
  reviewPeriodStart: Joi.date().optional().allow(null),
  reviewPeriodEnd: Joi.date().optional().allow(null),
  overallRating: Joi.number().precision(1).min(0).max(5).optional().allow(null),
  strengths: Joi.string().optional().allow(null, ""),
  areasForImprovement: Joi.string().optional().allow(null, ""),
  additionalComments: Joi.string().optional().allow(null, ""),
}).min(1);

export const feedbackSchema = Joi.object({
  overallRating: Joi.number().precision(1).min(0).max(5).optional().allow(null),
  strengths: Joi.string().optional().allow(null, ""),
  areasForImprovement: Joi.string().optional().allow(null, ""),
  additionalComments: Joi.string().optional().allow(null, ""),
  goalRatings: Joi.array()
    .items(
      Joi.object({
        goalId: Joi.number().integer().required(),
        employeeRating: Joi.number()
          .precision(1)
          .min(0)
          .max(5)
          .optional()
          .allow(null),
        reviewerRating: Joi.number()
          .precision(1)
          .min(0)
          .max(5)
          .optional()
          .allow(null),
      })
    )
    .optional(),
  competencyRatings: Joi.array()
    .items(
      Joi.object({
        competencyName: Joi.string().required(),
        rating: Joi.number().precision(1).min(0).max(5).optional().allow(null),
      })
    )
    .optional(),
});

export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((d) => d.message),
      });
    }
    req.body = value;
    next();
  };
}
