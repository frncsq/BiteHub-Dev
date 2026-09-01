import { pool } from '../db.js';
import { AD_UPLOAD_PUBLIC_PATH } from '../config/ads.js';
import { deleteAdImageFile } from '../middleware/uploadAds.js';

/** SQL fragment: only ads that are active and within their schedule window. */
const ACTIVE_AD_WHERE = `
  status = 'active'
  AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
  AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)
`;

const mapAdRow = (row) => {
  let metadata = row.metadata || {};
  if (typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata);
    } catch {
      metadata = {};
    }
  }
  return {
    id: row.id,
    title: row.title,
    image: row.image,
    link: row.link,
    position: row.position,
    ad_type: row.ad_type,
    status: row.status,
    start_date: row.start_date,
    end_date: row.end_date,
    clicks: row.clicks,
    impressions: row.impressions,
    sort_order: row.sort_order,
    metadata,
    created_at: row.created_at,
  };
};

/** Deactivate ads whose end_date has passed (scheduled expiration). */
export const expireOutdatedAds = async () => {
  try {
    const result = await pool.query(
      `UPDATE ads SET status = 'inactive'
       WHERE status = 'active' AND end_date IS NOT NULL AND end_date < CURRENT_TIMESTAMP`
    );
    if (result.rowCount > 0) {
      console.log(`[ADS] Auto-expired ${result.rowCount} ad(s)`);
    }
  } catch (err) {
    console.warn('[ADS] Expiration check failed:', err.message);
  }
};

export const listAds = async (req, res) => {
  try {
    const { position, active, status } = req.query;
    const conditions = [];
    const params = [];

    if (position) {
      params.push(position);
      conditions.push(`position = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (active === 'true') {
      conditions.push(ACTIVE_AD_WHERE);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT * FROM ads ${where} ORDER BY sort_order ASC, created_at DESC`,
      params
    );
    res.json({ success: true, ads: result.rows.map(mapAdRow) });
  } catch (err) {
    console.error('[ADS] listAds:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch ads' });
  }
};

export const getActiveByPlacement = async (req, res) => {
  try {
    const { position } = req.params;
    await expireOutdatedAds();
    const result = await pool.query(
      `SELECT * FROM ads
       WHERE position = $1 AND ${ACTIVE_AD_WHERE}
       ORDER BY sort_order ASC, created_at DESC`,
      [position]
    );
    res.json({ success: true, ads: result.rows.map(mapAdRow) });
  } catch (err) {
    console.error('[ADS] getActiveByPlacement:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch active ads' });
  }
};

export const getAdById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ads WHERE id = $1', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }
    res.json({ success: true, ad: mapAdRow(result.rows[0]) });
  } catch (err) {
    console.error('[ADS] getAdById:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch ad' });
  }
};

export const createAd = async (req, res) => {
  try {
    const {
      title,
      link,
      position,
      status = 'active',
      start_date,
      end_date,
      ad_type = 'banner',
      sort_order = 0,
      metadata,
    } = req.body;

    if (!title || !position) {
      return res.status(400).json({ success: false, message: 'title and position are required' });
    }

    let image = req.body.image || null;
    if (req.file) {
      image = `${AD_UPLOAD_PUBLIC_PATH}/${req.file.filename}`;
    }

    const meta = metadata ? (typeof metadata === 'string' ? JSON.parse(metadata) : metadata) : {};

    const result = await pool.query(
      `INSERT INTO ads (title, image, link, position, ad_type, status, start_date, end_date, sort_order, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        title,
        image,
        link || null,
        position,
        ad_type,
        status,
        start_date || null,
        end_date || null,
        Number(sort_order) || 0,
        JSON.stringify(meta),
      ]
    );

    res.status(201).json({ success: true, ad: mapAdRow(result.rows[0]) });
  } catch (err) {
    console.error('[ADS] createAd:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to create ad' });
  }
};

export const updateAd = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM ads WHERE id = $1', [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }

    const prev = existing.rows[0];
    const {
      title = prev.title,
      link = prev.link,
      position = prev.position,
      status = prev.status,
      start_date = prev.start_date,
      end_date = prev.end_date,
      ad_type = prev.ad_type,
      sort_order = prev.sort_order,
      metadata,
    } = req.body;

    let image = prev.image;
    if (req.file) {
      deleteAdImageFile(prev.image);
      image = `${AD_UPLOAD_PUBLIC_PATH}/${req.file.filename}`;
    } else if (req.body.image !== undefined) {
      image = req.body.image;
    }

    const meta =
      metadata !== undefined
        ? typeof metadata === 'string'
          ? JSON.parse(metadata)
          : metadata
        : prev.metadata;

    const result = await pool.query(
      `UPDATE ads SET
         title = $1, image = $2, link = $3, position = $4, ad_type = $5,
         status = $6, start_date = $7, end_date = $8, sort_order = $9, metadata = $10
       WHERE id = $11 RETURNING *`,
      [
        title,
        image,
        link,
        position,
        ad_type,
        status,
        start_date || null,
        end_date || null,
        Number(sort_order) || 0,
        JSON.stringify(meta || {}),
        id,
      ]
    );

    res.json({ success: true, ad: mapAdRow(result.rows[0]) });
  } catch (err) {
    console.error('[ADS] updateAd:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to update ad' });
  }
};

export const deleteAd = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM ads WHERE id = $1', [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }

    deleteAdImageFile(existing.rows[0].image);
    await pool.query('DELETE FROM ads WHERE id = $1', [id]);
    res.json({ success: true, message: 'Ad deleted' });
  } catch (err) {
    console.error('[ADS] deleteAd:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete ad' });
  }
};

export const toggleAdStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be active or inactive' });
    }
    const result = await pool.query(
      'UPDATE ads SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }
    res.json({ success: true, ad: mapAdRow(result.rows[0]) });
  } catch (err) {
    console.error('[ADS] toggleAdStatus:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

export const trackClick = async (req, res) => {
  try {
    const adId = req.params.id;
    const adResult = await pool.query('SELECT * FROM ads WHERE id = $1', [adId]);
    if (!adResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }

    const ad = adResult.rows[0];
    const ip = req.ip || req.headers['x-forwarded-for'] || null;
    const userAgent = req.headers['user-agent'] || null;

    await pool.query(
      'INSERT INTO ad_clicks (ad_id, ip_address, user_agent) VALUES ($1, $2, $3)',
      [adId, ip, userAgent]
    );
    await pool.query('UPDATE ads SET clicks = clicks + 1 WHERE id = $1', [adId]);

    res.json({
      success: true,
      redirectUrl: ad.link || null,
      clicks: (ad.clicks || 0) + 1,
    });
  } catch (err) {
    console.error('[ADS] trackClick:', err.message);
    res.status(500).json({ success: false, message: 'Failed to track click' });
  }
};

export const trackImpression = async (req, res) => {
  try {
    const adId = req.params.id;
    const result = await pool.query(
      'UPDATE ads SET impressions = impressions + 1 WHERE id = $1 RETURNING impressions',
      [adId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }
    res.json({ success: true, impressions: result.rows[0].impressions });
  } catch (err) {
    console.error('[ADS] trackImpression:', err.message);
    res.status(500).json({ success: false, message: 'Failed to track impression' });
  }
};

export const getAnalytics = async (_req, res) => {
  try {
    await expireOutdatedAds();

    const [totals, topAds, recentClicks] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS total_ads,
          COUNT(*) FILTER (WHERE status = 'active' AND ${ACTIVE_AD_WHERE})::int AS active_ads,
          COUNT(*) FILTER (WHERE status = 'inactive')::int AS inactive_ads,
          COALESCE(SUM(clicks), 0)::int AS total_clicks,
          COALESCE(SUM(impressions), 0)::int AS total_impressions
        FROM ads
      `),
      pool.query(`
        SELECT id, title, position, clicks, impressions,
          CASE WHEN impressions > 0 THEN ROUND((clicks::numeric / impressions) * 100, 2) ELSE 0 END AS ctr
        FROM ads
        ORDER BY clicks DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT ac.id, ac.ad_id, ac.clicked_at, a.title
        FROM ad_clicks ac
        JOIN ads a ON a.id = ac.ad_id
        ORDER BY ac.clicked_at DESC
        LIMIT 20
      `),
    ]);

    const row = totals.rows[0];
    const totalImpressions = row.total_impressions || 0;
    const totalClicks = row.total_clicks || 0;
    const ctr =
      totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;

    res.json({
      success: true,
      analytics: {
        totalAds: row.total_ads,
        activeAds: row.active_ads,
        inactiveAds: row.inactive_ads,
        totalClicks,
        totalImpressions,
        clickThroughRate: ctr,
        topAds: topAds.rows,
        recentClicks: recentClicks.rows,
      },
    });
  } catch (err) {
    console.error('[ADS] getAnalytics:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};
