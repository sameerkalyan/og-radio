// _worker.js - Cloudflare Pages Function
// This handles ALL backend logic: API routes + R2 streaming

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ============================================================================
    // Serve static assets (HTML, CSS, JS, images) from Pages
    // ============================================================================
    if (!url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    // ============================================================================
    // Handle CORS preflight
    // ============================================================================
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // ============================================================================
    // API ROUTES
    // ============================================================================

    // GET /api/tracks - Return all tracks
    if (url.pathname === "/api/tracks") {
      return Response.json(TRACKS, {
        headers: {
          "Cache-Control": "public, max-age=86400", // Cache for 24 hours
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // GET /api/radio/current - Get current radio state
    if (url.pathname === "/api/radio/current") {
      const state = getCurrentRadioState();
      return Response.json(state, {
        headers: {
          "Cache-Control": "public, max-age=5", // Cache for 5 seconds
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // GET /api/audio/:filename - Stream audio from R2
    if (url.pathname.startsWith("/api/audio/")) {
      return handleAudioStream(request, env);
    }

    // 404 for other routes
    return new Response("Not found", { status: 404 });
  },
};

// ============================================================================
// TRACK CONFIGURATION - UPDATE WITH YOUR 40 TRACKS
// ============================================================================
const TRACKS = [
  {
    id: 1,
    title: "The Black Dragon Society",
    artist: "Thaman S",
    filename: "01-The-Black-Dragon-Society.flac",
    duration: 111,
  },
  {
    id: 2,
    title: "A New Beginning Bombay",
    artist: "Thaman S",
    filename: "02-A-New-Beginning-Bombay.flac",
    duration: 54,
  },
  {
    id: 3,
    title: "The Pirates Raid",
    artist: "Thaman S",
    filename: "03-The-Pirates-Raid.flac",
    duration: 84,
  },
  {
    id: 4,
    title: "The Rise of Ojas Gambheera",
    artist: "Thaman S",
    filename: "04-The-Rise-of-Ojas-Gambheera.flac",
    duration: 136,
  },
  {
    id: 5,
    title: "The Evil Jimmy",
    artist: "Thaman S",
    filename: "05-The-Evil-Jimmy.flac",
    duration: 67,
  },
  {
    id: 6,
    title: "The Sorrow of Satya Dada",
    artist: "Thaman S",
    filename: "06-The-Sorrow-of-Satya-Dada.flac",
    duration: 82,
  },
  {
    id: 7,
    title: "The OG's Katana",
    artist: "Thaman S",
    filename: "07-The-OG's-Katana.flac",
    duration: 37,
  },
  {
    id: 8,
    title: "The Blood Dance of OG",
    artist: "Thaman S",
    filename: "08-The-Blood-Dance-of-OG.flac",
    duration: 262,
  },
  {
    id: 9,
    title: "The Guardian",
    artist: "Thaman S",
    filename: "09-The-Guardian.flac",
    duration: 99,
  },
  {
    id: 10,
    title: "After The Storm",
    artist: "Thaman S",
    filename: "10-After-The-Storm.flac",
    duration: 101,
  },
  {
    id: 11,
    title: "Deadly Katana",
    artist: "Thaman S",
    filename: "11-Deadly-Katana.flac",
    duration: 121,
  },
  {
    id: 12,
    title: "Mumbai Storm",
    artist: "Thaman S",
    filename: "12-Mumbai-Storm.flac",
    duration: 240,
  },
  {
    id: 13,
    title: "OG's Kanmani",
    artist: "Thaman S",
    filename: "13-OG's-Kanmani.flac",
    duration: 134,
  },
  {
    id: 14,
    title: "The Orchestral Suvvi Suvvi",
    artist: "Thaman S",
    filename: "14-The-Orchestral-Suvvi-Suvvi.flac",
    duration: 375,
  },
  {
    id: 15,
    title: "Sensei Gambheera",
    artist: "Thaman S",
    filename: "15-Sensei-Gambheera.flac",
    duration: 98,
  },
  {
    id: 16,
    title: "Who Are You",
    artist: "Thaman S",
    filename: "16-Who-Are-You.flac",
    duration: 57,
  },
  {
    id: 17,
    title: "Naam Hai Uska Omi",
    artist: "Thaman S",
    filename: "17-Naam-Hai-Uska-Omi.flac",
    duration: 88,
  },
  {
    id: 18,
    title: "A Father's Tale",
    artist: "Thaman S",
    filename: "18-A-Father's-Tale.flac",
    duration: 202,
  },
  {
    id: 19,
    title: "Jimmy's Night",
    artist: "Thaman S",
    filename: "19-Jimmy's-Night.flac",
    duration: 127,
  },
  {
    id: 20,
    title: "Omi's in The Town",
    artist: "Thaman S",
    filename: "20-Omi's-in-The-Town.flac",
    duration: 94,
  },
  {
    id: 21,
    title: "Cries of The Port",
    artist: "Thaman S",
    filename: "21-Cries-of-The-Port.flac",
    duration: 273,
  },
  {
    id: 22,
    title: "The Return of Gambheera",
    artist: "Thaman S",
    filename: "22-The-Return-of-Gambheera.flac",
    duration: 331,
  },
  {
    id: 23,
    title: "Kanmani Farewell",
    artist: "Thaman S",
    filename: "23-Kanmani-Farewell.flac",
    duration: 193,
  },
  {
    id: 24,
    title: "The OG's Stance",
    artist: "Thaman S",
    filename: "24-The-OG's-Stance.flac",
    duration: 104,
  },
  {
    id: 25,
    title: "OG Returns to Bombay",
    artist: "Thaman S",
    filename: "25-OG-Returns-to-Bombay.flac",
    duration: 98,
  },
  {
    id: 26,
    title: "Police Station Rampage (Part 1)",
    artist: "Thaman S",
    filename: "26-Police-Station-Rampage-(Part-1).flac",
    duration: 48,
  },
  {
    id: 27,
    title: "Police Station Rampage (Part 2)",
    artist: "Thaman S",
    filename: "27-Police-Station-Rampage-(Part-2).flac",
    duration: 100,
  },
  {
    id: 28,
    title: "Geetha's Rescue",
    artist: "Thaman S",
    filename: "28-Geetha's-Rescue.flac",
    duration: 206,
  },
  {
    id: 29,
    title: "Gangster and His Guns",
    artist: "Thaman S",
    filename: "29-Gangster-and-His-Guns.flac",
    duration: 87,
  },
  {
    id: 30,
    title: "OG Ka Faisla",
    artist: "Thaman S",
    filename: "30-OG-Ka-Faisla.flac",
    duration: 146,
  },
  {
    id: 31,
    title: "Arjun's Blood Oath",
    artist: "Thaman S",
    filename: "31-Arjun's-Blood-Oath.flac",
    duration: 88,
  },
  {
    id: 32,
    title: "Only Gambheera's Law",
    artist: "Thaman S",
    filename: "32-Only-Gambheera's-Law.flac",
    duration: 109,
  },
  {
    id: 33,
    title: "A Storm is Coming",
    artist: "Thaman S",
    filename: "33-A-Storm-is-Coming.flac",
    duration: 138,
  },
  {
    id: 34,
    title: "Gambheera's Sacrifice",
    artist: "Thaman S",
    filename: "34-Gambheera's-Sacrifice.flac",
    duration: 203,
  },
  {
    id: 35,
    title: "The Hunger of Cheetah",
    artist: "Thaman S",
    filename: "35-The-Hunger-of-Cheetah.flac",
    duration: 209,
  },
  {
    id: 36,
    title: "Echoes of Kanmani",
    artist: "Thaman S",
    filename: "36-Echoes-of-Kanmani.flac",
    duration: 98,
  },
  {
    id: 37,
    title: "The Samurai and The Nine",
    artist: "Thaman S",
    filename: "37-The-Samurai-and-The-Nine.flac",
    duration: 138,
  },
  {
    id: 38,
    title: "Orochi Genshin",
    artist: "Thaman S",
    filename: "38-Orochi-Genshin.flac",
    duration: 290,
  },
  {
    id: 39,
    title: "A Husband's Promise",
    artist: "Thaman S",
    filename: "39-A-Husband's-Promise.flac",
    duration: 101,
  },
  {
    id: 40,
    title: "Memories of Kanmani",
    artist: "Thaman S",
    filename: "40-Memories-of-Kanmani.flac",
    duration: 183,
  },
];

// ============================================================================
// RADIO STATE CALCULATION
// ============================================================================
function getCurrentRadioState() {
  const now = Date.now();

  // Calculate total playlist duration
  const totalDuration = TRACKS.reduce((sum, track) => sum + track.duration, 0);

  // Calculate position in current loop
  const secondsSinceEpoch = Math.floor(now / 1000);
  const positionInCycle = secondsSinceEpoch % totalDuration;

  // Find which track should be playing
  let elapsed = 0;
  let currentTrackIndex = 0;
  let trackStartOffset = 0;

  for (let i = 0; i < TRACKS.length; i++) {
    if (positionInCycle < elapsed + TRACKS[i].duration) {
      currentTrackIndex = i;
      trackStartOffset = positionInCycle - elapsed;
      break;
    }
    elapsed += TRACKS[i].duration;
  }

  const currentTrack = TRACKS[currentTrackIndex];
  const trackStartTime = now - trackStartOffset * 1000;

  return {
    track: currentTrack,
    startTime: trackStartTime,
    elapsed: trackStartOffset,
    isPlaying: true,
    totalTracks: TRACKS.length,
    currentIndex: currentTrackIndex,
  };
}

// ============================================================================
// AUDIO STREAMING WITH CACHING
// ============================================================================
async function handleAudioStream(request, env) {
  const url = new URL(request.url);
  const filename = url.pathname.replace("/api/audio/", "");

  // Validate filename
  if (!filename || filename.includes("..")) {
    return new Response("Invalid filename", { status: 400 });
  }

  // Check if track exists in our list
  const trackExists = TRACKS.some((t) => t.filename === filename);
  if (!trackExists) {
    return new Response("Track not found", { status: 404 });
  }

  // ============================================================================
  // CACHING LAYER - Cloudflare Cache API
  // ============================================================================
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), request);

  // Try to get from cache first
  let response = await cache.match(cacheKey);

  if (response) {
    console.log(`✅ Cache HIT: ${filename}`);
    return addCorsHeaders(response);
  }

  console.log(`❌ Cache MISS: ${filename} - Fetching from R2`);

  // ============================================================================
  // Fetch from R2
  // ============================================================================
  try {
    const object = await env.MUSIC_BUCKET.get(filename);

    if (!object) {
      return new Response("File not found in R2", { status: 404 });
    }

    // Create response with aggressive caching
    response = new Response(object.body, {
      headers: {
        "Content-Type": "audio/flac",
        "Content-Length": object.size,
        "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year
        "Accept-Ranges": "bytes",
        ETag: object.httpEtag,
        "Access-Control-Allow-Origin": "*",
      },
    });

    // Store in Cloudflare Cache (99% reduction in R2 operations!)
    await cache.put(cacheKey, response.clone());

    return response;
  } catch (error) {
    console.error(`Error fetching ${filename} from R2:`, error);
    return new Response("Failed to fetch audio", { status: 500 });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function addCorsHeaders(response) {
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Access-Control-Allow-Origin", "*");
  newHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
