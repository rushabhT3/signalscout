import { expect, test } from "@playwright/test";

test("landing page shows the value proposition and routes to signup", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /turn public hiring data into qualified pipeline/i,
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Get started" }).first().click();
  await expect(page).toHaveURL(/\/signup$/);
  await expect(
    page.getByRole("heading", { name: /create your account/i }),
  ).toBeVisible();
});
