import express from "express"

// Validation middleware
const validate = (schema: any, source: "body" | "query" | "params" = "body") => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            const data = req[source];
            // Check if data exists and is valid object
            if (!data || typeof data !== 'object') {
                return res.status(400).json({
                    success: false,
                    message: `Invalid ${source} format`
                });
            }

            const { error } = schema.validate(data);
            if (error) {
                console.log("Validation error:", error.details);
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }
            next();
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: `Invalid ${source} format`
            });
        }
    };
};

export default validate