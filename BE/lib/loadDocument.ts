import { Request, Response } from 'express';
import multer from 'multer';
import { extractTextFromPDF, ExtractTextFromJson } from '../utils/utils.js'; 
import { crawlAndExtractTextWithPuppeteer } from '../utils/crawler.js'; 
import { addToVectorStore } from './vectorStore.js';
import { LoadDocumentsRequestBody } from './interfaces.js';
import { hasUrlBeenScraped, recordScrapedUrl } from './urlTracker.js'

const storage = multer.memoryStorage();

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, 
    },
    fileFilter: (
        req: Request,
        file: Express.Multer.File,
        cb: multer.FileFilterCallback
    ) => {
        if (file.mimetype === 'application/pdf' || file.mimetype === 'application/json' || file.mimetype === 'text/json' || file.originalname.endsWith('.json')) {
            cb(null, true);
        } else {
            // Fixa felhanteringen här
            cb(new Error('Endast PDF- och JSON-filer är tillåtna!'));
        }
    },
});

export const loadDocuments = async (req: Request, res: Response): Promise<void> => {
    
    try {
        let documentContent: string | undefined = undefined;
        const body = req.body as LoadDocumentsRequestBody;
        const sourceType = body.type;

        console.log(`Received load request. Type: ${sourceType}`); 

        if (sourceType === 'pdf' && req.file) {
            console.log(`Processing PDF file: ${req.file.originalname}`);
            documentContent = await extractTextFromPDF(req.file.buffer);
        } else if (sourceType === 'json' && req.file) {
            console.log(`Processing JSON file: ${req.file.originalname}`);
            const jsonData = JSON.parse(req.file.buffer.toString());
            documentContent = ExtractTextFromJson( 
                Array.isArray(jsonData) ? jsonData : [jsonData],
            );
        } else if (sourceType === 'url') {
            if (!body.url) {
                res.status(400).json({ error: 'URL krävs för typ "url"' });
                return; // Avsluta funktionen här
            }
            
            console.log(`Processing URL (Puppeteer): ${body.url}`);
            
            // Kontrollera om URL:en redan har skrapats
            const normalizedUrl = body.url.split('#')[0];
            const alreadyScraped = await hasUrlBeenScraped(normalizedUrl);
            
            if (alreadyScraped) {
                console.log(`URL har redan skrapats tidigare: ${normalizedUrl}`);
                res.json({
                    message: 'URL har redan skrapats tidigare och finns i databasen.',
                    source: normalizedUrl,
                    tag: body.tag || 'none',
                    alreadyProcessed: true
                });
                return;
            }
            
            // *** ANVÄND DEN NYA PUPPETEER-CRAWLERN ***
            // Hämta maxPages från request body om det finns, annars använd default (t.ex. 5)
            const maxPagesToCrawl = body.maxPages || 5; // Gör detta konfigurerbart
            
            try {
                documentContent = await crawlAndExtractTextWithPuppeteer(body.url, maxPagesToCrawl);
                
                if (!documentContent || documentContent.trim().length === 0) {
                    console.warn(`Puppeteer crawl for ${body.url} resulted in empty content.`);
                    // Registrera som misslyckad skrapning
                    await recordScrapedUrl(normalizedUrl, false);
                    res.status(404).json({ error: `Ingen text kunde extraheras från URL: ${body.url} och dess länkar.` });
                    return;
                }
                
                // Registrera som framgångsrik skrapning
                await recordScrapedUrl(normalizedUrl, true, documentContent.length);
                console.log(`Puppeteer crawl for ${body.url} finished. Content length: ${documentContent.length}`);
            } catch (crawlError) {
                console.error(`Error during Puppeteer crawl for ${body.url}:`, crawlError);
                // Registrera som misslyckad skrapning
                await recordScrapedUrl(normalizedUrl, false);
                res.status(500).json({ error: `Kunde inte crawla URL: ${(crawlError as Error).message}` });
                return;
            }

        } else if (sourceType === 'text') { // Antag att det är 'text' om inget annat matchar
            if (!body.content) {
                res.status(400).json({ error: 'Innehåll krävs för typ "text"' });
                return; // Avsluta funktionen här
            }
            console.log(`Processing direct text input.`);
            documentContent = body.content;
        } else {
            // Om sourceType inte är någon av de kända, skicka fel
            res.status(400).json({ error: `Okänd källtyp: ${sourceType}` });
            return;
        }

        // Kontrollera om documentContent faktiskt fick ett värde
        if (documentContent === undefined || documentContent === null) {
            console.error("Document content is undefined after processing input.");
            res.status(500).json({ error: 'Internt serverfel: kunde inte bearbeta indata.' });
            return;
        }
        
        // Lägg bara till i vector store om vi har innehåll
        if (documentContent.trim().length > 0) {
            console.log(`Adding content to vector store. SourceType: ${sourceType}, Tag: ${body.tag || 'none'}`);
            await addToVectorStore(
                documentContent,
                sourceType,
                sourceType === 'url' ? body.url || '' : req.file?.originalname || 'text-input', // Använd filnamn för pdf/json om tillgängligt
                body.tag
            );
            console.log("Content added to vector store successfully.");
        } else {
            console.log("Skipping adding to vector store because content is empty.");
            // Skicka ett annat meddelande om inget lades till?
            res.json({
                message: 'Ingen text extraherades eller tillhandahölls, inget lades till i vektordabasen.',
                source: sourceType === 'url' ? body.url : (req.file?.originalname || 'text-input'),
            });
            return;
        }

        res.json({
            message: 'Dokumentet/URL:en har laddats och bearbetats.',
            source: sourceType === 'url' ? body.url : (req.file?.originalname || 'text-input'),
            tag: body.tag || 'none'
        });

    } catch (error) {
        console.error('Error in /api/load-documents:', error);
        // Skicka ett mer informativt felmeddelande om möjligt
        const errorMessage = (error instanceof Error) ? error.message : 'Ett okänt fel inträffade';
        res.status(500).json({ error: errorMessage });
        // Inget behov av reject här, vi hanterar felet genom att skicka respons
    }
};