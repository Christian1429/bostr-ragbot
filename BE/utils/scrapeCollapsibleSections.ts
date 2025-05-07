import * as cheerio from 'cheerio';

interface Doc {
    pageContent: string;
    metadata: Record<string, any>;
}


export function scrapeCollapsibleSections(html: string, sourceUrl: string): Doc[] {
    const $ = cheerio.load(html);
    const docs: Doc[] = [];
    const pageTitle = $('title').first().text().trim() || 'Okänd titel'; // För metadata

    // Hitta alla wrapper-divvar för de kollapsbara sektionerna
    $('div.sv-collapsible-content').each((index, element) => {
        const collapsibleWrapper = $(element);

        // Hitta H3-rubriken inuti wrappern
        // Antagande: Det finns bara en relevant H3 per wrapper
        const headerElement = collapsibleWrapper.find('h3').first(); // .first() om det skulle finnas fler

        // Hitta den *direkt efterföljande* div-elementet (som är syskon till H3)
        // Detta är viktigt för att få rätt innehålls-div
        const contentElement = headerElement.next('div');

        const question = headerElement.text().trim();
        // Hämta all text från innehålls-diven och rensa whitespace
        const answer = contentElement.text().trim().replace(/\s+/g, ' ');

        // Säkerställ att vi fick både en fråga och ett svar
        if (question && answer) {
            docs.push({
                // Skapa en tydlig textstruktur
                pageContent: `Rubrik: ${question}\n\nInnehåll:\n${answer}`,
                metadata: {
                    source: sourceUrl,
                    title: pageTitle,        // Sidans övergripande titel
                    section: question,       // Rubriken för just denna sektion
                    type: 'csn-collapsible-section', // Typ för att identifiera källan
                    scraped: new Date().toISOString()
                }
            });
        } else {
            // Logga om vi inte kunde extrahera som förväntat
            console.warn(`Kunde inte extrahera rubrik/innehåll från element ${index+1} på ${sourceUrl}. Rubrik: "${question}", Innehåll hittat: ${!!answer}`);
        }
    });

    return docs;
}
