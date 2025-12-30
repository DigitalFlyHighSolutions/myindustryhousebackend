# Project Overview

This project is a Node.js-based marketplace application built with a microservices architecture. It uses Express.js as the web framework, Prisma as the ORM for interacting with a PostgreSQL database, and Socket.io for real-time communication. The application is containerized using Docker and uses Krakend as an API gateway to manage requests to the various services.

## Architecture

The application is composed of the following microservices:

*   **API Gateway (`krakend`):**  Handles all incoming requests and routes them to the appropriate backend service.
*   **Authentication Service (`auth-service`):** Manages user authentication and authorization.
*   **Product Service (`product-service`):**  Handles product-related operations, such as creating, reading, updating, and deleting products.

## Database

The application uses a PostgreSQL database with the schema managed by Prisma. The schema includes models for:

*   Users (buyers, sellers, admins)
*   Products and Categories
*   Subscriptions and Plans
*   Messaging (conversations and messages)
*   Requirements and Seller Profiles

# Building and Running

## Prerequisites

*   Docker
*   Docker Compose

## Running the Application

1.  **Start the services:**

    ```bash
    docker-compose up -d
    ```

2.  **The application will be available at the following endpoints:**

    *   **API Gateway:** `http://localhost:8080`
    *   **Auth Service:** `http://localhost:5001`
    *   **Product Service:** `http://localhost:5002`

## Development

To run the main application in development mode with hot-reloading:

```bash
npm run dev
```

## Scripts

*   `npm start`: Starts the main application server.
*   `npm run dev`: Starts the main application server in development mode using `nodemon`.
*   `npm run clean-locations`: A script for updating product locations.

# Development Conventions

*   **Code Style:** The project uses a consistent code style, but there is no linter configuration file (`.eslintrc`, `.prettierrc`) to enforce it.
*   **Testing:** There are no explicit test files or testing frameworks configured in the `package.json` file.
*   **Database Migrations:** Database migrations are managed by Prisma. To create a new migration, run `npx prisma migrate dev`.
