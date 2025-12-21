const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  const url = 'http://localhost:3000/login';
  
  try {
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    console.log('Entering invalid credentials...');
    await page.type('input[name="email"]', 'wrong@example.com');
    await page.type('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    console.log('Waiting for error message...');
    await page.waitForSelector('.text-red-500', { timeout: 5000 });
    const errorMessage = await page.$eval('.text-red-500', el => el.textContent);
    console.log(`Error message found: ${errorMessage}`);
    
    if (errorMessage && errorMessage.length > 0) {
      console.log('TEST PASSED: #004');
    } else {
      console.log('TEST FAILED: #004 - No error message');
    }
  } catch (e) {
    console.log(`TEST FAILED: #004 - ${e.message}`);
    await page.screenshot({ path: 'test_004_error.png' });
  } finally {
    await browser.close();
  }
})();
