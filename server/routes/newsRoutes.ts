/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import { newsRepository } from '../persistence/newsRepository';
import { NewsCategory, ContentType } from '../services/news/newsTypes';

export function getNewsRouter(): Router {
  const router = Router();

  /**
   * GET /api/news
   * Returns paginated and filtered curated news items
   */
  router.get('/', async (req: any, res: Response) => {
    try {
      const category = (req.query.category as NewsCategory) || 'all';
      const contentType = req.query.contentType as ContentType | undefined;
      const search = req.query.search as string | undefined;
      const savedOnly = req.query.savedOnly === 'true';
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const offset = parseInt(req.query.offset as string, 10) || 0;

      const userId = req.user?.id || req.authUser?.id || 'usr_ryan';

      const result = await newsRepository.getItems(
        {
          category,
          contentType,
          search,
          savedOnly,
          limit,
          offset
        },
        userId
      );

      res.json(result);
    } catch (err: any) {
      console.error('[News API] Error listing items:', err);
      res.status(500).json({ error: 'Failed to retrieve news items.' });
    }
  });

  /**
   * GET /api/news/worth-your-time
   * Returns the top featured and secondary recommended items
   */
  router.get('/worth-your-time', async (req: any, res: Response) => {
    try {
      const userId = req.user?.id || req.authUser?.id || 'usr_ryan';
      const result = await newsRepository.getWorthYourTime(userId);
      res.json(result);
    } catch (err: any) {
      console.error('[News API] Error fetching Worth Your Time:', err);
      res.status(500).json({ error: 'Failed to retrieve Worth Your Time highlights.' });
    }
  });

  /**
   * GET /api/news/sources
   * Returns list of news sources and their sync health
   */
  router.get('/sources', async (req: any, res: Response) => {
    try {
      const sources = await newsRepository.getSources();
      res.json({ sources });
    } catch (err: any) {
      console.error('[News API] Error fetching sources:', err);
      res.status(500).json({ error: 'Failed to retrieve news sources.' });
    }
  });

  /**
   * POST /api/news/sources/:id/toggle
   * Enable or disable a news source
   */
  router.post('/sources/:id/toggle', async (req: any, res: Response) => {
    try {
      const sourceId = req.params.id;
      const currentSources = await newsRepository.getSources();
      const existing = currentSources.find(s => s.id === sourceId);

      if (!existing) {
        return res.status(404).json({ error: 'News source not found.' });
      }

      const updated = await newsRepository.updateSource(sourceId, {
        isEnabled: !existing.isEnabled
      });

      res.json({ source: updated });
    } catch (err: any) {
      console.error('[News API] Error toggling source:', err);
      res.status(500).json({ error: 'Failed to toggle news source.' });
    }
  });

  /**
   * POST /api/news/sync
   * Manually triggers on-demand background sync
   */
  router.post('/sync', async (req: any, res: Response) => {
    try {
      const workspaceId = req.workspaceId || 'ws_wilmington';
      const result = await newsRepository.triggerSync(workspaceId);
      res.json({ success: true, addedCount: result.addedCount });
    } catch (err: any) {
      console.error('[News API] Error triggering sync:', err);
      res.status(500).json({ error: 'Failed to sync news sources.' });
    }
  });

  /**
   * POST /api/news/:id/action
   * Record user interaction (save, unsave, hide, open, ask_nora)
   */
  router.post('/:id/action', async (req: any, res: Response) => {
    try {
      const itemId = req.params.id;
      const { actionType } = req.body;
      const userId = req.user?.id || req.authUser?.id || 'usr_ryan';

      if (!['save', 'unsave', 'hide', 'open', 'ask_nora'].includes(actionType)) {
        return res.status(400).json({ error: 'Invalid action type.' });
      }

      await newsRepository.recordUserAction(userId, itemId, actionType);
      res.json({ success: true, itemId, actionType });
    } catch (err: any) {
      console.error('[News API] Error recording action:', err);
      res.status(500).json({ error: 'Failed to record user action.' });
    }
  });

  /**
   * POST /api/news/:id/ask-nora
   * Formats context envelope for Ask NORA query with honest attribution and suggested prompts
   */
  router.post('/:id/ask-nora', async (req: any, res: Response) => {
    try {
      const itemId = req.params.id;
      const item = await newsRepository.getItemById(itemId);

      if (!item) {
        return res.status(404).json({ error: 'News item not found.' });
      }

      // Record Ask NORA signal
      const userId = req.user?.id || req.authUser?.id || 'usr_ryan';
      await newsRepository.recordUserAction(userId, itemId, 'ask_nora');

      // Honest attribution determination
      let attributionLevel: 'full_article' | 'publisher_excerpt' | 'metadata_only' | 'video_overview' | 'podcast_overview' = 'publisher_excerpt';
      if (item.contentType === 'video') {
        attributionLevel = 'video_overview';
      } else if (item.contentType === 'podcast') {
        attributionLevel = 'podcast_overview';
      } else if (!item.sourceExcerpt || item.sourceExcerpt.length < 50) {
        attributionLevel = 'metadata_only';
      }

      const suggestedQuestions = [
        'Give me the 30-second version.',
        'Why should I care about this?',
        'What are the main takeaways?',
        item.category === 'brokerage' ? 'What does this mean for independent brokerages?' : 'What does this mean for our local market?',
        item.contentType === 'video' ? 'Summarize this video conversation.' : item.contentType === 'podcast' ? 'Summarize this podcast discussion.' : 'What are the three most important ideas here?',
        'What did they say about recruiting?',
        'What did they say about AI and technology?'
      ];

      res.json({
        newsItem: item,
        attributionLevel,
        attributionNote: attributionLevel === 'video_overview' 
          ? 'Based on publisher video description and verified panel notes. (No full speech transcript provided).'
          : attributionLevel === 'podcast_overview'
          ? 'Based on episode metadata and publisher show notes.'
          : attributionLevel === 'metadata_only'
          ? 'Based on headline, category, and public metadata.'
          : 'Based on publisher summary and canonical reporting excerpt.',
        suggestedQuestions
      });
    } catch (err: any) {
      console.error('[News API] Error building Ask NORA context:', err);
      res.status(500).json({ error: 'Failed to prepare Ask NORA context.' });
    }
  });

  return router;
}
