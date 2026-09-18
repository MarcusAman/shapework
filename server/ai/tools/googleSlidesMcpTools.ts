/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * googleSlidesMcpTools
 * Gemini tool definitions and execution handlers for Google Slides API (v1).
 */

import { GoogleSlidesService } from '../../services/googleSlidesService.js';

export const googleSlidesFunctionDeclarations = [
  {
    name: 'generate_luxury_listing_slides',
    description: 'Generate an 8-Slide Luxury Listing Presentation & CMA Deck in Google Slides with property architecture specs, comps, marketing campaign, and seller net proceeds statement.',
    parameters: {
      type: 'OBJECT',
      properties: {
        propertyAddress: {
          type: 'STRING',
          description: 'The property address (e.g., "304 Ocean Blvd, Wrightsville Beach, NC 28480").'
        },
        listPrice: {
          type: 'STRING',
          description: 'The target listing price (e.g. "$1,895,000").'
        },
        beds: {
          type: 'NUMBER',
          description: 'Number of bedrooms.'
        },
        baths: {
          type: 'NUMBER',
          description: 'Number of bathrooms.'
        },
        sqft: {
          type: 'NUMBER',
          description: 'Total heated square footage.'
        },
        agentName: {
          type: 'STRING',
          description: 'Presenter / listing broker name.'
        },
        agentTitle: {
          type: 'STRING',
          description: 'Presenter title (e.g., "Broker / Owner & Regional Leader (BIC)").'
        }
      },
      required: ['propertyAddress', 'listPrice', 'beds', 'baths', 'sqft']
    }
  },
  {
    name: 'get_listing_presentation_deck',
    description: 'Retrieve an existing Google Slides presentation deck and inspect its slide outlines.',
    parameters: {
      type: 'OBJECT',
      properties: {
        propertyAddress: {
          type: 'STRING',
          description: 'The property address or deck ID to look up.'
        }
      },
      required: ['propertyAddress']
    }
  }
];

export async function executeGoogleSlidesTool(toolName: string, args: any, workspaceId: string = 'nest-realty-demo'): Promise<any> {
  switch (toolName) {
    case 'generate_luxury_listing_slides':
      return await GoogleSlidesService.generateListingDeck({
        propertyAddress: args.propertyAddress,
        listPrice: args.listPrice,
        specs: {
          beds: args.beds || 4,
          baths: args.baths || 3.5,
          sqft: args.sqft || 3000
        },
        agentName: args.agentName,
        agentTitle: args.agentTitle,
        workspaceId
      });

    case 'get_listing_presentation_deck': {
      const decks = GoogleSlidesService.getPresentationDecks();
      const match = decks.find(d => d.propertyAddress.toLowerCase().includes(args.propertyAddress.toLowerCase()) || d.id === args.propertyAddress);
      return match || { message: `No deck found matching "${args.propertyAddress}"` };
    }

    default:
      throw new Error(`Unknown Google Slides tool: ${toolName}`);
  }
}
