class InventoryPage {
  constructor(page) {
    this.page = page;
    this.inventoryItems = page.locator('.inventory_item');
    this.cartLink = page.locator('.shopping_cart_link');
    this.cartBadge = page.locator('.shopping_cart_badge');
  }

  // SauceDemo has no search input. Filter the product cards by their visible names.
  async addMatchingProducts(pattern) {
    const cards = this.inventoryItems;
    const count = await cards.count();
    const addedNames = [];

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const name = (await card.locator('.inventory_item_name').innerText()).trim();

      if (pattern.test(name)) {
        await card.locator('button').click();
        addedNames.push(name);
      }
    }

    return addedNames;
  }
}

module.exports = { InventoryPage };