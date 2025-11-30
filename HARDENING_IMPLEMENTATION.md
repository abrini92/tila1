# 🔒 Implémentation des durcissements backend - Tilawa

## ✅ Durcissements implémentés

### 1️⃣ Validation stricte des uploads audio

**Fichiers créés/modifiés** :

1. **`apps/api/src/middleware/upload.ts`** (CRÉÉ)
   - Middleware multer avec validation stricte
   - Limite de taille : 50 MB
   - MIME types autorisés : `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/x-wav`, `audio/wave`
   - Gestion d'erreurs propre (400 Bad Request, 413 Payload Too Large)
   - Hook prévu pour scan antivirus ClamAV (commenté, à implémenter)

2. **`apps/api/src/modules/recitation/recitation.routes.ts`** (MODIFIÉ)
   - Import des middlewares `uploadAudio` et `handleUploadErrors`
   - Route `POST /:id/upload` modifiée pour utiliser multer
   - Validation du fichier uploadé (présence, taille, type)
   - Message de succès avec taille du fichier

3. **`apps/api/package.json`** (MODIFIÉ)
   - Ajout de `multer` et `@types/multer`

**Extraits de code clés** :

```typescript
// apps/api/src/middleware/upload.ts
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
];

export const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new ValidationError(`Invalid audio format`));
    }
    cb(null, true);
  },
}).single('audio');
```

```typescript
// apps/api/src/modules/recitation/recitation.routes.ts
router.post('/:id/upload', uploadRateLimit, uploadAudio, handleUploadErrors, async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { code: 'NO_FILE_UPLOADED', message: 'No audio file provided' },
    });
  }
  const audioBuffer = req.file.buffer;
  const recitation = await recitationService.uploadAudio(id, userId, audioBuffer);
  // ...
});
```

---

### 2️⃣ Rate limiting différencié par endpoint

**Fichiers modifiés** :

1. **`apps/api/src/middleware/rate-limit.ts`** (MODIFIÉ)
   - Ajout de `uploadRateLimit` : 5 uploads/heure/user
   - Ajout de `likeRateLimit` : 50 likes/heure/user
   - Clé par utilisateur (`req.user.id`) si authentifié, sinon par IP
   - Messages d'erreur spécifiques (429 Too Many Requests)

2. **`apps/api/src/modules/recitation/recitation.routes.ts`** (MODIFIÉ)
   - Route `POST /:id/upload` : ajout de `uploadRateLimit`
   - Route `POST /:id/like` : ajout de `likeRateLimit`
   - Route `DELETE /:id/like` : ajout de `likeRateLimit`

**Extraits de code clés** :

```typescript
// apps/api/src/middleware/rate-limit.ts
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req: Request) => req.user?.id || req.ip || 'unknown',
  message: {
    success: false,
    error: {
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: 'Too many upload attempts. Maximum 5 uploads per hour allowed',
    },
  },
});

export const likeRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  keyGenerator: (req: Request) => req.user?.id || req.ip || 'unknown',
  message: {
    success: false,
    error: {
      code: 'LIKE_RATE_LIMIT_EXCEEDED',
      message: 'Too many like attempts. Maximum 50 likes per hour allowed',
    },
  },
});
```

---

### 3️⃣ Cache Redis pour le feed

**Fichiers créés/modifiés** :

1. **`apps/api/src/services/CacheService.ts`** (CRÉÉ)
   - Service de cache Redis complet
   - Méthodes : `get`, `set`, `delete`, `deletePattern`, `invalidateFeedCache`
   - TTL par défaut : 300 secondes (5 minutes)
   - Logging structuré (cache HIT/MISS)

2. **`apps/api/src/modules/feed/feed.routes.ts`** (MODIFIÉ)
   - Intégration du cache Redis
   - Clé de cache : `feed:page:{page}:size:{pageSize}`
   - Lecture du cache avant requête DB
   - Écriture en cache après requête DB
   - Indicateur `cached: true/false` dans la réponse (pour debug)

3. **`apps/api/src/dependencies.ts`** (MODIFIÉ)
   - Import et instanciation de `CacheService`
   - Ajout de `cacheService` dans le retour des dépendances

4. **`apps/api/src/app.ts`** (MODIFIÉ)
   - Passage de `cacheService` aux routes du feed

5. **`apps/api/src/utils/cache-invalidation.ts`** (CRÉÉ)
   - Utilitaires pour invalider le cache du feed
   - Hook `invalidateFeedOnRecitationChange` à appeler quand une récitation change de statut vers APPROVED
   - À intégrer dans les workers ou les routes admin

**Extraits de code clés** :

```typescript
// apps/api/src/services/CacheService.ts
export class CacheService {
  private redis: Redis;
  private defaultTTL: number = 300; // 5 minutes

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) {
      logger.debug(`Cache MISS: ${key}`);
      return null;
    }
    logger.debug(`Cache HIT: ${key}`);
    return JSON.parse(value) as T;
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidateFeedCache(): Promise<void> {
    await this.deletePattern('feed:*');
    logger.info('Feed cache invalidated');
  }
}
```

```typescript
// apps/api/src/modules/feed/feed.routes.ts
router.get('/', validate(feedQuerySchema), async (req, res, next) => {
  const cacheKey = `feed:page:${page}:size:${pageSize}`;
  
  // Tenter de récupérer depuis le cache
  const cachedFeed = await cacheService.get(cacheKey);
  if (cachedFeed) {
    return res.json({ success: true, data: cachedFeed, cached: true });
  }
  
  // Si pas en cache, requête DB
  const feed = await feedService.getFeed({ page, pageSize });
  
  // Stocker en cache (TTL: 5 minutes)
  await cacheService.set(cacheKey, feed, 300);
  
  res.json({ success: true, data: feed, cached: false });
});
```

```typescript
// apps/api/src/utils/cache-invalidation.ts
export async function invalidateFeedOnRecitationChange(
  cacheService: CacheService,
  oldStatus?: string,
  newStatus?: string
): Promise<void> {
  const shouldInvalidate = newStatus === 'APPROVED' || oldStatus === 'APPROVED';
  if (shouldInvalidate) {
    await cacheService.invalidateFeedCache();
  }
}
```

---

## 📋 Fichiers modifiés - Résumé

### Créés (5 fichiers)
1. `apps/api/src/middleware/upload.ts` - Validation uploads audio
2. `apps/api/src/services/CacheService.ts` - Service de cache Redis
3. `apps/api/src/utils/cache-invalidation.ts` - Utilitaires invalidation cache
4. `HARDENING_IMPLEMENTATION.md` - Ce document
5. `TEST_HARDENING.md` - Scripts de test (voir ci-dessous)

### Modifiés (6 fichiers)
1. `apps/api/package.json` - Ajout multer
2. `apps/api/src/middleware/rate-limit.ts` - Rate limiters spécifiques
3. `apps/api/src/modules/recitation/recitation.routes.ts` - Upload + rate limiting
4. `apps/api/src/modules/feed/feed.routes.ts` - Cache Redis
5. `apps/api/src/dependencies.ts` - CacheService
6. `apps/api/src/app.ts` - Passage cacheService

---

## 🚀 Commandes pour rebuild et relancer

### 1. Rebuild (si nécessaire)

```bash
cd ~/Desktop/tila1

# Rebuild tous les packages (optionnel, seulement si erreurs TS)
npm run build:packages

# Ou rebuild seulement l'API
npm run build --workspace=apps/api
```

### 2. Relancer l'API

```bash
cd ~/Desktop/tila1

# Arrêter l'API actuelle (Ctrl+C dans le terminal)
# Puis relancer
npm run dev:api
```

**Résultat attendu** :
```
✅ Database connected
✅ Dependencies initialized
Redis cache connected
🚀 Tilawa API Server started
🌐 Listening on port: 3000
```

---

## 🧪 Scripts de test

### Test 1 : Upload audio rejeté (type invalide)

```bash
# Créer un fichier texte (MIME type invalide)
echo "fake audio" > /tmp/fake.txt

# Tenter l'upload (doit être rejeté)
TOKEN="<votre_token>"
RECITATION_ID="<id_recitation>"

curl -X POST http://localhost:3000/api/v1/recitations/$RECITATION_ID/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "audio=@/tmp/fake.txt"
```

**Résultat attendu** :
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid audio format. Allowed formats: audio/mpeg, audio/mp3, audio/wav, audio/x-wav, audio/wave"
  }
}
```

---

### Test 2 : Upload audio rejeté (taille trop grande)

```bash
# Créer un fichier > 50 MB
dd if=/dev/zero of=/tmp/large.mp3 bs=1M count=51

# Tenter l'upload (doit être rejeté)
curl -X POST http://localhost:3000/api/v1/recitations/$RECITATION_ID/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "audio=@/tmp/large.mp3"
```

**Résultat attendu** :
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds the maximum limit of 50 MB"
  }
}
```

---

### Test 3 : Rate limit sur upload (6 tentatives)

```bash
# Script pour tester 6 uploads rapides
TOKEN="<votre_token>"
RECITATION_ID="<id_recitation>"

for i in {1..6}; do
  echo "Upload attempt $i"
  curl -X POST http://localhost:3000/api/v1/recitations/$RECITATION_ID/upload \
    -H "Authorization: Bearer $TOKEN" \
    -F "audio=@/tmp/test.mp3"
  echo ""
done
```

**Résultat attendu** :
- Tentatives 1-5 : Succès ou erreur métier (pas rate limit)
- Tentative 6 : 
```json
{
  "success": false,
  "error": {
    "code": "UPLOAD_RATE_LIMIT_EXCEEDED",
    "message": "Too many upload attempts. Maximum 5 uploads per hour allowed"
  }
}
```

---

### Test 4 : Rate limit sur likes (51 tentatives)

```bash
# Script pour tester 51 likes rapides
TOKEN="<votre_token>"

for i in {1..51}; do
  echo "Like attempt $i"
  RECITATION_ID="<id_recitation_$i>" # Utiliser différentes récitations
  curl -X POST http://localhost:3000/api/v1/recitations/$RECITATION_ID/like \
    -H "Authorization: Bearer $TOKEN"
  echo ""
done
```

**Résultat attendu** :
- Tentatives 1-50 : Succès
- Tentative 51 :
```json
{
  "success": false,
  "error": {
    "code": "LIKE_RATE_LIMIT_EXCEEDED",
    "message": "Too many like attempts. Maximum 50 likes per hour allowed"
  }
}
```

---

### Test 5 : Cache Redis sur feed (première requête lente, suivantes rapides)

```bash
# Première requête (cache MISS, requête DB)
time curl http://localhost:3000/api/v1/feed?page=1&pageSize=10

# Attendre 1 seconde

# Deuxième requête (cache HIT, pas de DB)
time curl http://localhost:3000/api/v1/feed?page=1&pageSize=10
```

**Résultat attendu** :

**Première requête** :
```json
{
  "success": true,
  "data": { "items": [...], "page": 1, ... },
  "cached": false
}
```
Temps : ~100-200ms

**Deuxième requête** :
```json
{
  "success": true,
  "data": { "items": [...], "page": 1, ... },
  "cached": true
}
```
Temps : ~10-50ms (beaucoup plus rapide)

**Logs backend** :
```
[CacheService] Cache MISS: feed:page:1:size:10
[CacheService] Cache SET: feed:page:1:size:10 (TTL: 300s)
[CacheService] Cache HIT: feed:page:1:size:10
```

---

### Test 6 : Vérifier l'invalidation du cache

```bash
# 1. Requête feed (mise en cache)
curl http://localhost:3000/api/v1/feed

# 2. Approuver une nouvelle récitation (via worker ou admin)
# Cela devrait appeler cacheService.invalidateFeedCache()

# 3. Requête feed à nouveau (cache MISS car invalidé)
curl http://localhost:3000/api/v1/feed
```

**Résultat attendu** :
- Première requête : `"cached": false`
- Deuxième requête (après invalidation) : `"cached": false` (cache reconstruit)

**Logs backend** :
```
[CacheInvalidation] Feed cache invalidated due to recitation status change
[CacheService] Cache invalidated: 3 keys matching feed:*
```

---

## 📊 Métriques de performance attendues

### Upload audio
- **Avant** : Pas de validation, risque de fichiers malveillants
- **Après** : Validation stricte, rejet propre des fichiers invalides

### Rate limiting
- **Avant** : Rate limit global uniquement (100 req/15min)
- **Après** : 
  - Upload : 5/heure/user
  - Likes : 50/heure/user
  - Auth : 5/15min/IP (inchangé)

### Cache feed
- **Avant** : Chaque requête = 1 query DB (~100-200ms)
- **Après** : 
  - Cache HIT : ~10-50ms (80-90% plus rapide)
  - Cache MISS : ~100-200ms (identique)
  - Taux de HIT attendu : ~80% (si feed consulté fréquemment)

---

## 🔧 Intégration future

### Scan antivirus ClamAV

Pour activer le scan antivirus (TODO) :

1. Installer ClamAV :
```bash
npm install clamscan --workspace=apps/api
```

2. Décommenter et implémenter dans `apps/api/src/middleware/upload.ts` :
```typescript
import { NodeClam } from 'clamscan';

const clamscan = await new NodeClam().init();

export const scanAudioFile = async (buffer: Buffer): Promise<boolean> => {
  const { isInfected } = await clamscan.scanBuffer(buffer);
  return !isInfected;
};
```

3. Ajouter dans la route d'upload :
```typescript
const isSafe = await scanAudioFile(req.file.buffer);
if (!isSafe) {
  return res.status(400).json({
    success: false,
    error: { code: 'MALWARE_DETECTED', message: 'File contains malware' },
  });
}
```

### Invalidation automatique du cache

Pour invalider automatiquement le cache quand une récitation est approuvée :

1. **Dans les workers** (`apps/audio-worker`, `apps/moderation-worker`) :
```typescript
import { invalidateFeedOnRecitationChange } from '../api/src/utils/cache-invalidation';

// Après avoir approuvé une récitation
await invalidateFeedOnRecitationChange(cacheService, 'PENDING', 'APPROVED');
```

2. **Dans RecitationService** (si modification de statut) :
```typescript
// Ajouter cacheService en dépendance
constructor(
  private recitationRepository: IRecitationRepository,
  private storageService: IStorageService,
  private queueService: IQueueService,
  private cacheService?: CacheService // Optionnel
) {}

// Après modification de statut
if (this.cacheService && newStatus === 'APPROVED') {
  await this.cacheService.invalidateFeedCache();
}
```

---

## ✅ Checklist de validation

- [x] Validation uploads audio implémentée
- [x] Rate limiting différencié implémenté
- [x] Cache Redis pour feed implémenté
- [x] Dépendances installées (multer)
- [x] CacheService intégré dans dependencies
- [x] Routes mises à jour
- [ ] Tests manuels exécutés (à faire)
- [ ] Scan antivirus ClamAV (TODO futur)
- [ ] Invalidation automatique cache dans workers (TODO futur)

---

**🎉 Les 3 durcissements prioritaires sont implémentés et prêts à être testés !**
