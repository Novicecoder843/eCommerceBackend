import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import amqp from 'amqplib';

class ProductService {
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
        this.app.post('/products', this.createProduct.bind(this));
        this.app.get('/products/:id', this.getProduct.bind(this));
        this.app.put('/products/:id', this.updateProduct.bind(this));
        this.app.delete('/products/:id', this.deleteProduct.bind(this));
        this.app.put('/products/:id/reduce-stock', this.reduceStock.bind(this));
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
            console.log('Connected to RabbitMQ');
        } catch (error) {
            console.error('Failed to connect to RabbitMQ', error);
        }
    }

    private async createProduct(req: Request, res: any): Promise<void> {
        const { name, price, stock ,description} = req.body;
        try {
            const product = new Product({ name, price, stock,description });
            await product.save();
            res.status(201).send(product);
        } catch (error) {
            res.status(500).send({ message: 'Error creating product', error });
        }
    }

    private async getProduct(req: Request, res: any): Promise<void> {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).send({ message: 'Product not found' });
            }
            res.send(product);
        } catch (error) {
            res.status(500).send({ message: 'Error fetching product', error });
        }
    }

    private async updateProduct(req: Request, res: any): Promise<void> {
        try {
            const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!product) {
                return res.status(404).send({ message: 'Product not found' });
            }
            res.send(product);
        } catch (error) {
            res.status(500).send({ message: 'Error updating product', error });
        }
    }

    private async deleteProduct(req: Request, res: any): Promise<void> {
        try {
            const product = await Product.findByIdAndDelete(req.params.id);
            if (!product) {
                return res.status(404).send({ message: 'Product not found' });
            }
            res.send({ message: 'Product deleted' });
        } catch (error) {
            res.status(500).send({ message: 'Error deleting product', error });
        }
    }

    private async reduceStock(req: Request, res: any): Promise<void> {
        const { quantity } = req.body;
        try {
            const product = await Product.findById(req.params.id);
            if (!product || product.stock < quantity) {
                return res.status(400).send({ message: 'Insufficient stock' });
            }
            product.stock -= quantity;
            await product.save();
            res.send(product);
        } catch (error) {
            res.status(500).send({ message: 'Error reducing stock', error });
        }
    }

    public start(): void {
        this.app.listen(3002, () => {
            console.log('Product Service is running on port 3002');
        });
    }
}

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description:{type: String, required: true},
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
});

const Product = mongoose.model('Product', ProductSchema);

const productService = new ProductService();
productService.start();
