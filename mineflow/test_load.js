import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
        page.on('pageerror', error => console.error('BROWSER_ERROR:', error.message));

        console.log("Navigating to http://localhost:4173 ...");
        await page.goto('http://localhost:4173', { waitUntil: 'networkidle0', timeout: 30000 });

        console.log("Page loaded. Waiting a bit more to see if it's stuck on loading...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const html = await page.content();
        if (html.includes("LOADING MINEFLOW")) {
            console.log("Still stuck on loading screen.");
        } else {
            console.log("App has loaded.");
        }

        await browser.close();
    } catch (e) {
        console.error("Test failed:", e);
    }
})();
