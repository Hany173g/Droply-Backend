// /**
//  * @swagger
//  * components:
//  *   schemas:
//  *     LoginSuccess:
//  *       type: object
//  *       required:
//  *         - accessToken
//  *         - success
//  *         - message
//  *       properties:
//  *         accessToken:
//  *           type: string
//  *           example: eyJhbGciOiJIUzI1NiIs...
//  *         success:
//  *           type: boolean
//  *           example: true
//  *         message:
//  *           type: string
//  *           example: Login is successfully
//  *     LoginIsTwoFactor:
//  *       type: object
//  *       required:
//  *          - message
//  *          - success
//  *          - verificationId
//  *       properties:
//  *          message:
//  *              type: string
//  *              example: Please check your email
//  *          success:
//  *              type: boolean
//  *              example: true
//  *          verificationId:
//  *              type: string
//  *              example: 4a0f8b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a
//  *              description:  Verification ID used to complete two-factor authentication.
//  *  
//  */