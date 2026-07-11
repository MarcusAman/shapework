/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export function blockDemoToolsInProduction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const APP_MODE = process.env.APP_MODE || 'development';
  
  if (APP_MODE === 'production') {
    const hasDevTools = req.membership?.permissions?.includes('access_developer_tools') || req.membership?.role === 'admin';
    
    if (!hasDevTools) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Demo, mock sandbox utilities, and route debug tools are blocked in production.' 
      });
    }
  }
  next();
}
