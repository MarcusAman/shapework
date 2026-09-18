/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Pool } from 'pg';
import { 
  evaluateEditorialDecision, 
  EventClusterReference 
} from '../server/services/news/noraEditorialCurator';
import { classifyDestinationAccuracy } from '../server/services/news/rssFeedParser';

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://marcusaman@127.0.0.1:5432/shapework_test_isolated'
  });

  console.log('=== STARTING FORENSIC NEWS DATABASE RECLASSIFICATION & AUDIT ===');

  const { rows } = await pool.query(`SELECT * FROM news_items ORDER BY published_at DESC`);
  console.log(`Loaded ${rows.length} records from news_items.`);

  const sourceCountMap = new Map<string, number>();
  const existingClusters: EventClusterReference[] = [];

  let exactMegaphoneRepaired = 0;
  let staleCount = 0;
  let resourceCount = 0;
  let promotionalCount = 0;
  let tooNicheCount = 0;
  let lowSignalCount = 0;
  let celebrityCount = 0;
  let duplicateCount = 0;
  let saturationCount = 0;
  let publishedCount = 0;

  for (const row of rows) {
    let canonicalUrl = row.canonical_url || row.source_url;
    let resolvedUrl = row.resolved_url || canonicalUrl;
    let sourceUrl = row.source_url;
    const podcastUrl = row.podcast_url;

    // 1. Megaphone podcast repair: extract exact episode player if canonical is collection page
    if (podcastUrl && podcastUrl.includes('traffic.megaphone.fm')) {
      const megaMatch = podcastUrl.match(/traffic\.megaphone\.fm\/([A-Za-z0-9_-]+)(?:\.mp3)?/i);
      if (megaMatch) {
        const exactPlayerUrl = `https://player.megaphone.fm/${megaMatch[1]}`;
        if (
          canonicalUrl.includes('/shows/realtrending') || 
          canonicalUrl.includes('/podcast') || 
          canonicalUrl.includes('/podcasts') ||
          canonicalUrl.endsWith('.com/') ||
          canonicalUrl.endsWith('.com')
        ) {
          canonicalUrl = exactPlayerUrl;
          resolvedUrl = exactPlayerUrl;
          sourceUrl = exactPlayerUrl;
          exactMegaphoneRepaired++;
        }
      }
    }

    // 2. Destination accuracy classification
    const destinationAccuracy = classifyDestinationAccuracy(canonicalUrl, row.content_type);

    // 3. Nora Editorial Decision Evaluation
    const evalResult = evaluateEditorialDecision({
      title: row.title,
      sourceName: row.source_name,
      sourceExcerpt: row.source_excerpt || '',
      canonicalUrl,
      sourceUrl,
      publishedAt: row.published_at ? new Date(row.published_at).toISOString() : new Date().toISOString(),
      contentType: row.content_type,
      category: row.category,
      geography: row.geography,
      destinationAccuracy
    }, {
      publishedBySourceCount: sourceCountMap,
      existingClusterTitles: existingClusters,
      maxDaysStale: 14
    });

    if (evalResult.decision === 'publish') {
      publishedCount++;
      const current = sourceCountMap.get(row.source_name) || 0;
      sourceCountMap.set(row.source_name, current + 1);
      if (evalResult.eventClusterId) {
        existingClusters.push({
          title: row.title,
          clusterId: evalResult.eventClusterId,
          sourceName: row.source_name
        });
      }
    } else {
      switch (evalResult.reason) {
        case 'stale': staleCount++; break;
        case 'resource_not_news': resourceCount++; break;
        case 'promotional': promotionalCount++; break;
        case 'too_niche': tooNicheCount++; break;
        case 'low_signal': lowSignalCount++; break;
        case 'celebrity_lifestyle': celebrityCount++; break;
        case 'duplicate_event': duplicateCount++; break;
        case 'source_saturation': saturationCount++; break;
      }
    }

    // Update DB row
    await pool.query(
      `UPDATE news_items 
       SET canonical_url = $1,
           resolved_url = $2,
           source_url = $3,
           destination_accuracy = $4,
           editorial_decision = $5,
           editorial_rejection_reason = $6,
           event_cluster_id = $7
       WHERE id = $8`,
      [
        canonicalUrl,
        resolvedUrl,
        sourceUrl,
        destinationAccuracy,
        evalResult.decision,
        evalResult.reason || null,
        evalResult.eventClusterId || null,
        row.id
      ]
    );
  }

  // Refresh editorial highlights for published items
  const pubRes = await pool.query(`SELECT * FROM news_items WHERE editorial_decision = 'publish' ORDER BY published_at DESC`);
  const publishedItems = pubRes.rows;

  // Reset highlights on all rows first
  await pool.query(`UPDATE news_items SET featured = false, secondary_recommendation = null`);

  // Assign exactly 1 featured and up to 2 secondary
  const eligibleItems = publishedItems.filter(i => 
    !i.hidden && 
    i.destination_accuracy === 'exact' && 
    i.url_status !== 'unavailable' && 
    i.url_status !== 'invalid'
  );

  let featuredAssigned = false;
  let watchAssigned = false;
  let localAssigned = false;

  for (const item of eligibleItems) {
    if (!featuredAssigned && (item.category === 'brokerage' || item.source_priority === 1)) {
      await pool.query(`UPDATE news_items SET featured = true WHERE id = $1`, [item.id]);
      featuredAssigned = true;
      continue;
    }

    if (!watchAssigned && (item.content_type === 'video' || item.content_type === 'podcast')) {
      await pool.query(`UPDATE news_items SET secondary_recommendation = 'worth_watching' WHERE id = $1`, [item.id]);
      watchAssigned = true;
      continue;
    }

    if (!localAssigned && (item.geography === 'local_wilmington' || item.geography === 'north_carolina' || item.category === 'local')) {
      await pool.query(`UPDATE news_items SET secondary_recommendation = 'close_to_home' WHERE id = $1`, [item.id]);
      localAssigned = true;
      continue;
    }
  }

  console.log('=== AUDIT RESULTS ===');
  console.log(`Total records audited: ${rows.length}`);
  console.log(`Megaphone show collection links repaired to exact player: ${exactMegaphoneRepaired}`);
  console.log(`Published high-signal items: ${publishedCount}`);
  console.log('Rejected breakdown:');
  console.log(`  - Stale (>14 days / legacy podcast back-catalog): ${staleCount}`);
  console.log(`  - Static resource / archive / toolkit: ${resourceCount}`);
  console.log(`  - Vendor PR / promotional: ${promotionalCount}`);
  console.log(`  - Hyper-niche technical plumbing / MISMO: ${tooNicheCount}`);
  console.log(`  - Low signal / fluff advice / trade election: ${lowSignalCount}`);
  console.log(`  - Celebrity gossip / sensationalism: ${celebrityCount}`);
  console.log(`  - Duplicate cross-publisher events: ${duplicateCount}`);
  console.log(`  - Source saturation capped: ${saturationCount}`);

  console.log('\n=== CURRENT PUBLISHED NEWS FEED (Top 20) ===');
  const finalFeed = await pool.query(
    `SELECT title, source_name, published_at, category, content_type, canonical_url, destination_accuracy, featured, secondary_recommendation
     FROM news_items 
     WHERE editorial_decision = 'publish' 
     ORDER BY featured DESC, secondary_recommendation IS NOT NULL DESC, published_at DESC 
     LIMIT 20`
  );
  console.table(finalFeed.rows);

  await pool.end();
}

main().catch(err => {
  console.error('Fatal reclassification error:', err);
  process.exit(1);
});
