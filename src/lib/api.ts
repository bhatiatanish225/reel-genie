// Mock API client following the provided API contract
export type ReelStatus = 'created' | 'queued' | 'generating' | 'ready' | 'scheduled' | 'posting' | 'posted' | 'failed' | 'cancelled';

export interface Reel {
  id: number;
  user_id: number;
  prompt: string;
  duration_seconds: 15 | 30 | 60;
  status: ReelStatus;
  caption: string;
  hashtags: string[];
  video_url: string | null;
  thumbnail_url: string | null;
  scheduled_time: string | null;
  ig_post_id: string | null;
  created_at: string;
  logs: LogEntry[];
  metadata?: Record<string, any>;
}

export interface LogEntry {
  ts: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface CreateReelRequest {
  prompt: string;
  duration_seconds: 15 | 30 | 60;
  voice: string;
  music_mood: string;
  post_now: boolean;
  scheduled_time?: string;
  metadata?: Record<string, any>;
}

export interface BatchCreateRequest {
  items: Array<{
    prompt: string;
    duration_seconds?: 15 | 30 | 60;
    voice?: string;
  }>;
  global_options: {
    music_mood: string;
    post_now: boolean;
    scheduled_time?: string;
  };
}

export interface BatchCreateResponse {
  batch_id: string;
  created_count: number;
  items: Array<{ id: number; status: ReelStatus }>;
}

export interface AnalyticsData {
  metrics: {
    posts: number;
    total_impressions: number;
    total_likes: number;
    avg_engagement: number;
  };
  timeseries: Array<{
    date: string;
    posts: number;
    impressions: number;
    likes: number;
    comments: number;
    saves: number;
  }>;
  top_hashtags: Array<{
    tag: string;
    count: number;
    impressions: number;
  }>;
  by_status: Record<ReelStatus, number>;
}

// Mock data storage
let mockReels: Reel[] = [
  {
    id: 1,
    user_id: 1,
    prompt: "Financial literacy tips for college students",
    duration_seconds: 30,
    status: "posted",
    caption: "Stop wasting money in 2025! 💸 Here are 3 tips every student needs to know",
    hashtags: ["#moneytips", "#students", "#finance", "#collegelife"],
    video_url: "https://cdn.example.com/reels/1.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=700&fit=crop",
    scheduled_time: null,
    ig_post_id: "ig_123456",
    created_at: "2025-11-15T09:00:00Z",
    logs: [
      { ts: "2025-11-15T09:00:01Z", level: "info", message: "Enqueued for generation" },
      { ts: "2025-11-15T09:02:15Z", level: "info", message: "Script generated" },
      { ts: "2025-11-15T09:03:40Z", level: "info", message: "TTS complete" },
      { ts: "2025-11-15T09:04:50Z", level: "info", message: "Video assembled" },
      { ts: "2025-11-15T09:05:00Z", level: "info", message: "Posted to Instagram" }
    ]
  },
  {
    id: 2,
    user_id: 1,
    prompt: "Productivity hacks for remote workers",
    duration_seconds: 60,
    status: "ready",
    caption: "Working from home? Try these 5 game-changing productivity hacks! 🚀",
    hashtags: ["#productivity", "#remotework", "#wfh", "#lifehacks"],
    video_url: "https://cdn.example.com/reels/2.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=700&fit=crop",
    scheduled_time: null,
    ig_post_id: null,
    created_at: "2025-11-18T14:30:00Z",
    logs: [
      { ts: "2025-11-18T14:30:01Z", level: "info", message: "Enqueued for generation" },
      { ts: "2025-11-18T14:32:15Z", level: "info", message: "Script generated" },
      { ts: "2025-11-18T14:35:40Z", level: "info", message: "TTS complete" },
      { ts: "2025-11-18T14:38:50Z", level: "info", message: "Video ready" }
    ]
  },
  {
    id: 3,
    user_id: 1,
    prompt: "Healthy breakfast ideas under 5 minutes",
    duration_seconds: 30,
    status: "scheduled",
    caption: "No time for breakfast? These quick recipes will change your mornings! 🍳",
    hashtags: ["#breakfast", "#healthyeating", "#quickmeals"],
    video_url: "https://cdn.example.com/reels/3.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1533777419517-3e4017e2e15a?w=400&h=700&fit=crop",
    scheduled_time: "2025-11-20T08:00:00Z",
    ig_post_id: null,
    created_at: "2025-11-19T10:00:00Z",
    logs: [
      { ts: "2025-11-19T10:00:01Z", level: "info", message: "Enqueued for generation" },
      { ts: "2025-11-19T10:02:15Z", level: "info", message: "Script generated" },
      { ts: "2025-11-19T10:03:40Z", level: "info", message: "Video ready, scheduled for posting" }
    ]
  },
  {
    id: 4,
    user_id: 1,
    prompt: "Travel destinations in 2025",
    duration_seconds: 60,
    status: "generating",
    caption: "",
    hashtags: [],
    video_url: null,
    thumbnail_url: null,
    scheduled_time: null,
    ig_post_id: null,
    created_at: "2025-11-19T15:00:00Z",
    logs: [
      { ts: "2025-11-19T15:00:01Z", level: "info", message: "Enqueued for generation" },
      { ts: "2025-11-19T15:02:15Z", level: "info", message: "Generating script..." }
    ]
  }
];

let nextId = 5;

// Mock API functions
export const api = {
  async listReels(params?: { page?: number; page_size?: number; status?: ReelStatus }): Promise<{ items: Reel[]; page: number; page_size: number; total: number }> {
    await delay(300);
    const filtered = params?.status ? mockReels.filter(r => r.status === params.status) : mockReels;
    const page = params?.page || 1;
    const page_size = params?.page_size || 20;
    const start = (page - 1) * page_size;
    const items = filtered.slice(start, start + page_size);
    
    return {
      items,
      page,
      page_size,
      total: filtered.length
    };
  },

  async getReel(id: number): Promise<Reel | null> {
    await delay(200);
    return mockReels.find(r => r.id === id) || null;
  },

  async createReel(data: CreateReelRequest): Promise<Reel> {
    await delay(500);
    const newReel: Reel = {
      id: nextId++,
      user_id: 1,
      prompt: data.prompt,
      duration_seconds: data.duration_seconds,
      status: "queued",
      caption: "",
      hashtags: [],
      video_url: null,
      thumbnail_url: null,
      scheduled_time: data.scheduled_time || null,
      ig_post_id: null,
      created_at: new Date().toISOString(),
      logs: [
        { ts: new Date().toISOString(), level: "info", message: "Enqueued for generation" }
      ],
      metadata: data.metadata
    };
    mockReels = [newReel, ...mockReels];
    
    // Simulate generation progress
    setTimeout(() => simulateGeneration(newReel.id), 2000);
    
    return newReel;
  },

  async publishReel(id: number): Promise<Reel> {
    await delay(500);
    const reel = mockReels.find(r => r.id === id);
    if (!reel) throw new Error("Reel not found");
    if (reel.status !== "ready") throw new Error("Reel not ready for publishing");
    
    reel.status = "posting";
    reel.logs.push({ ts: new Date().toISOString(), level: "info", message: "Publishing to Instagram..." });
    
    setTimeout(() => {
      reel.status = "posted";
      reel.ig_post_id = `ig_${Date.now()}`;
      reel.logs.push({ ts: new Date().toISOString(), level: "info", message: "Posted successfully!" });
    }, 2000);
    
    return reel;
  },

  async retryReel(id: number): Promise<Reel> {
    await delay(300);
    const reel = mockReels.find(r => r.id === id);
    if (!reel) throw new Error("Reel not found");
    
    reel.status = "queued";
    reel.logs.push({ ts: new Date().toISOString(), level: "info", message: "Retrying generation..." });
    
    setTimeout(() => simulateGeneration(id), 2000);
    
    return reel;
  },

  async cancelReel(id: number): Promise<Reel> {
    await delay(300);
    const reel = mockReels.find(r => r.id === id);
    if (!reel) throw new Error("Reel not found");
    
    reel.status = "cancelled";
    reel.logs.push({ ts: new Date().toISOString(), level: "info", message: "Cancelled by user" });
    
    return reel;
  },

  async createBatch(data: BatchCreateRequest): Promise<BatchCreateResponse> {
    await delay(700);
    const batch_id = `bch_${Date.now()}`;
    const createdReels: Reel[] = [];

    for (const item of data.items) {
      const newReel: Reel = {
        id: nextId++,
        user_id: 1,
        prompt: item.prompt,
        duration_seconds: item.duration_seconds || 30,
        status: "queued",
        caption: "",
        hashtags: [],
        video_url: null,
        thumbnail_url: null,
        scheduled_time: data.global_options.scheduled_time || null,
        ig_post_id: null,
        created_at: new Date().toISOString(),
        logs: [
          { ts: new Date().toISOString(), level: "info", message: "Enqueued for generation" }
        ],
        metadata: { batch_id }
      };
      createdReels.push(newReel);
      mockReels = [newReel, ...mockReels];
      
      // Simulate generation with stagger
      setTimeout(() => simulateGeneration(newReel.id), 2000 + Math.random() * 3000);
    }

    return {
      batch_id,
      created_count: createdReels.length,
      items: createdReels.map(r => ({ id: r.id, status: r.status }))
    };
  },

  async getAnalytics(params?: { start?: string; end?: string; status?: ReelStatus }): Promise<AnalyticsData> {
    await delay(400);
    
    // Filter data based on params
    let filteredReels = mockReels;
    if (params?.status) {
      filteredReels = filteredReels.filter(r => r.status === params.status);
    }
    
    return {
      metrics: {
        posts: 12,
        total_impressions: 45230,
        total_likes: 3420,
        avg_engagement: 7.56
      },
      timeseries: [
        { date: "2025-11-13", posts: 2, impressions: 3200, likes: 245, comments: 18, saves: 42 },
        { date: "2025-11-14", posts: 1, impressions: 4100, likes: 312, comments: 24, saves: 56 },
        { date: "2025-11-15", posts: 3, impressions: 5800, likes: 445, comments: 35, saves: 78 },
        { date: "2025-11-16", posts: 2, impressions: 3900, likes: 298, comments: 21, saves: 51 },
        { date: "2025-11-17", posts: 1, impressions: 4200, likes: 325, comments: 28, saves: 63 },
        { date: "2025-11-18", posts: 2, impressions: 6100, likes: 478, comments: 42, saves: 89 },
        { date: "2025-11-19", posts: 1, impressions: 3800, likes: 287, comments: 19, saves: 47 }
      ],
      top_hashtags: [
        { tag: "#moneytips", count: 5, impressions: 12500 },
        { tag: "#productivity", count: 4, impressions: 9800 },
        { tag: "#students", count: 3, impressions: 7200 },
        { tag: "#healthyeating", count: 3, impressions: 6900 },
        { tag: "#finance", count: 2, impressions: 5400 }
      ],
      by_status: {
        created: 0,
        queued: mockReels.filter(r => r.status === "queued").length,
        generating: mockReels.filter(r => r.status === "generating").length,
        ready: mockReels.filter(r => r.status === "ready").length,
        scheduled: mockReels.filter(r => r.status === "scheduled").length,
        posting: mockReels.filter(r => r.status === "posting").length,
        posted: mockReels.filter(r => r.status === "posted").length,
        failed: mockReels.filter(r => r.status === "failed").length,
        cancelled: mockReels.filter(r => r.status === "cancelled").length
      }
    };
  },

  exportAnalyticsCSV(data: AnalyticsData): string {
    const headers = ["Date", "Posts", "Impressions", "Likes", "Comments", "Saves", "Engagement Rate"];
    const rows = data.timeseries.map(row => [
      row.date,
      row.posts,
      row.impressions,
      row.likes,
      row.comments,
      row.saves,
      ((row.likes / row.impressions) * 100).toFixed(2) + "%"
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    return csvContent;
  }
};

// Helper functions
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function simulateGeneration(id: number) {
  const reel = mockReels.find(r => r.id === id);
  if (!reel || reel.status === "cancelled") return;
  
  reel.status = "generating";
  reel.logs.push({ ts: new Date().toISOString(), level: "info", message: "Generating script..." });
  
  setTimeout(() => {
    if (reel.status === "cancelled") return;
    reel.logs.push({ ts: new Date().toISOString(), level: "info", message: "Script generated" });
    reel.logs.push({ ts: new Date().toISOString(), level: "info", message: "Generating TTS..." });
  }, 2000);
  
  setTimeout(() => {
    if (reel.status === "cancelled") return;
    reel.logs.push({ ts: new Date().toISOString(), level: "info", message: "TTS complete" });
    reel.logs.push({ ts: new Date().toISOString(), level: "info", message: "Assembling video..." });
  }, 4000);
  
  setTimeout(() => {
    if (reel.status === "cancelled") return;
    const sampleThumbnails = [
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=700&fit=crop",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=700&fit=crop",
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=700&fit=crop"
    ];
    reel.status = "ready";
    reel.caption = `Amazing content about ${reel.prompt}! 🚀`;
    reel.hashtags = ["#viral", "#content", "#ai"];
    reel.video_url = `https://cdn.example.com/reels/${id}.mp4`;
    reel.thumbnail_url = sampleThumbnails[Math.floor(Math.random() * sampleThumbnails.length)];
    reel.logs.push({ ts: new Date().toISOString(), level: "info", message: "Video ready!" });
  }, 6000);
}
