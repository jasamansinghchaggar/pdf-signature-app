import { z } from 'zod';

export const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            // Validate request body against the schema
            const validatedData = schema.parse(req.body);
            
            // Replace req.body with validated data
            req.body = validatedData;
            
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessages = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));

                // Create a more descriptive error message
                const userFriendlyMessage = 'Validation failed: ' + 
                    errorMessages.map(err => `${err.message}`).join(', ');

                return res.status(400).json({
                    success: false,
                    message: userFriendlyMessage,
                    errors: errorMessages
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error during validation'
            });
        }
    };
};
