# E-commerce Microservices Architecture
This project implements a basic e-commerce platform using a microservices architecture with Node.js, Express, TypeScript, and RabbitMQ. The project consists of four services: User Service, Product Service, Order Service, and Notification Service.

# Services Overview
User Service: Manages user registration, login, and profile details. Passwords are hashed using bcrypt.
Product Service: Handles CRUD operations for products.
Order Service: Manages order creation, viewing, updating, and deletion. It publishes order events to RabbitMQ.
Notification Service: Listens for order events from RabbitMQ and processes notifications.
Prerequisites


Before you start, make sure you have the following installed on your system:
Node.js (v14 or later)
MongoDB
RabbitMQ
Installation
Clone the repository and navigate to each service directory to install the dependencies:


git clone https://github.com/Novicecoder843/eCommerceBackend.git
cd eCommerceBackend

# Install dependencies for all services
cd user-service
npm install

cd ../product-service
npm install

cd ../order-service
npm install

cd ../notification-service
npm install



# Running the Services
To run each service, navigate to its directory and use the following command:


npm start
This will start the service on its respective port:

User Service: http://localhost:3001
Product Service: http://localhost:3002
Order Service: http://localhost:3003
Notification Service: http://localhost:3004

Running All Services Simultaneously
You can open multiple terminal windows or tabs and run the above command in each service's directory. Alternatively, you can use a process manager like PM2 to run all services simultaneously.

# API Endpoints
# User Service (http://localhost:3001)
POST /users : Register a new user.
POST /users/login : Login with email and password.
GET /users/:id : Get user details by ID.
PUT /users/:id : Update user details.
DELETE /users/:id : Delete a user by ID.

# Product Service (http://localhost:3002)
POST /products: Create a new product.
GET /products/:id: Get product details by ID.
PUT /products/:id: Update product details.
DELETE /products/:id: Delete a product by ID.
PUT /products/:id/reduce-stock : Reduce Stock

# Order Service (http://localhost:3003)
POST /orders: Create a new order.
GET /orders/:id: Get order details by ID.
PUT /orders/:id: Update an order.
DELETE /orders/:id: Delete an order by ID.

# Notification Service (http://localhost:3004)
This service doesn't expose any public endpoints. It listens for messages on the RabbitMQ order_notifications queue and logs received messages.

RabbitMQ Integration
Order Service: Publishes order creation events to the order_notifications queue.
Notification Service: Consumes messages from the order_notifications queue.

License
This project is licensed under the MIT License. See the LICENSE file for more information.

