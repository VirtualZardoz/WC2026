const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:3000/login');
    
    await page.type('input[name="email"]', 'admin@example.com');
    await page.type('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation();
    console.log('Logged in, current URL:', page.url());
    
    // Navigate to admin matches
    await page.goto('http://localhost:3000/admin/matches');
    await page.waitForSelector('.btn-primary');
    
    // Click "Enter Result" on the first match
    const buttons = await page.$$('.btn-primary');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Enter Result')) {
        await btn.click();
        break;
      }
    }
    
    await page.waitForSelector('input[type="number"]');
    const inputs = await page.$$('input[type="number"]');
    await inputs[0].type('2');
    await inputs[1].type('1');
    
    // Click Save to trigger modal
    const saveButtons = await page.$$('.btn-primary');
    for (const btn of saveButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Save')) {
        await btn.click();
        break;
      }
    }
    
    await page.waitForTimeout(1000);
    console.log('Modal should be visible now');
    
    await page.screenshot({ path: 'confirm_modal.png' });
    console.log('Screenshot saved as confirm_modal.png');
    
    const modalText = await page.evaluate(() => document.body.innerText);
    const hasModal = modalText.includes('Confirm Result') && modalText.includes('Confirm') && modalText.includes('Cancel');
    console.log('Has confirmation modal:', hasModal);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
