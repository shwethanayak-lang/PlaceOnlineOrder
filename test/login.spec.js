const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');

test.describe('SauceDemo login', () => {
  test('TC01 - valid user can log in', async ({ page }) => {
    const login = new LoginPage(page);
    await login.open();
    await login.login('standard_user', 'secret_sauce');

    await expect(page).toHaveURL(/inventory.html/);
    await expect(page.getByText('Products', { exact: true })).toBeVisible();
  });

   
});