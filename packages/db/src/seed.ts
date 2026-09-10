import { createDb } from "./client";
import { restaurant, branch, menu, menuItem, priceObservation } from "./schema";

/**
 * Minimal, realistic sample dataset for local development: two venues in
 * Business Bay both serving "chicken shawarma" at different prices (so the
 * price-comparison view has something to compare) and one "Shish Taouk
 * Wrap" item. Not idempotent — intended for a fresh local DB, matching
 * `make bootstrap`'s flow.
 *
 * Deliberately does NOT create dish_mapping rows: those come from the real
 * canonicalisation matching service (services/data-workers/tasks/
 * canonicalisation.py) now that it exists — see README for the
 * `canonicalise-seed-data.py` follow-up step. Faking plausible-looking
 * confidence numbers here would be less honest than actually running the
 * algorithm against this data.
 */
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  const db = createDb(connectionString);

  console.log("Seeding...");

  const [alReef] = await db
    .insert(restaurant)
    .values({ legalName: "Al Reef Grill LLC", brandName: "Al Reef Grill", cuisineTags: ["lebanese", "grill"] })
    .returning();
  const [cornerKitchen] = await db
    .insert(restaurant)
    .values({ legalName: "Corner Kitchen FZE", brandName: "Corner Kitchen", cuisineTags: ["levantine"] })
    .returning();

  const [alReefBranch] = await db
    .insert(branch)
    .values({
      restaurantId: alReef!.id,
      geoPoint: "POINT(55.2708 25.1857)",
      address: "Marasi Drive, Business Bay, Dubai",
      community: "Business Bay",
      status: "active",
    })
    .returning();
  const [cornerBranch] = await db
    .insert(branch)
    .values({
      restaurantId: cornerKitchen!.id,
      geoPoint: "POINT(55.2650 25.1890)",
      address: "Bay Square, Business Bay, Dubai",
      community: "Business Bay",
      status: "active",
    })
    .returning();

  const [alReefMenu] = await db
    .insert(menu)
    .values({ branchId: alReefBranch!.id, channel: "dine_in", sourceArtefactId: "seed:al-reef-menu-1" })
    .returning();
  const [cornerMenu] = await db
    .insert(menu)
    .values({ branchId: cornerBranch!.id, channel: "dine_in", sourceArtefactId: "seed:corner-menu-1" })
    .returning();

  const [alReefShawarma] = await db
    .insert(menuItem)
    .values({
      menuId: alReefMenu!.id,
      name: "Chicken Shawarma Sandwich",
      description: "Marinated chicken, garlic sauce, pickles, saj bread",
      basePrice: "14.00",
      currency: "AED",
      section: "Grills",
      dietaryFlags: ["halal"],
      allergenFlags: ["gluten", "milk"],
      confidence: 0.94, // extraction confidence (Appendix B) - not canonicalisation confidence
    })
    .returning();
  const [cornerShawarma] = await db
    .insert(menuItem)
    .values({
      menuId: cornerMenu!.id,
      name: "Shawarma Djaj",
      description: "Chicken shawarma, toum, saj",
      basePrice: "11.50",
      currency: "AED",
      section: "Sandwiches",
      dietaryFlags: ["halal"],
      allergenFlags: ["gluten"],
      confidence: 0.88,
    })
    .returning();
  const [cornerTaouk] = await db
    .insert(menuItem)
    .values({
      menuId: cornerMenu!.id,
      name: "Shish Taouk Wrap",
      description: "Grilled chicken taouk, garlic sauce",
      basePrice: "13.00",
      currency: "AED",
      section: "Sandwiches",
      dietaryFlags: ["halal"],
      allergenFlags: ["gluten", "milk"],
      confidence: 0.9,
    })
    .returning();

  await db.insert(priceObservation).values([
    { menuItemId: alReefShawarma!.id, channel: "dine_in", price: "14.00", source: "extraction", verifiedBy: "system" },
    { menuItemId: cornerShawarma!.id, channel: "dine_in", price: "11.50", source: "extraction", verifiedBy: "system" },
    { menuItemId: cornerTaouk!.id, channel: "dine_in", price: "13.00", source: "extraction", verifiedBy: "system" },
  ]);

  console.log("Seed complete (no dish_mapping rows yet).");
  console.log(`  venue (for GET /v1/venues/:id): ${alReefBranch!.id}`);
  console.log("  Run services/data-workers/scripts/canonicalise_all.py to map these menu items to canonical dishes.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
