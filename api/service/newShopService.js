import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const client = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
  } = req.body;

  const db = await client.transaction();

  try {
    await db.execute({
      sql: `
        INSERT INTO locations
        (street_address, street_address_second, city, state, country, postal_code, latitude, longitude, modified_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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

    await db.execute({
      sql: `
        INSERT INTO shops (name, description, created_by, modified_by, id_location)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [shopName, shop_description, userId, null, locationId],
    });

    const [[{ last_insert_rowid: shopId }]] = await db.execute({
      sql: `SELECT last_insert_rowid() AS last_insert_rowid;`,
    });

    await db.execute({
      sql: `INSERT INTO shop_locations (shop_id, location_id) VALUES (?, ?)`,
      args: [shopId, locationId],
    });

    for (const catId of selectedCategoryIds) {
      await db.execute({
        sql: `INSERT INTO shop_categories (shop_id, category_id) VALUES (?, ?)`,
        args: [shopId, catId],
      });
    }

    await db.commit();
    res.status(200).json({ shopId, locationId });
  } catch (err) {
    await db.rollback();
    console.error("DB transaction failed:", err);
    res.status(500).json({ error: "Failed to submit shop" });
  }
}
