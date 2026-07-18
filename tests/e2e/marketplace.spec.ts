import { test, expect, type Page } from "@playwright/test";

async function signIn(page: Page, email: string, password = "password123") {
  await page.goto("/auth/signin");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 15_000 });
}

test.describe("public discovery", () => {
  test("home page renders hero and featured content", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Hidden Gems");
    await expect(page.getByRole("heading", { name: "Browse by Category" })).toBeVisible();
  });

  test("browse page lists businesses and filters by category", async ({ page }) => {
    await page.goto("/businesses");
    await expect(page.getByText("The Golden Spoon Bistro").first()).toBeVisible();

    await page.goto("/businesses?category=fitness");
    await expect(page.getByText("FitLife Gym & Training").first()).toBeVisible();
    await expect(page.getByText("The Golden Spoon Bistro")).toHaveCount(0);
  });

  test("search finds businesses by keyword", async ({ page }) => {
    await page.goto("/businesses?q=bike");
    await expect(page.getByText("Pedal & Spoke Bike Shop").first()).toBeVisible();
  });

  test("business profile shows the key evaluation info", async ({ page }) => {
    await page.goto("/businesses/the-golden-spoon-bistro");
    await expect(page.getByRole("heading", { name: "The Golden Spoon Bistro", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Business Hours" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Customer Reviews" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Contact Information" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Send a Message" })).toBeVisible();
  });

  test("footer legal pages exist", async ({ page }) => {
    for (const [path, heading] of [
      ["/privacy", "Privacy Policy"],
      ["/terms", "Terms of Service"],
      ["/about", "About LocalSpot"],
      ["/contact", "Contact Us"],
      ["/how-it-works", "How LocalSpot Works"],
    ] as const) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
    }
  });
});

test.describe("auth flows", () => {
  test("dashboard redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/auth\/signin/);
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("owner can sign in and see their dashboard", async ({ page }) => {
    await signIn(page, "owner@demo.com");
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Business Dashboard" })).toBeVisible();
    await expect(page.getByText("The Golden Spoon Bistro").first()).toBeVisible();
    await expect(page.getByText("Customer Inquiries").first()).toBeVisible();
  });
});

test.describe("inquiry lead flow (customer → owner)", () => {
  const inquiryEmail = `e2e-${Date.now()}@example.com`;
  const inquiryMessage = `E2E test inquiry sent at ${Date.now()} — table for two?`;

  test("customer submits an inquiry from the profile page", async ({ page }) => {
    await page.goto("/businesses/the-golden-spoon-bistro");
    await page.getByPlaceholder("Your name *").fill("E2E Customer");
    await page.getByPlaceholder("Your email *").fill(inquiryEmail);
    await page.getByPlaceholder("Your message *").fill(inquiryMessage);
    await page.getByRole("button", { name: "Send Message" }).click();
    await expect(page.getByText(/Message sent to The Golden Spoon Bistro/)).toBeVisible();
  });

  test("owner sees the new lead in the dashboard and can mark it replied", async ({ page }) => {
    await signIn(page, "owner@demo.com");
    await page.goto("/dashboard");

    const lead = page.getByRole("button", { name: /E2E Customer/ }).first();
    await expect(lead).toBeVisible();
    await lead.click();

    await expect(page.getByText(inquiryMessage)).toBeVisible();
    await page.getByRole("button", { name: "Mark Replied" }).first().click();

    // The lead should now appear under the "Replied" filter
    await page.getByRole("button", { name: "Replied", exact: true }).first().click();
    await expect(page.getByRole("button", { name: /E2E Customer/ }).first()).toBeVisible();
  });
});

test.describe("owner restrictions in the browser", () => {
  test("owner sees no review form on their own listing", async ({ page }) => {
    await signIn(page, "owner@demo.com");
    await page.goto("/businesses/the-golden-spoon-bistro");
    await expect(page.getByText("owners can't review their own listing")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit Review" })).not.toBeVisible();
  });
});
