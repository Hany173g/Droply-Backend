/**
 * @swagger
 * components:
 *   schemas:
 *     CommentUser:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d2
 *         name:
 *           type: string
 *           example: Ahmed Ali
 *         username:
 *           type: string
 *           example: ahmedali
 *         photo:
 *           type: string
 *           example: https://res.cloudinary.com/...
 *     Comment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d1
 *         user:
 *           $ref: '#/components/schemas/CommentUser'
 *         targetId:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d3
 *         targetType:
 *           type: string
 *           example: video
 *         content:
 *           type: string
 *           example: Great video!
 *         action:
 *           type: object
 *           nullable: true
 *           properties:
 *             isLike:
 *               type: boolean
 *               example: true
 *             type:
 *               type: string
 *               enum:
 *                 - like
 *                 - dislike
 *               example: like
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 */
