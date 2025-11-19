# Instagram Graph API Setup Guide

This guide walks you through setting up Instagram Graph API integration for publishing reels.

## Prerequisites

- Facebook Developer Account
- Instagram Business or Creator Account
- Facebook Page connected to Instagram account

## Step 1: Create Facebook App

1. Go to https://developers.facebook.com
2. Click "My Apps" → "Create App"
3. Select "Business" as app type
4. Fill in app details:
   - App Name: "Reel Genie"
   - Contact Email: your email
   - Business Account: select or create one

## Step 2: Add Instagram Graph API

1. In your app dashboard, click "Add Product"
2. Find "Instagram Graph API" and click "Set Up"
3. Configure basic settings

## Step 3: Get Access Token

### Short-lived Token (Development)

1. Go to Graph API Explorer: https://developers.facebook.com/tools/explorer
2. Select your app
3. Add permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_show_list`
4. Click "Generate Access Token"
5. Copy the token

### Long-lived Token (Production)

Exchange short-lived token for long-lived (60 days):

```bash
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN"
```

### Never-expiring Token

1. Get long-lived User Access Token (above)
2. Get Page Access Token:

```bash
curl -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token=LONG_LIVED_USER_TOKEN"
```

3. The Page Access Token returned will not expire

## Step 4: Get Instagram User ID

```bash
curl -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token=YOUR_ACCESS_TOKEN"
```

Find your page, then get Instagram Business Account ID:

```bash
curl -X GET "https://graph.facebook.com/v18.0/PAGE_ID?fields=instagram_business_account&access_token=YOUR_ACCESS_TOKEN"
```

## Step 5: Configure Environment

Add to `.env`:

```env
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_ACCESS_TOKEN=your_long_lived_token
INSTAGRAM_USER_ID=your_instagram_business_account_id
```

## Step 6: Test Publishing

### Test with Sample Video

```bash
# Create media container
curl -X POST "https://graph.facebook.com/v18.0/INSTAGRAM_USER_ID/media" \
  -d "media_type=REELS" \
  -d "video_url=https://your-cdn.com/test-video.mp4" \
  -d "caption=Test reel #test" \
  -d "access_token=YOUR_ACCESS_TOKEN"

# Check status
curl -X GET "https://graph.facebook.com/v18.0/CONTAINER_ID?fields=status_code&access_token=YOUR_ACCESS_TOKEN"

# Publish
curl -X POST "https://graph.facebook.com/v18.0/INSTAGRAM_USER_ID/media_publish" \
  -d "creation_id=CONTAINER_ID" \
  -d "access_token=YOUR_ACCESS_TOKEN"
```

## Step 7: App Review (Required for Production)

### Permissions Needed

- `instagram_basic` - Read profile info
- `instagram_content_publish` - Publish content
- `pages_read_engagement` - Read page data

### Review Process

1. Go to App Review in your app dashboard
2. Request permissions listed above
3. Provide:
   - Detailed description of use case
   - Step-by-step instructions
   - Video demonstration
   - Privacy policy URL
   - Terms of service URL

### Review Tips

- Clearly explain automation purpose
- Show user controls and consent
- Demonstrate content quality
- Explain data usage and privacy
- Typical approval time: 3-7 days

## Video Requirements

### Technical Specs

- **Format**: MP4 or MOV
- **Codec**: H.264
- **Resolution**: 
  - Minimum: 540x960 (9:16)
  - Recommended: 1080x1920 (9:16)
- **Duration**: 3-90 seconds
- **File Size**: Max 100MB
- **Frame Rate**: 23-60 FPS
- **Audio**: AAC, 128kbps+

### Content Guidelines

- No copyrighted music (use royalty-free)
- Follow Instagram Community Guidelines
- No misleading or spam content
- Proper attribution for stock footage

## Rate Limits

### Publishing Limits

- **Per User**: 25 posts per day
- **Per App**: 200 posts per hour
- **Container Creation**: 50 per hour

### Best Practices

- Implement exponential backoff
- Queue posts during off-peak hours
- Monitor rate limit headers
- Cache insights data

## Webhooks (Optional)

### Setup

1. In app dashboard, go to Webhooks
2. Subscribe to `instagram` object
3. Select fields:
   - `comments`
   - `mentions`
   - `story_insights`

### Verify Endpoint

```python
@app.get("/webhook")
def verify_webhook(request: Request):
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")
    
    if mode == "subscribe" and token == VERIFY_TOKEN:
        return int(challenge)
    return 403
```

## Insights & Analytics

### Get Post Insights

```bash
curl -X GET "https://graph.facebook.com/v18.0/MEDIA_ID/insights?metric=impressions,reach,likes,comments,shares,saves&access_token=YOUR_ACCESS_TOKEN"
```

### Available Metrics

- `impressions` - Total views
- `reach` - Unique accounts reached
- `likes` - Like count
- `comments` - Comment count
- `shares` - Share count
- `saves` - Save count
- `plays` - Video plays
- `total_interactions` - All interactions

## Troubleshooting

### Common Errors

**Error 190: Access token expired**
- Refresh long-lived token
- Implement token rotation

**Error 100: Invalid parameter**
- Check video URL is publicly accessible
- Verify video meets technical specs

**Error 368: Temporarily blocked**
- Rate limit exceeded
- Wait and retry with backoff

**Error 10: Permission denied**
- App not approved for publishing
- Submit for app review

### Debug Mode

Enable debug in API calls:

```bash
curl -X GET "https://graph.facebook.com/v18.0/me?debug=all&access_token=YOUR_ACCESS_TOKEN"
```

## Security Best Practices

1. **Never commit tokens** - Use environment variables
2. **Rotate tokens regularly** - Implement refresh flow
3. **Use HTTPS only** - For webhook endpoints
4. **Validate webhook signatures** - Verify Facebook requests
5. **Monitor usage** - Track API calls and errors
6. **Implement rate limiting** - Prevent abuse

## Resources

- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [Content Publishing Guide](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [Rate Limits](https://developers.facebook.com/docs/graph-api/overview/rate-limiting)
- [Webhooks](https://developers.facebook.com/docs/graph-api/webhooks)
- [App Review](https://developers.facebook.com/docs/app-review)
