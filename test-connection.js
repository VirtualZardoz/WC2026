const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'homepage.png' });
    console.log('Screenshot taken');
    const title = await page.title();
    console.log('Title:', title);
    const content = await page.content();
    if (content.includes('Login') || content.includes('Predictions')) {
        console.log('Page content looks good');
    } else {
        console.log('Page content might be wrong');
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await browser.close();
  }
})();
