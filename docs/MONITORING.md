# Monitoring - Tilawa Backend

Ce document explique comment monitorer le backend Tilawa avec Prometheus et visualiser les métriques.

## Endpoints de monitoring

### `/health` - Health Check

Endpoint simple pour vérifier que l'API est en ligne.

```bash
curl http://localhost:3000/health
```

**Réponse :**
```json
{
  "status": "ok",
  "timestamp": "2024-11-30T12:00:00.000Z",
  "service": "tilawa-api",
  "version": "1.0.0"
}
```

### `/metrics` - Prometheus Metrics

Endpoint exposant les métriques au format Prometheus.

```bash
curl http://localhost:3000/metrics
```

## Métriques disponibles

### Métriques HTTP

**`http_requests_total`** - Compteur
- Total des requêtes HTTP
- Labels : `method`, `route`, `status_code`

**`http_request_duration_seconds`** - Histogramme
- Durée des requêtes HTTP en secondes
- Labels : `method`, `route`, `status_code`
- Buckets : 0.1s, 0.5s, 1s, 2s, 5s

### Métriques système (par défaut)

- `process_cpu_user_seconds_total` - CPU utilisé
- `process_resident_memory_bytes` - Mémoire utilisée
- `nodejs_eventloop_lag_seconds` - Event loop lag
- `nodejs_active_handles_total` - Handles actifs
- Et plus...

## Configuration Prometheus

Créer un fichier `prometheus.yml` :

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'tilawa-api'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

Lancer Prometheus :

```bash
# Avec Docker
docker run -d \
  -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# Accéder à Prometheus
open http://localhost:9090
```

## Requêtes Prometheus utiles

### Taux de requêtes par seconde

```promql
rate(http_requests_total[5m])
```

### Taux d'erreurs (5xx)

```promql
rate(http_requests_total{status_code=~"5.."}[5m])
```

### Latence P95

```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Latence moyenne par route

```promql
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

## Grafana Dashboard

### Installation

```bash
docker run -d \
  -p 3001:3000 \
  --name=grafana \
  grafana/grafana
```

### Configuration

1. Accéder à Grafana : http://localhost:3001
2. Login : admin / admin
3. Ajouter Prometheus comme data source :
   - URL : http://host.docker.internal:9090
4. Importer un dashboard ou créer le vôtre

### Panels recommandés

**Request Rate**
```promql
sum(rate(http_requests_total[5m])) by (route)
```

**Error Rate**
```promql
sum(rate(http_requests_total{status_code=~"[45].."}[5m])) by (status_code)
```

**Response Time (P50, P95, P99)**
```promql
histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
```

**Memory Usage**
```promql
process_resident_memory_bytes
```

## Rate Limiting

Le backend implémente du rate limiting pour protéger contre les abus.

### Limites configurées

**Global API** (`/api/*`)
- 100 requêtes par 15 minutes par IP
- Code d'erreur : `RATE_LIMIT_EXCEEDED`

**Auth endpoints** (`/api/v1/auth/*`)
- 5 requêtes par 15 minutes par IP
- Code d'erreur : `AUTH_RATE_LIMIT_EXCEEDED`

### Réponse en cas de dépassement

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later"
  }
}
```

Headers retournés :
- `RateLimit-Limit` : Limite maximale
- `RateLimit-Remaining` : Requêtes restantes
- `RateLimit-Reset` : Timestamp de réinitialisation

### Configuration personnalisée

Pour modifier les limites, éditer `/Users/abderrahim/Desktop/tila1/apps/api/src/middleware/rate-limit.ts` :

```typescript
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // Fenêtre de temps
  max: 100, // Nombre max de requêtes
});
```

## Alerting (optionnel)

### Alertmanager

Créer un fichier `alerting_rules.yml` :

```yaml
groups:
  - name: tilawa_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 5% for 5 minutes"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "P95 latency is above 2 seconds"
```

## Logs structurés

Les logs sont générés par le Logger de `@tilawa/utils` :

```typescript
import { Logger } from '@tilawa/utils';

const logger = new Logger('ServiceName');
logger.info('Message', { context: 'data' });
logger.error('Error message', { error });
```

Format des logs :
```
[2024-11-30T12:00:00.000Z] [INFO] [ServiceName] Message {"context":"data"}
```

## Métriques Workers (futur)

Pour monitorer les workers BullMQ, ajouter des métriques personnalisées :

```typescript
const jobsProcessed = new client.Counter({
  name: 'jobs_processed_total',
  help: 'Total jobs processed',
  labelNames: ['queue', 'status'],
});

// Dans le worker
jobsProcessed.inc({ queue: 'audio-process', status: 'completed' });
```

## Best Practices

1. **Surveiller les 4 Golden Signals** :
   - Latency (temps de réponse)
   - Traffic (requêtes/sec)
   - Errors (taux d'erreur)
   - Saturation (utilisation ressources)

2. **Définir des SLOs** :
   - P95 latency < 1s
   - Taux d'erreur < 1%
   - Disponibilité > 99.9%

3. **Alertes intelligentes** :
   - Éviter les faux positifs
   - Alerter sur les tendances, pas les pics isolés
   - Inclure le contexte dans les alertes

4. **Retention des métriques** :
   - 15 jours pour les métriques détaillées
   - 1 an pour les métriques agrégées

## Troubleshooting

### Métriques non disponibles

```bash
# Vérifier que l'endpoint répond
curl http://localhost:3000/metrics

# Vérifier les logs de l'API
npm run dev:api
```

### Prometheus ne scrape pas

```bash
# Vérifier la configuration
cat prometheus.yml

# Vérifier les targets dans Prometheus UI
open http://localhost:9090/targets
```

### High memory usage

```bash
# Vérifier les métriques Node.js
curl http://localhost:3000/metrics | grep nodejs_heap
```
