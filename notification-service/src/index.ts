import express, { Application, Request, Response } from 'express';
import amqp from 'amqplib';

class NotificationService {
    private app: Application;
    private channel: amqp.Channel | null = null;

    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.connectRabbitMQ();
    }

    private setupMiddleware(): void {
        this.app.use(express.json());
    }

    private async connectRabbitMQ(): Promise<void> {
        try {
            const connection = await amqp.connect('amqp://localhost');
            this.channel = await connection.createChannel();
            console.log('Connected to RabbitMQ');
            this.channel.consume('order_notifications', (msg:any) => {
                if (msg) {
                    const content = msg.content.toString();
                    console.log('Received:', content);
                    this.channel?.ack(msg);
                }
            });
        } catch (error) {
            console.error('Failed to connect to RabbitMQ', error);
        }
    }

    public start(): void {
        this.app.listen(3004, () => {
            console.log('Notification Service is running on port 3004');
        });
    }
}

const notificationService = new NotificationService();
notificationService.start();
