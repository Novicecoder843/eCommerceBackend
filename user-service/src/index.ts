import express, { Application, Request, Response } from 'express';
import mongoose, { Document, Schema } from 'mongoose';
import amqp from 'amqplib';
import bcrypt from 'bcrypt';

interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new mongoose.Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

// Password hashing middleware
UserSchema.pre('save', async function (next:any) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error:any) {
        next(error);
    }
});

// Instance method to compare passwords
UserSchema.methods.comparePassword = function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', UserSchema);

class UserService {
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
        this.app.post('/users', this.createUser.bind(this));
        this.app.get('/users/:id', this.getUser.bind(this));
        this.app.put('/users/:id', this.updateUser.bind(this));
        this.app.delete('/users/:id', this.deleteUser.bind(this));
        this.app.post('/users/login', this.loginUser.bind(this));
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

    private async createUser(req: Request, res: Response): Promise<void> {
        const { name, email, password } = req.body;

        try {
            const user = new User({ name, email, password });
            await user.save();
            res.status(201).send({ message: 'User created successfully', user });
        } catch (error:any) {
            if (error.code === 11000) {
                res.status(400).send({ message: 'Email already exists' });
            } else {
                res.status(500).send({ message: 'Error creating user', error });
            }
        }
    }

    private async getUser(req: Request, res: any): Promise<void> {
        try {
            const user = await User.findById(req.params.id).select('-password');
            if (!user) {
                return res.status(404).send({ message: 'User not found' });
            }
            res.send(user);
        } catch (error) {
            res.status(500).send({ message: 'Error fetching user', error });
        }
    }

    private async updateUser(req: Request, res: any): Promise<void> {
        try {
            const { name, email, password } = req.body;
            const user = await User.findById(req.params.id);

            if (!user) {
                return res.status(404).send({ message: 'User not found' });
            }

            user.name = name || user.name;
            user.email = email || user.email;

            if (password) {
                user.password = password;
            }

            await user.save();
            res.send({ message: 'User updated successfully', user });
        } catch (error) {
            res.status(500).send({ message: 'Error updating user', error });
        }
    }

    private async deleteUser(req: Request, res: any): Promise<void> {
        try {
            const user = await User.findByIdAndDelete(req.params.id);
            if (!user) {
                return res.status(404).send({ message: 'User not found' });
            }
            res.send({ message: 'User deleted successfully' });
        } catch (error) {
            res.status(500).send({ message: 'Error deleting user', error });
        }
    }

    private async loginUser(req: Request, res: any): Promise<void> {
        const { email, password } = req.body;

        try {
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(401).send({ message: 'Invalid email or password' });
            }

            const isMatch = await user.comparePassword(password);

            if (!isMatch) {
                return res.status(401).send({ message: 'Invalid email or password' });
            }

            res.send({ message: 'Login successful', user });
        } catch (error) {
            res.status(500).send({ message: 'Error logging in', error });
        }
    }

    public start(): void {
        this.app.listen(3001, () => {
            console.log('User Service is running on port 3001');
        });
    }
}

const userService = new UserService();
userService.start();
