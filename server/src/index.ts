import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Basic health check (Public)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date(), message: 'Harmonizer API v2.0' });
});

// Protect all other routes
app.use('/api', authMiddleware);

// Endpoints API
app.get('/api/endpoints', async (req, res) => {
    try {
        const endpoints = await prisma.endpoint.findMany();
        res.json(endpoints);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch endpoints' });
    }
});

app.post('/api/endpoints/sync', async (req, res) => {
    const { endpoints } = req.body;
    if (!Array.isArray(endpoints)) {
        return res.status(400).json({ error: 'Endpoints must be an array' });
    }

    try {
        for (const ep of endpoints) {
            await prisma.endpoint.upsert({
                where: { hostname: ep.hostname },
                update: ep,
                create: ep,
            });
        }
        res.json({ success: true, count: endpoints.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to sync endpoints' });
    }
});

// Alerts API
app.get('/api/alerts', async (req, res) => {
    try {
        const alerts = await prisma.alert.findMany({
            orderBy: { timestamp: 'desc' }
        });
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

app.post('/api/alerts', async (req, res) => {
    try {
        const alert = await prisma.alert.create({
            data: req.body
        });
        res.json(alert);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create alert' });
    }
});

app.delete('/api/alerts', async (req, res) => {
    try {
        await prisma.alert.deleteMany();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear alerts' });
    }
});

// Offboarding API
app.get('/api/offboarding', async (req, res) => {
    try {
        const offboarding = await prisma.offboardingAlert.findMany();
        res.json(offboarding);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch offboarding alerts' });
    }
});

// Sync Logs
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await prisma.syncLog.findMany({
            orderBy: { timestamp: 'desc' }
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

app.post('/api/logs', async (req, res) => {
    try {
        const log = await prisma.syncLog.create({
            data: req.body
        });
        res.json(log);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create log' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
