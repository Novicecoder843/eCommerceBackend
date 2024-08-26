import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import amqp from 'amqplib';

class OrderService {
    private app: Application;
    private channel: amqp.Channel | null = null;

    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.connectDB();
        this.connectRabbitMQ();
    }

    private setupMiddleware(): void {
        this.app.use(express.json());
    }

    private setupRoutes(): void {
        this.app.post('/orders', this.createOrder.bind(this));
        this.app.get('/orders/:id', this.getOrder.bind(this));
        this.app.put('/orders/:id', this.updateOrder.bind(this));
        this.app.delete('/orders/:id', this.deleteOrder.bind(this));
    }

    private async connectDB(): Promise<void> {
        try {
            await mongoose.connect('mongodb://127.0.0.1:27017/Ecommerce', {
                // useNewUrlParser: true,
                // useUnifiedTopology: true,
            });
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('Failed to connect to MongoDB', error);
        }
    }

    private async connectRabbitMQ(): Promise<void> {
        try {
            const connection = await amqp.connect('amqp://localhost');
            this.channel = await connection.createChannel();
            await this.channel.assertQueue('order_notifications');
            console.log('Connected to RabbitMQ');
        } catch (error) {
            console.error('Failed to connect to RabbitMQ', error);
        }
    }

    private async createOrder(req: Request, res: Response): Promise<void> {
        const { userId, products, totalPrice } = req.body;
        try {
            const order = new Order({ userId, products, totalPrice });
            await order.save();
            if (this.channel) {
                this.channel.sendToQueue(
                    'order_notifications',
                    Buffer.from(JSON.stringify(order))
                );
                console.log('Order notification sent:', order);
            }
            res.status(201).send(order);
        } catch (error) {
            res.status(500).send({ message: 'Error creating order', error });
        }
    }

    private async getOrder(req: Request, res: any): Promise<void> {
        try {
            const order = await Order.findById(req.params.id);
            if (!order) {
                return res.status(404).send({ message: 'Order not found' });
            }
            res.send(order);
        } catch (error) {
            res.status(500).send({ message: 'Error fetching order', error });
        }
    }

    private async updateOrder(req: Request, res: any): Promise<void> {
        try {
            const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!order) {
                return res.status(404).send({ message: 'Order not found' });
            }
            res.send(order);
        } catch (error) {
            res.status(500).send({ message: 'Error updating order', error });
        }
    }

    private async deleteOrder(req: Request, res: any): Promise<void> {
        try {
            const order = await Order.findByIdAndDelete(req.params.id);
            if (!order) {
                return res.status(404).send({ message: 'Order not found' });
            }
            res.send({ message: 'Order deleted' });
        } catch (error) {
            res.status(500).send({ message: 'Error deleting order', error });
        }
    }

    public start(): void {
        this.app.listen(3003, () => {
            console.log('Order Service is running on port 3003');
        });
    }
}

// const OrderSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, required: true },
//     productId: { type: mongoose.Schema.Types.ObjectId, required: true },
//     quantity: { type: Number, required: true },
// });

const ProductSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
    quantity: { type: Number, required: true },
});

const OrderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    products: [ProductSchema],
    totalPrice: { type: Number, required: true },
});
const Order = mongoose.model('Order', OrderSchema);

const orderService = new OrderService();
orderService.start();
