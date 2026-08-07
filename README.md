# Droply Backend

RESTful API for a YouTube-like video-sharing platform built with Express, TypeScript, MongoDB, Redis, and BullMQ.

## Tech Stack

- **Runtime**: Node.js + TypeScript (ESM)
- **Framework**: Express 5
- **Database**: MongoDB (Mongoose 9)
- **Cache / Queue**: Redis (ioredis) + BullMQ
- **File Uploads**: Multer + Cloudinary (authenticated URLs, HLS m3u8)
- **Auth**: JWT (access + refresh tokens), bcrypt
- **Validation**: Joi
- **Email**: Nodemailer
- **Language Detection**: franc + ISO 639-3 mapping

## Project Structure

```
src/
├── app.ts                  # Express setup & route mounting
├── server.ts               # Entry point
├── config/                 # DB, Redis, Cloudinary, Multer, JWT
├── constants/              # Rate limiters, languages (85 langs)
├── middlewares/             # Auth, asyncHandler, error handling, rate limiting, validation
├── modules/
│   ├── auth/               # Register (Gmail), login, refresh, logout
│   ├── user/               # User model, language subdocument
│   ├── channel/            # Channel profile, subscribe/unsubscribe, notification toggle
│   ├── videos/             # Upload, processing queue, search, signed URLs
│   ├── WatchSession/       # Watch tracking, heartbeat, view counting
│   ├── like/               # Like/dislike toggle
│   ├── comment/            # CRUD comments
│   ├── home/               # Feed, trending, shorts
│   └── notification/       # In-app notifications (light + broadcast queues)
├── services/               # Shared utilities
├── templates/              # Email templates
├── types/                  # Shared TypeScript types
└── utils/                  # ApiError, ApiFeatures, token generation
```

## Environment Variables

| Variable | Description |
|---|---|
| `CLIENT_URL` | Frontend origin (CORS) |
| `MONGODB_URL` | MongoDB connection string |
| `PORT` | Server port |
| `NODE_ENV` | `development` or `production` |
| `EMAIL_USER` | Gmail address for sending emails |
| `EMAIL_PASSWORD` | Gmail app password |
| `JWT_SECRET` | Access token secret |
| `REFRESH_TOKEN_SECRET` | Refresh token secret |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `REDIS_HOST` | Redis host |
| `REDIS_PORT` | Redis port |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (with watch)
npm run dev
```

Requires MongoDB and Redis running locally.

## API Endpoints

### Auth `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Register (auto-detects language from Accept-Language) |
| POST | `/login` | No | Login |
| POST | `/refresh` | No | Refresh access token |
| POST | `/logout` | Yes | Logout |

### Channel `/api/channel`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/countries` | Yes | List countries (excludes Israel) |
| GET | `/:username` | No | Get channel profile |
| PUT | `/update` | Yes | Update channel info |
| PUT | `/update/media` | Yes | Update banner/photo |
| POST | `/subscribe/:channelId` | Yes | Subscribe/unsubscribe |
| PATCH | `/notification/:channelId` | Yes | Toggle subscription notifications |

### Video `/api/video`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/upload` | Yes | Upload video + thumbnail (BullMQ queue) |
| GET | `/me` | Yes | Get my videos |
| GET | `/search?q=` | No | Search videos (text index, language fallback) |
| GET | `/single/:videoId` | No | Get video + signed URL |
| GET | `/:username` | No | Get public videos by channel |
| PATCH | `/status/:videoId` | Yes | Update video status |
| POST | `/refresh/:videoId` | Yes | Refresh signed URL |

### Watch Session `/api/watch-session`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/create` | No | Create session (userId or IP+userAgent dedup) |
| POST | `/track` | Yes | Heartbeat tracking (views, timeWatch) |
| GET | `/history` | Yes | Watch history (paginated) |

### Like `/api/like`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/toggle` | Yes | Like/dislike toggle |
| POST | `/check` | Yes | Check like status |
| POST | `/check-many` | Yes | Check like status for multiple targets |

### Comment `/api/comment`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/create` | Yes | Create comment (sends notification) |
| GET | `/get/:targetType/:targetId` | No | Get comments (paginated, sorted) |
| DELETE | `/:commentId` | Yes | Delete comment |

### Home `/api/home`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/feed` | No | Home feed (language + popularity) |
| GET | `/shorts` | No | Shorts feed |

### Notification `/api/notification`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | Get notifications (paginated) |
| PATCH | `/read/:notificationId` | Yes | Mark as read |
| PATCH | `/read-all` | Yes | Mark all as read |
| DELETE | `/:notificationId` | Yes | Delete notification |

## Key Features

### Video Upload Flow
1. User uploads video + thumbnail via Multer
2. Job dispatched to BullMQ (`videoUploadQueue`)
3. Worker uploads to Cloudinary (type: `authenticated`)
4. Generates HLS m3u8 for streaming
5. Thumbnail uploaded to Cloudinary
6. Broadcast notification sent to all subscribers

### Signed URLs
All video URLs are Cloudinary `authenticated` type — not publicly accessible. Signed URLs are generated server-side with `sign_url: true` and expire. Frontend uses `hls.js` for m3u8 playback and auto-refreshes URLs on error.

### Watch Tracking
- Session created per user+video (deduplicated by userId or IP+userAgent)
- Frontend sends heartbeat every ~10s with `timeWatching`
- Backend validates heartbeat timing (anti-cheat)
- View counted after watching >25% of duration (deduplicated by IP)
- `timeWatch` persisted on UserVideo via `$max`

### Notification System
- **Light queue** (like, comment, subscribe) — single user notification
- **Broadcast queue** (newVideo) — all subscribers via batch insert (5000/batch)
- Self-notifications filtered out (`userId.toString() !== fromUserId.toString()`)
- Notifications auto-deleted after 24h via TTL index

### Rate Limiting
| Endpoint | Limit |
|---|---|
| Global | 50 req/min |
| Auth | 10 req/15min |
| Upload | 20 req/15min |
| Subscription | 10 req/5min |
| Watch Session | 15 req/min |
| Notification Toggle | 10 req/min |
| URL Refresh | 10 req/min |
