import puppeteer, { Page, Browser } from 'puppeteer';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { hasUrlBeenScraped, recordScrapedUrl } from '../lib/urlTracker.js';

const makeAbsolute = (href: string, base: string): string | null => {
    try {

        if (/^(https?:\/\/|#)/i.test(href)) {

            if (href.startsWith('#')) {

                const baseUrlObject = new URL(base);
                baseUrlObject.hash = href;
                return baseUrlObject.href;
            }

            if (/^https?:\/\//i.test(href)) {
                return new URL(href).href;
            }
        }

        const absoluteUrl = new URL(href, base);
        if (absoluteUrl.protocol === 'http:' || absoluteUrl.protocol === 'https:') {
            return absoluteUrl.href;
        }
        return null;
    } catch (error) {

        return null;
    }
};


const extractTextFromHtml = (html: string): string => {
    const $ = cheerio.load(html);

    $('script, style, nav, header, footer, aside, form').remove();

    let mainContent = $('main').text() || $('article').text() || $('div[role="main"]').text();
    if (!mainContent) {
        mainContent = $('body').text();
    }

    const text = mainContent.replace(/\s+/g, ' ').trim();
    return text;
}

export async function crawlAndExtractTextWithPuppeteer(
    startUrl: string,
    maxPages = 15,
    crawlDelayMs = 300
): Promise<string> {
    const visited = new Set<string>();
    const queue: string[] = [startUrl];
    let combinedText = '';
    const baseUrlObject = new URL(startUrl);
    const baseHostname = baseUrlObject.hostname;

    let browser: Browser | null = null;

    console.log(`Starting Puppeteer crawl from: ${startUrl}, max pages: ${maxPages}`);

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page: Page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        page.setDefaultNavigationTimeout(60000);

        while (queue.length > 0 && visited.size < maxPages) {
            const currentUrl = queue.shift()!;
            const pageUrlToVisit = currentUrl.split('#')[0];

            if (visited.has(pageUrlToVisit)) continue;

            const alreadyScraped = await hasUrlBeenScraped(pageUrlToVisit);
            if (alreadyScraped) {
                console.log(`Skipping already scraped URL: ${pageUrlToVisit}`);
                visited.add(pageUrlToVisit);
                continue;
            }

            try {
                new URL(pageUrlToVisit);
            } catch (e) {
                console.warn(`Skipping invalid URL: ${pageUrlToVisit}`);
                continue;
            }

            visited.add(pageUrlToVisit);
            console.log(`Crawling (${visited.size}/${maxPages}): ${pageUrlToVisit}`);

            try {
                await page.goto(pageUrlToVisit, {
                    waitUntil: 'networkidle2',
                    timeout: 60000
                });

                const html = await page.content();
                const pageText = extractTextFromHtml(html);

                let success = false;
                if (pageText) {
                    combinedText += pageText + '\n\n';
                    success = true;
                }

                await recordScrapedUrl(pageUrlToVisit, success, pageText?.length);

                const links = await page.evaluate(() => {
                    const mainElement = document.querySelector('main') || document.body;
                    const anchors = Array.from(mainElement.querySelectorAll<HTMLAnchorElement>('a[href]'));
                    return anchors.map(anchor => anchor.href);
                });

                for (const href of links) {
                    if (!href) continue;

                    const absoluteUrl = makeAbsolute(href, pageUrlToVisit);

                    if (absoluteUrl) {
                        const nextUrlObject = new URL(absoluteUrl);
                        const nextUrlClean = absoluteUrl.split('#')[0];

                        const alreadyScrapedLink = await hasUrlBeenScraped(nextUrlClean);

                        const isSameDomain = nextUrlObject.hostname === baseHostname;
                        const isHttp = nextUrlObject.protocol === 'http:' || nextUrlObject.protocol === 'https:';

                        const isLikelyFile = /\.(pdf|docx?|xlsx?|pptx?|zip|rar|jpe?g|png|gif|svg|webp|mp3|mp4|avi|mov)$/i.test(nextUrlObject.pathname);
                        const isNotVisited = !visited.has(nextUrlClean);
                        const isNotInQueue = !queue.includes(nextUrlClean);
                        const isNotScraped = !alreadyScrapedLink;

                        if (isSameDomain && isHttp && !isLikelyFile && isNotVisited && isNotInQueue && isNotScraped && (visited.size + queue.length) < maxPages) {
                            queue.push(nextUrlClean);

                        }
                    }
                }

            } catch (error: any) {
                console.error(`Error crawling ${pageUrlToVisit}: ${error.message}`);

                await recordScrapedUrl(pageUrlToVisit, false);

                if (error.name === 'TimeoutError') {
                    console.warn(`Timeout navigating to ${pageUrlToVisit}`);
                }
            }

            if (queue.length > 0 && visited.size < maxPages) {
                await new Promise(resolve => setTimeout(resolve, crawlDelayMs));
            }
        }
    } catch (error) {
        console.error("Serious error during Puppeteer crawling setup or execution:", error);
    } finally {
        if (browser) {
            console.log("Closing Puppeteer browser...");
            await browser.close();
        }
    }

    console.log(`Puppeteer crawl finished. Total extracted text length: ${combinedText.length}. Visited ${visited.size} pages.`);
    return combinedText;
}