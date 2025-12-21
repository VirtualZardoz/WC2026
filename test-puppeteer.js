const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/login');
    await page.screenshot({ path: 'login.png' });
    console.log('Screenshot taken');
    await browser.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
