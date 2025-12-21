const puppeteer = require('puppeteer');

async function test() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:3000/login');
    
    console.log('Logging in as admin...');
    await page.type('input[name="email"]', 'admin@example.com');
    await page.type('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation();
    console.log('Navigating to /admin/matches...');
    await page.goto('http://localhost:3000/admin/matches');
    
    await page.waitForSelector('button:contains("Bulk Entry")'); // Wait for button
    
    // We'll use page.evaluate to click the button based on text because I don't know the exact class
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const bulkBtn = buttons.find(b => b.textContent.includes('Bulk Entry'));
      if (bulkBtn) bulkBtn.click();
    });
    
    console.log('Bulk mode enabled');
    await page.waitForTimeout(1000);
    
    // Fill in some scores
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="number"]'));
      if (inputs.length >= 2) {
        inputs[0].value = '1';
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[1].value = '2';
        inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    
    console.log('Entered scores');
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(b => b.textContent.includes('Save All Results'));
      if (saveBtn) saveBtn.click();
    });
    
    console.log('Clicked Save All Results');
    await page.waitForTimeout(2000);
    
    console.log('Verifying results saved...');
    // After save, bulkMode should be false and results should be displayed
    const hasResults = await page.evaluate(() => {
      return document.body.textContent.includes('1 - 2');
    });
    
    if (hasResults) {
      console.log('Bulk entry verification PASSED');
    } else {
      console.log('Bulk entry verification FAILED');
      await page.screenshot({ path: 'bulk_fail.png' });
    }
    
  } catch (err) {
    console.error('Error during test:', err);
    await page.screenshot({ path: 'bulk_error.png' });
  } finally {
    await browser.close();
  }
}

// Helper for contains
// Actually waitForSelector doesn't support :contains natively in all versions without a plugin
// I'll use a better way in the script.

test();
