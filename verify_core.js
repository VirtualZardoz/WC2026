const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to homepage...');
    await page.goto('http://localhost:3000');
    console.log('Current URL:', page.url());
    
    if (page.url().includes('/login')) {
        console.log('Redirected to login as expected for unauthenticated user.');
    } else {
        console.log('Page title:', await page.title());
    }

    await page.screenshot({ path: 'homepage.png' });
    console.log('Screenshot saved as homepage.png');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
