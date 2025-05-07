// BE/routes/urlRoutes.ts
import express from 'express';
import { hasUrlBeenScraped, recordScrapedUrl, getAllScrapedUrls } from '../lib/urlTracker.js';

const router = express.Router();

// Check if a URL has been scraped
router.get('/check-url', async (req, res) => {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    try {
        const scraped = await hasUrlBeenScraped(url);
        res.json({ url, scraped });
    } catch (error) {
        res.status(500).json({ error: (error instanceof Error) ? error.message : 'Unknown error' });
    }
});

// Get all scraped URLs
router.get('/scraped-urls', async (req, res) => {
    try {
        const urls = await getAllScrapedUrls();
        res.json({ count: urls.length, urls });
    } catch (error) {
        res.status(500).json({ error: (error instanceof Error) ? error.message : 'Unknown error' });
    }
});

export default router;