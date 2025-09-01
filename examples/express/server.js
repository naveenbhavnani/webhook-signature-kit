import express from 'express';
import { verifyWebhook } from '../../src/index';
const app = express();
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = Buffer.from(buf); } }));
app.post('/stripe', async (req, res) => {
    const result = await verifyWebhook({
        provider: 'stripe',
        secret: process.env.STRIPE_ENDPOINT_SECRET || 'whsec_test',
        headers: req.headers,
        rawBody: req.rawBody
    });
    return res.status(result.ok ? 200 : 401).json(result);
});
app.listen(3000, () => console.log('listening on :3000'));
