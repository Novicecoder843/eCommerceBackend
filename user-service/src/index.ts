import express, { Application, Request, Response } from 'express';
import amqp from 'amqplib';

class UserService {
    private app: Application;
    private channel: amqp.Channel | null = null;

    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.connectRabbitMQ();
    }

    private setupMiddleware(): void {
        this.app.use(express.json());
    }

    private setupRoutes(): void {
        this.app.post('/register', this.registerUser);
        this.app.post('/login', this.loginUser);
    }

    private async connectRabbitMQ(): Promise<void> {
        try {
            const connection = await amqp.connect('amqp://localhost');
            this.channel = await connection.createChannel();
            console.log('Connected to RabbitMQ');
        } catch (error) {
            console.error('Failed to connect to RabbitMQ', error);
        }
    }

    private async registerUser(req: Request, res: Response): Promise<void> {
        const { username, password } = req.body;

        // Logic to register the user

        if (this.channel) {
            // Notify other services (e.g., notification service) via RabbitMQ
            this.channel.sendToQueue('userRegistered', Buffer.from(JSON.stringify({ username })));
        }

        res.status(201).send({ message: 'User registered successfully' });
    }

    private async loginUser(req: Request, res: Response): Promise<void> {
        const { username, password } = req.body;

        // Logic to authenticate the user

        res.status(200).send({ message: 'User logged in successfully' });
    }

    public start(): void {
        this.app.listen(3001, () => {
            console.log('User Service is running on port 3001');
        });
    }
}

const userService = new UserService();
userService.start();
