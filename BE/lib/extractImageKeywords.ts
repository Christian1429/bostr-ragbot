
import { Request, Response } from 'express';
import { extractImageKeywords as getKeywords } from '../utils/utils.js';

export async function extractImageKeywordsHandler(req: Request, res: Response) {
  try {
    const { url } = req.body;
    console.log('Received /extract-image request');
    if (!url) {
      return res.status(400).json({ error: 'Image URL is required.' });
    }

    const keywords = await getKeywords(url);
    res.json({ keywords });
  } catch (error) {
    console.error('Error extracting image keywords:', error);
    res.status(500).json({ error: 'Failed to extract keywords from image.' });
  }
}
