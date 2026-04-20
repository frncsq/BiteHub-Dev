import { pool } from '../db.js';

export const rotateFlashSale = async () => {
    try {
        console.log("🎲 Rotating flash sale items (shared component)...");
        
        // 1. Clear previous flash sales
        await pool.query("DELETE FROM flash_sales");

        // 2. Pick 5-8 random menu items from verified & active restaurants
        const count = Math.floor(Math.random() * 4) + 5; // 5 to 8
        const itemsResult = await pool.query(`
            SELECT m.id 
            FROM menu_items m
            JOIN restaurants r ON m.restaurant_id = r.id
            WHERE r.approval_status = 'approved' AND r.is_active = TRUE AND m.is_available = TRUE
            ORDER BY RANDOM()
            LIMIT $1
        `, [count]);

        const itemIds = itemsResult.rows.map(r => r.id);
        
        if (itemIds.length > 0) {
            // 3. Insert into flash_sales
            for (const id of itemIds) {
                await pool.query(
                    "INSERT INTO flash_sales (menu_item_id, discount_percentage) VALUES ($1, 10)",
                    [id]
                );
            }
            console.log(`✅ Flash sale rotated: ${itemIds.length} items picked for today.`);
            return { success: true, count: itemIds.length };
        } else {
            console.warn("⚠️ No eligible items found for flash sale rotation.");
            return { success: false, message: "No eligible items found" };
        }
    } catch (err) {
        console.error("❌ Flash sale rotation failed:", err.message);
        throw err;
    }
};
