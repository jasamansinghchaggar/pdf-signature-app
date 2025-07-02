# Backend for PDF Signature App

This backend is built using Node.js and Express.js to provide APIs for a PDF signature application. It handles user authentication, document uploads, signature management, and audit tracking.

## Features
- User authentication (JWT-based)
- Upload and manage PDF documents
- Upload and manage signatures
- Audit logging for document and signature actions

## Project Structure
- `config/`: Configuration files for database, JWT, and file uploads.
- `controllers/`: Contains logic for handling API requests.
- `middleware/`: Middleware for authentication and validation.
- `models/`: Mongoose models for database entities.
- `routes/`: API route definitions.
- `services/`: Business logic and helper functions.
- `uploads/`: Directory for storing uploaded documents and signatures.
- `utils/`: Utility classes and functions.
- `validations/`: Validation schemas for user input.


## API Endpoints
- **Auth**: `/api/auth`
- **Documents**: `/api/documents`
- **Signatures**: `/api/signatures`
- **Audit Logs**: `/api/audit`

## Dependencies
- Express.js
- Mongoose
- Multer
- Jsonwebtoken
- Dotenv
- Cors
- Body-parser
- Bcryptjs
- Nodemon (for development)
- Morgan

## License
This project is licensed under the MIT License.