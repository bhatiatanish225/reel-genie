# Deployment Guide

## Production Deployment Checklist

### Pre-deployment

- [ ] Set strong `SECRET_KEY` (use `openssl rand -hex 32`)
- [ ] Configure production database with SSL
- [ ] Set up S3 bucket with proper CORS and permissions
- [ ] Configure CDN for media delivery
- [ ] Set up Redis with persistence
- [ ] Configure Sentry for error tracking
- [ ] Set up log aggregation (ELK, CloudWatch, etc.)
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerts
- [ ] Review and set rate limits
- [ ] Configure CORS for production domains
- [ ] Set up SSL certificates
- [ ] Configure Instagram app for production

### Environment Variables

```bash
# Application
ENVIRONMENT=production
BASE_URL=https://api.yourdomain.com
SECRET_KEY=<strong-random-key>

# Database (use connection pooling)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis (use SSL)
REDIS_URL=rediss://user:pass@host:6379/0?ssl_cert_reqs=required

# AWS (use IAM roles if on AWS)
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
S3_BUCKET_NAME=prod-reel-genie-media

# APIs
OPENAI_API_KEY=<key>
ELEVENLABS_API_KEY=<key>
INSTAGRAM_ACCESS_TOKEN=<long-lived-token>

# Monitoring
SENTRY_DSN=<sentry-dsn>
LOG_LEVEL=INFO
```

## Docker Deployment

### Build Production Image

```bash
docker build -t reel-genie-backend:v1.0.0 .
docker tag reel-genie-backend:v1.0.0 your-registry/reel-genie-backend:v1.0.0
docker push your-registry/reel-genie-backend:v1.0.0
```

### Docker Compose Production

```yaml
version: '3.8'

services:
  api:
    image: your-registry/reel-genie-backend:v1.0.0
    restart: always
    ports:
      - "8000:8000"
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G

  celery_worker:
    image: your-registry/reel-genie-backend:v1.0.0
    restart: always
    command: celery -A app.tasks.celery_app worker --loglevel=info --concurrency=4
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '2'
          memory: 2G

  celery_beat:
    image: your-registry/reel-genie-backend:v1.0.0
    restart: always
    command: celery -A app.tasks.celery_app beat --loglevel=info
    env_file:
      - .env.production
    depends_on:
      - redis
    deploy:
      replicas: 1
```

## Kubernetes Deployment

### Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: reel-genie
```

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: reel-genie-config
  namespace: reel-genie
data:
  ENVIRONMENT: "production"
  BASE_URL: "https://api.yourdomain.com"
  LOG_LEVEL: "INFO"
```

### Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: reel-genie-secrets
  namespace: reel-genie
type: Opaque
stringData:
  SECRET_KEY: "<your-secret>"
  DATABASE_URL: "<your-db-url>"
  OPENAI_API_KEY: "<your-key>"
  # ... other secrets
```

### API Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: reel-genie-api
  namespace: reel-genie
spec:
  replicas: 3
  selector:
    matchLabels:
      app: reel-genie-api
  template:
    metadata:
      labels:
        app: reel-genie-api
    spec:
      containers:
      - name: api
        image: your-registry/reel-genie-backend:v1.0.0
        ports:
        - containerPort: 8000
        envFrom:
        - configMapRef:
            name: reel-genie-config
        - secretRef:
            name: reel-genie-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /v1/health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /v1/health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: reel-genie-api
  namespace: reel-genie
spec:
  selector:
    app: reel-genie-api
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

### Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: reel-genie-ingress
  namespace: reel-genie
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: reel-genie-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: reel-genie-api
            port:
              number: 80
```

## AWS Deployment

### ECS Task Definition

```json
{
  "family": "reel-genie-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "your-registry/reel-genie-backend:v1.0.0",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "ENVIRONMENT", "value": "production"}
      ],
      "secrets": [
        {
          "name": "SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:reel-genie/secret-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/reel-genie-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## Database Migration

### Zero-downtime Migration

```bash
# 1. Create new migration
alembic revision --autogenerate -m "add_new_feature"

# 2. Review migration file
cat alembic/versions/xxx_add_new_feature.py

# 3. Test on staging
alembic upgrade head

# 4. Deploy to production
# Run migration before deploying new code
alembic upgrade head

# 5. Deploy new application version
kubectl rollout restart deployment/reel-genie-api
```

## Monitoring

### Prometheus Metrics

Add to `app/main.py`:

```python
from prometheus_fastapi_instrumentator import Instrumentator

@app.on_event("startup")
async def startup():
    Instrumentator().instrument(app).expose(app)
```

### Grafana Dashboard

Import dashboard for:
- Request rate and latency
- Error rate
- Celery queue depth
- Database connections
- Memory/CPU usage

### Alerts

Set up alerts for:
- API error rate > 5%
- Response time p95 > 2s
- Celery queue depth > 100
- Database connection pool exhausted
- Disk usage > 80%
- Failed Instagram publishes

## Scaling

### Horizontal Scaling

```bash
# Scale API
kubectl scale deployment/reel-genie-api --replicas=5

# Scale Celery workers
kubectl scale deployment/reel-genie-worker --replicas=10
```

### Auto-scaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: reel-genie-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: reel-genie-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Backup Strategy

### Database Backups

```bash
# Daily automated backups
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz

# Upload to S3
aws s3 cp backup-$(date +%Y%m%d).sql.gz s3://backups/postgres/
```

### S3 Versioning

Enable versioning on S3 bucket for media files.

## Security

### SSL/TLS

- Use Let's Encrypt for certificates
- Enforce HTTPS only
- Set HSTS headers

### Network Security

- Use VPC with private subnets
- Restrict database access to application only
- Use security groups/network policies
- Enable DDoS protection

### Application Security

- Rate limiting on all endpoints
- Input validation
- SQL injection prevention (SQLAlchemy)
- XSS prevention
- CSRF protection
- Secrets in environment/vault

## Performance Optimization

### Database

- Add indexes on frequently queried columns
- Use connection pooling
- Enable query caching
- Use read replicas for analytics

### Caching

```python
# Redis caching for expensive operations
from redis import Redis
cache = Redis.from_url(settings.REDIS_URL)

@cache.memoize(timeout=300)
def get_trending_hashtags():
    # Expensive query
    pass
```

### CDN

- Use CloudFront/CloudFlare for media
- Enable gzip compression
- Set proper cache headers

## Rollback Procedure

```bash
# 1. Identify last working version
kubectl rollout history deployment/reel-genie-api

# 2. Rollback
kubectl rollout undo deployment/reel-genie-api

# 3. Verify
kubectl rollout status deployment/reel-genie-api

# 4. Check logs
kubectl logs -f deployment/reel-genie-api
```

## Disaster Recovery

### RTO/RPO

- Recovery Time Objective: < 1 hour
- Recovery Point Objective: < 15 minutes

### Backup Restoration

```bash
# Restore database
gunzip < backup-20251119.sql.gz | psql $DATABASE_URL

# Restore S3 (if needed)
aws s3 sync s3://backups/media/ s3://prod-media/
```

## Cost Optimization

- Use spot instances for Celery workers
- Auto-scale down during off-peak hours
- Use S3 lifecycle policies for old media
- Optimize database queries
- Cache frequently accessed data
- Use reserved instances for stable workloads
