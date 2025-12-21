const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to /login');
    await page.goto('http://localhost:3000/login');
    
    console.log('Entering invalid credentials');
    await page.type('input[type="email"]', 'wrong@example.com');
    await page.type('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    console.log('Waiting for error message');
    await page.waitForNetworkIdle();
    
    const errorMessage = await page.evaluate(() => {
      const el = document.querySelector('.text-red-500, .bg-red-100');
      return el ? el.textContent : null;
    });
    
    console.log('Error message found:', errorMessage);
    
    if (errorMessage && errorMessage.length > 0) {
      console.log('TEST 075 PASSED');
    } else {
      console.log('TEST 075 FAILED: No error message found');
      await page.screenshot({ path: 'test_075_failed.png' });
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
})();
