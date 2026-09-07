/**
 * Nora Video Studio & In-App Teleprompter Service
 * High-converting real estate video script generator, B-Roll shot list engine,
 * interactive teleprompter metadata, and brokerage video SOP library.
 */

export interface VideoScriptSegment {
  timeCode: string; // e.g. "0:00 - 0:05"
  narration: string;
  onScreenText: string;
  cameraDirection: string; // e.g. "Wide drone pan over Intracoastal Waterway to front exterior"
  bRollPrompt: string;
}

export interface GeneratedVideoScript {
  id: string;
  title: string;
  propertyAddress: string;
  format: 'tiktok_reels_30s' | 'instagram_walkthrough_60s' | 'youtube_luxury_2min';
  formatLabel: string;
  estimatedDurationSeconds: number;
  wordCount: number;
  recommendedWpm: number;
  suggestedMusicVibe: string;
  hookVariant: string;
  callToAction: string;
  segments: VideoScriptSegment[];
  teleprompterText: string;
  createdAt: string;
}

export interface VideoSopTutorial {
  id: string;
  title: string;
  category: 'Maxa Design Studio' | 'Dotloop Contracts' | 'MLS Comps' | 'BIC Compliance';
  durationMinutes: string;
  videoUrl: string;
  thumbnailUrl: string;
  description: string;
  instructor: string;
}

export class NoraVideoStudioService {
  /**
   * Generates tailored real estate video scripts with B-roll shot lists
   */
  static generateVideoScript(params: {
    propertyAddress: string;
    format: 'tiktok_reels_30s' | 'instagram_walkthrough_60s' | 'youtube_luxury_2min';
    agentName?: string;
    price?: string;
    keyFeatures?: string[];
    tone?: 'energetic_viral' | 'luxurious_cinematic' | 'warm_informative';
  }): GeneratedVideoScript {
    const address = params.propertyAddress || '312 Mayfaire Way, Wilmington NC';
    const price = params.price || '$720,000';
    const agent = params.agentName || 'Ryan Crecelius';
    const features = params.keyFeatures && params.keyFeatures.length > 0 
      ? params.keyFeatures 
      : ['Chef gourmet kitchen with quartz waterfall island', 'Resort-style salt water pool & covered lanai', 'Primary suite with spa wet room'];

    let segments: VideoScriptSegment[] = [];
    let formatLabel = '30s TikTok / Instagram Reel (Viral Hook)';
    let durationSeconds = 30;
    let musicVibe = 'Upbeat Modern Lo-Fi House / High Energy Pop Beat';

    if (params.format === 'tiktok_reels_30s') {
      formatLabel = '30s TikTok / Instagram Reel (Viral Hook)';
      durationSeconds = 30;
      musicVibe = 'Trending TikTok Synth Pop / Upbeat Luxury Beat';
      segments = [
        {
          timeCode: '0:00 - 0:05',
          narration: `Is this the most beautiful home currently listed under $800k in Wilmington? Let's step inside ${address}!`,
          onScreenText: `📍 ${address} • ${price}`,
          cameraDirection: 'Fast-paced hook: Push-in from front porch directly through mahogany double doors.',
          bRollPrompt: 'Cinematic wide push-in towards front entrance at golden hour.'
        },
        {
          timeCode: '0:05 - 0:18',
          narration: `Look at this open-concept layout. You get ${features[0]}, 10-foot ceilings, and seamless indoor-outdoor living opening to ${features[1]}.`,
          onScreenText: `✨ ${features[0]}`,
          cameraDirection: 'Smooth gimbal pan across kitchen island transitioning to sliding glass pocket doors.',
          bRollPrompt: 'Close-up slow motion of waterfall quartz island and custom pendant lighting.'
        },
        {
          timeCode: '0:18 - 0:25',
          narration: `The primary suite features ${features[2]}, making everyday feel like a five-star vacation.`,
          onScreenText: `🛁 Spa Retreat`,
          cameraDirection: 'Low-angle tracking shot entering the primary bathroom soaking tub and wet room.',
          bRollPrompt: 'Warm lighting shot of freestanding tub and frameless glass shower.'
        },
        {
          timeCode: '0:25 - 0:30',
          narration: `Offered at ${price} with Nest Realty. Comment "TOUR" or DM ${agent} to see this in person before it goes under contract!`,
          onScreenText: `💬 Comment TOUR for VIP Access • Nest Realty`,
          cameraDirection: 'Agent smiling to camera on back lanai holding keys or phone.',
          bRollPrompt: 'Drone pull-away over the backyard showing neighborhood context.'
        }
      ];
    } else if (params.format === 'instagram_walkthrough_60s') {
      formatLabel = '60s Room-by-Room Walkthrough (Architectural Tour)';
      durationSeconds = 60;
      musicVibe = 'Smooth Nu-Disco / Chill Deep House';
      segments = [
        {
          timeCode: '0:00 - 0:10',
          narration: `Welcome home to ${address}. Today we are touring this masterfully designed residence offered at ${price}.`,
          onScreenText: `✨ Exclusive Walkthrough • ${price}`,
          cameraDirection: 'Exterior drone establishing shot gliding down to agent standing at foyer.',
          bRollPrompt: 'Lush landscaping and exterior architectural symmetry.'
        },
        {
          timeCode: '0:10 - 0:25',
          narration: `From the moment you walk in, the natural light and wide-plank European oak floors set the stage. The heart of the home is this expansive kitchen with ${features[0]}.`,
          onScreenText: `🍽️ Chef's Kitchen`,
          cameraDirection: 'Slow steady pan across dining area into chef kitchen.',
          bRollPrompt: 'B-roll of gas range, hidden pantry, and designer backsplash.'
        },
        {
          timeCode: '0:25 - 0:42',
          narration: `Step outside into pure coastal relaxation: ${features[1]}, perfect for entertaining friends all summer long.`,
          onScreenText: `🌴 Outdoor Oasis`,
          cameraDirection: 'Tracking shot through patio doors to pool deck and firepit lounge.',
          bRollPrompt: 'Sunlight shimmering on pool water with outdoor kitchen in background.'
        },
        {
          timeCode: '0:42 - 0:52',
          narration: `Retire upstairs to your private sanctuary with ${features[2]}, offering unmatched tranquility.`,
          onScreenText: `🛏️ Primary Suite Sanctuary`,
          cameraDirection: 'Pivoting glide into primary bedroom with custom tray ceiling.',
          bRollPrompt: 'Detailed view of custom walk-in closet and dual vanity bathroom.'
        },
        {
          timeCode: '0:52 - 1:00',
          narration: `To schedule your private VIP showing, reach out to ${agent} at Nest Realty or visit nestrealty.com today.`,
          onScreenText: `📞 Contact ${agent} • Nest Realty`,
          cameraDirection: 'High-angle sunset shot over the roofline with Nest Realty logo badge.',
          bRollPrompt: 'Sunset reflections across coastal Wilmington skyline.'
        }
      ];
    } else {
      formatLabel = '2-Minute Cinematic Luxury Home Tour (YouTube 4K)';
      durationSeconds = 120;
      musicVibe = 'Cinematic Ambient Strings & Acoustic Piano';
      segments = [
        {
          timeCode: '0:00 - 0:20',
          narration: `Nestled in one of Wilmington's most prestigious coastal corridors, ${address} represents the pinnacle of modern luxury and effortless entertaining.`,
          onScreenText: `🏛️ Architectural Masterpiece • ${address}`,
          cameraDirection: 'Cinematic 4K drone orbit highlighting proximity to water and mature live oaks.',
          bRollPrompt: 'Sweeping aerial views of coastal waterways and grand neighborhood entrance.'
        },
        {
          timeCode: '0:20 - 0:50',
          narration: `Every square foot of this custom estate was curated with intention. The grand foyer leads into an expansive great room with soaring ceiling heights and custom millwork, flowing into a chef's culinary kitchen boasting ${features[0]}.`,
          onScreenText: `✨ Architectural Excellence & Custom Millwork`,
          cameraDirection: 'Dolly slider tracking across open living room fireplace to kitchen.',
          bRollPrompt: 'Close-ups of custom cabinetry, subzero refrigeration, and brass hardware.'
        },
        {
          timeCode: '0:50 - 1:25',
          narration: `Designed for seamless year-round indoor-outdoor living, pocketing glass doors open to ${features[1]}. Whether hosting intimate dinner parties or weekend pool gatherings, this is coastal Carolina living at its finest.`,
          onScreenText: `🏊 Resort Living in your Backyard`,
          cameraDirection: 'Slow crane shot rising above pool patio looking back at illuminated home.',
          bRollPrompt: 'Water fountains flowing into pool with integrated spa lighting.'
        },
        {
          timeCode: '1:25 - 1:50',
          narration: `The primary wing offers complete privacy, complemented by ${features[2]}. Additional guest suites and flexible bonus living spaces ensure ample room for family and executive work-from-home lifestyles.`,
          onScreenText: `🛌 Private Executive Suites`,
          cameraDirection: 'Smooth Steadicam glide through primary bath and customized walk-in dressing room.',
          bRollPrompt: 'Detailed macro shots of marble tile and designer lighting fixtures.'
        },
        {
          timeCode: '1:50 - 2:00',
          narration: `Listed exclusively with Nest Realty at ${price}. Contact ${agent} for private inquiries and bespoke property viewings.`,
          onScreenText: `🏡 Listed at ${price} • Nest Realty Wilmington`,
          cameraDirection: 'Twilight exterior shot with full landscape lighting illuminated.',
          bRollPrompt: 'Final branded title card with Nest Realty logo and contact details.'
        }
      ];
    }

    const teleprompterText = segments.map(s => `[${s.timeCode}] ${s.narration}`).join('\n\n');
    const wordCount = teleprompterText.split(/\s+/).length;

    return {
      id: `script_${Date.now().toString(36)}`,
      title: `${formatLabel} — ${address}`,
      propertyAddress: address,
      format: params.format,
      formatLabel,
      estimatedDurationSeconds: durationSeconds,
      wordCount,
      recommendedWpm: Math.round((wordCount / durationSeconds) * 60),
      suggestedMusicVibe: musicVibe,
      hookVariant: segments[0].narration,
      callToAction: segments[segments.length - 1].narration,
      segments,
      teleprompterText,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Curated Brokerage Video SOP Library
   */
  static getVideoTutorialLibrary(): VideoSopTutorial[] {
    return [
      {
        id: 'vid_sop_1',
        title: 'How to Stage 300 DPI Maxa Marketing Proofs in 60 Seconds',
        category: 'Maxa Design Studio',
        durationMinutes: '3:45',
        videoUrl: 'https://youtube.com/watch?v=sample_maxa_proofs',
        thumbnailUrl: '/thumbnails/video_sop_maxa.jpg',
        description: 'Complete walkthrough on submitting a marketing request to Eduardo Lovo and approving 9:16 stories and postcards.',
        instructor: 'Melissa Gagliardi (Marketing PM)'
      },
      {
        id: 'vid_sop_2',
        title: 'Mastering NC Form 2-T Due Diligence & Earnest Money Timelines',
        category: 'Dotloop Contracts',
        durationMinutes: '6:15',
        videoUrl: 'https://youtube.com/watch?v=sample_form2t_guide',
        thumbnailUrl: '/thumbnails/video_sop_form2t.jpg',
        description: 'Step-by-step review of NCREC Rule 58A .0106 compliance, 3-banking-day escrow rules, and avoiding statutory breach.',
        instructor: 'Jessica Keenan (BIC & Compliance)'
      },
      {
        id: 'vid_sop_3',
        title: 'Cape Fear MLS Comps & CMA Presentation Best Practices',
        category: 'MLS Comps',
        durationMinutes: '4:50',
        videoUrl: 'https://youtube.com/watch?v=sample_mls_comps',
        thumbnailUrl: '/thumbnails/video_sop_cma.jpg',
        description: 'How to extract verified price-per-square-foot and average days-on-market metrics for Wilmington luxury properties.',
        instructor: 'Ryan Crecelius (Principal Broker)'
      },
      {
        id: 'vid_sop_4',
        title: 'Working with Real Estate Agents (WWREA) First Substantial Contact SOP',
        category: 'BIC Compliance',
        durationMinutes: '5:10',
        videoUrl: 'https://youtube.com/watch?v=sample_wwrea_guide',
        thumbnailUrl: '/thumbnails/video_sop_wwrea.jpg',
        description: 'How and when to deliver the WWREA disclosure to prospective buyers and sellers in North Carolina.',
        instructor: 'Eric Knight (Broker-in-Charge)'
      }
    ];
  }
}
