const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { InventoryPage } = require('../pages/InventoryPage');

const parseCurrency = (value) => {
  if (value === null || value === undefined) return 0;

  const cleanedValue = String(value).replace(/[$,\s]/g, '');
  const numericValue = cleanedValue.match(/-?\d+(?:\.\d+)?/)?.[0] ?? '0';

  return Number.parseFloat(numericValue);
};

test('TC05 - select a bag and all T-shirts, checkout, and place order', async ({ page }) => {
  const login = new LoginPage(page);
  await login.open();
  await login.login('standard_user', 'secret_sauce');
  await expect(page).toHaveURL(/inventory.html/);

  const inventory = new InventoryPage(page);

  // "Bag" is represented by Sauce Labs Backpack. Select every T-shirt product.
  const selectedProducts = await inventory.addMatchingProducts(/backpack|t-shirt/i);
  expect(selectedProducts.some(name => /backpack/i.test(name))).toBeTruthy();
  expect(selectedProducts.filter(name => /t-shirt/i.test(name)).length).toBeGreaterThan(0);

  await expect(page.locator('.shopping_cart_badge')).toContainText(String(selectedProducts.length));
  await inventory.cartLink.click();
  await expect(page).toHaveURL(/cart.html/);

  for (const productName of selectedProducts) {
    await expect(page.locator('.cart_item').filter({ hasText: productName })).toBeVisible();
  }
  await expect(page.locator('.cart_item')).toHaveCount(selectedProducts.length);

  await page.locator('[data-test="checkout"]').click();
  await expect(page).toHaveURL(/checkout-step-one.html/);

  await page.locator('[data-test="firstName"]').fill('Test');
  await page.locator('[data-test="lastName"]').fill('Customer');
  await page.locator('[data-test="postalCode"]').fill('560001');
  await page.locator('[data-test="continue"]').click();

  await expect(page).toHaveURL(/checkout-step-two.html/);
  await expect(page.getByText('Payment Information')).toBeVisible();
  await expect(page.getByText('Shipping Information')).toBeVisible();

  // Verify subtotal equals the sum of the prices of selected cart items.
  const priceLabels = await page.locator('.cart_item .inventory_item_price').allTextContents();
  const expectedSubtotal = Number(priceLabels.reduce((sum, label) => sum + parseCurrency(label), 0).toFixed(2));
  const displayedSubtotal = parseCurrency(await page.locator('.summary_subtotal_label').innerText());
  expect(displayedSubtotal).toBeCloseTo(expectedSubtotal, 2);

  await expect(page.locator('.summary_tax_label')).toBeVisible();
  await expect(page.locator('.summary_total_label')).toBeVisible();

  await page.locator('[data-test="finish"]').click();
  await expect(page).toHaveURL(/checkout-complete.html/);
  await expect(page.getByRole('heading', { name: 'Thank you for your order!' })).toBeVisible();
  await expect(page.getByText(/your order has been dispatched/i)).toBeVisible();
});

test('TC06 - checkout requires customer information', async ({ page }) => {
  const login = new LoginPage(page);
  await login.open();
  await login.login('standard_user', 'secret_sauce');

  await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
  await page.locator('.shopping_cart_link').click();
  await page.locator('[data-test="checkout"]').click();
  await page.locator('[data-test="continue"]').click();

  await expect(page.locator('[data-test="error"]')).toBeVisible();
  await expect(page.locator('[data-test="error"]')).toContainText(/first name is required/i);
});

test('TC07 - user can remove a product from the cart', async ({ page }) => {
  const login = new LoginPage(page);
  await login.open();
  await login.login('standard_user', 'secret_sauce');

  await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
  await page.locator('.shopping_cart_link').click();
  await expect(page.locator('.cart_item')).toHaveCount(1);

  await page.locator('[data-test="remove-sauce-labs-backpack"]').click();
  await expect(page.locator('.cart_item')).toHaveCount(0);
  await expect(page.locator('.shopping_cart_badge')).toHaveCount(0);
});