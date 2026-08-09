/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: "Register route"
 *     description: "Authenticate a user to create new account"
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: droply@gmail.com
 *                 description: only support gmail email
 *               password:
 *                 type: string
 *                 format: password
 *                 example: droplypassword123$
 *                 minLength: 10
 *                 maxLength: 40
 *                 description: Password must contain at least one number, and one symbol.
 *               name:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 20
 *                 example: Droply
 *     responses:
 *       "201":
 *         description: "Account created successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Account created successfully. Please check your email to verify your account."
 *                 success:
 *                   type: boolean
 *                   example: true
 *       "400":
 *         description: "Validation error"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *       "409":
 *         description: "Email already exists"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *       "422":
 *         description: "Not a gmail email or password missing number/symbol"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *       "500":
 *         description: "Internal server error (hashing, db create, email sending)"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *
 *
 * /auth/verify-account/{verifyToken}:
 *   post:
 *     summary: Verify a user
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: verifyToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Account verification token
 *     responses:
 *       "200":
 *         description: "Account is verify"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *       "404":
 *         description: "Verification Token not found or expired"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *       "410":
 *         description: "Verification Token is expired"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *       "500":
 *         description: "Internal server error (user not found/updated or channel creation failed)"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 * /auth/forget-password:
 *   post:
 *     summary: "Forget password route"
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: droply@gmail.com
 *     responses:
 *       "200":
 *         description: "Please check your email to reset your account."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *       "400":
 *         description: "Validation error"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *       "404":
 *         description: "User not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *       "500":
 *         description: "Internal server error (email sending failed)"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *
 * /auth/login:
 *  post:
 *      summary: Login route
 *      tags:
 *         - Auth
 *      requestBody:
 *           required: true
 *           content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      required:
 *                          - email
 *                          - password
 *                      properties:
 *                          email:
 *                              type: string  
 *                              format: email
 *                              example: droply@gmail.com
 *                              description: "Only support gmail format"
 *                          password:
 *                              type: string
 *                              description: "Password must inculde number and symbol"
 *      responses:
 *          "200":
 *                description: Login successfull
 *                content:
 *                    application/json:
 *                      examples:
 *                        loginSuccess:
 *                          summary: "Login successful (no 2FA)"
 *                          value:
 *                            accessToken: "eyJhbGciOiJIUzI1NiIs..."
 *                            success: true
 *                            message: "Login is successfully"
 *                        loginIsTwoFactor:
 *                          summary: "Two-factor authentication required"
 *                          value:
 *                            message: "Please check your email"
 *                            success: true
 *                            verificationId: "4a0f8b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a"
 *          "400":
 *                description: "Validation error"
 *                content:
 *                    application/json:
 *                      schema:
 *                        type: object
 *                        properties:
 *                          success:
 *                            type: boolean
 *                            example: false
 *                          message:
 *                            type: string
 *          "422":
 *                description: "Password must contain number and symbol"
 *                content:
 *                    application/json:
 *                      schema:
 *                        type: object
 *                        properties:
 *                          success:
 *                            type: boolean
 *                            example: false
 *                          message:
 *                            type: string
 *          "404":
 *                description: "User not found"
 *                content:
 *                    application/json:
 *                      schema:
 *                        type: object
 *                        properties:
 *                          success:
 *                            type: boolean
 *                            example: false
 *                          message:
 *                            type: string
 *          "401":
 *                description: "Invalid password or account not verified"
 *                content:
 *                    application/json:
 *                      schema:
 *                        type: object
 *                        properties:
 *                          success:
 *                            type: boolean
 *                            example: false
 *                          message:
 *                            type: string  
 */
