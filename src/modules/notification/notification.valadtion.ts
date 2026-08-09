import Joi from "joi"

export const getNotificationsSchema = Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(50).default(20),
})

export const markAsReadSchema = Joi.object({
    notificationId: Joi.string().hex().length(24).required(),
})
