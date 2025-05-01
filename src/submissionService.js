import { createClient } from "@libsql/client";

const tursoClient = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function submitNewShop(formData) {
  const {
    shopName,
    shop_description,
    userId,
    house_number,
    address_first,
    address_second,
    city,
    state,
    postcode,
    country,
    latitude,
    longitude,
    selectedCategoryIds = [],
  } = formData;

  const db = await tursoClient.transaction();
  try {
    // 1) Insert location
    await db.execute({
      sql: `
        INSERT INTO locations
          (street_address, street_address_second, city, state, country,
           postal_code, latitude, longitude, modified_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      args: [
        `${house_number} ${address_first}`,
        address_second,
        city,
        state,
        country,
        postcode,
        latitude,
        longitude,
        userId,
      ],
    });
    const [[{ last_insert_rowid: locationId }]] = await db.execute({
      sql: `SELECT last_insert_rowid() AS last_insert_rowid;`,
    });

    // 2) Insert shop
    await db.execute({
      sql: `
        INSERT INTO shops
          (name, description, created_by, modified_by, id_location)
        VALUES (?, ?, ?, ?, ?);
      `,
      args: [shopName, shop_description, userId, null, locationId],
    });
    const [[{ last_insert_rowid: shopId }]] = await db.execute({
      sql: `SELECT last_insert_rowid() AS last_insert_rowid;`,
    });

    // 3) Insert shop_location
    await db.execute({
      sql: `
        INSERT INTO shop_locations (shop_id, location_id)
        VALUES (?, ?);
      `,
      args: [shopId, locationId],
    });

    // 4) Adds categories
    for (const catId of selectedCategoryIds) {
      await db.execute({
        sql: `
          INSERT INTO shop_categories (shop_id, category_id)
          VALUES (?, ?);
        `,
        args: [shopId, catId],
      });
    }

    await db.commit();
    return { shopId, locationId };
  } catch (err) {
    await db.rollback();
    console.error("Transaction failed:", err);
    throw err;
  }
}
