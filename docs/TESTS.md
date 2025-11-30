# Tests - Tilawa Backend

Ce document explique comment exécuter et écrire des tests pour le backend Tilawa.

## Stack de tests

- **Framework**: Jest
- **Mocking**: Jest mocks
- **Tests d'intégration API**: Supertest
- **Coverage**: Jest coverage

## Installation

Les dépendances de test sont déjà incluses dans le projet. Si nécessaire :

```bash
npm install
```

## Exécution des tests

### Tous les tests

```bash
npm test
```

### Mode watch (développement)

```bash
npm run test:watch
```

### Avec coverage

```bash
npm run test:coverage
```

## Structure des tests

```
packages/domain/user/src/__tests__/
├── AuthService.test.ts          # Tests unitaires AuthService
└── UserService.test.ts          # Tests unitaires UserService (à venir)

packages/domain/recitation/src/__tests__/
└── RecitationService.test.ts    # Tests unitaires RecitationService

apps/api/src/__tests__/
└── auth.integration.test.ts     # Tests d'intégration API

apps/audio-worker/src/__tests__/
└── worker.test.ts               # Tests worker audio
```

## Types de tests

### 1. Tests unitaires (Domain Services)

Les tests unitaires testent la logique métier en isolation, avec tous les dépendances mockées.

**Exemple : AuthService**

```typescript
describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  
  beforeEach(() => {
    mockUserRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      // ...
    };
    
    authService = new AuthService(mockUserRepository, ...);
  });
  
  it('should register a new user', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue(mockUser);
    
    const result = await authService.register(email, password);
    
    expect(result).toHaveProperty('accessToken');
  });
});
```

**Couverture actuelle :**
- ✅ AuthService : register, login, verifyToken
- ✅ RecitationService : createDraft, uploadAudio, getRecitationById, updateRecitationStatus

### 2. Tests d'intégration API

Les tests d'intégration testent les endpoints API de bout en bout, avec une vraie base de données.

**Exemple : Auth endpoints**

```typescript
describe('Auth Integration Tests', () => {
  let app: any;
  
  beforeAll(async () => {
    deps = await initializeDependencies();
    app = createApp(deps);
  });
  
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password })
      .expect(200);
      
    expect(response.body.data).toHaveProperty('accessToken');
  });
});
```

**Couverture actuelle :**
- ✅ POST /api/v1/auth/register
- ✅ POST /api/v1/auth/login
- ✅ GET /api/v1/auth/me

### 3. Tests Workers

Les tests workers vérifient le traitement des jobs asynchrones.

**Exemple : Audio Worker**

```typescript
describe('Audio Worker', () => {
  it('should process audio analysis job', async () => {
    const mockJob = {
      data: { recitationId, audioUrl },
      updateProgress: jest.fn(),
    };
    
    const result = await processAudioAnalysis(mockJob);
    
    expect(result).toMatchObject({
      recitationId,
      duration: expect.any(Number),
      deepfakeScore: expect.any(Number),
    });
  });
});
```

## Bonnes pratiques

### 1. Isolation

- Chaque test doit être indépendant
- Utiliser `beforeEach` pour réinitialiser les mocks
- Nettoyer les données de test dans `afterAll`

### 2. Nommage

- Utiliser des descriptions claires : `should [action] when [condition]`
- Grouper les tests par fonctionnalité avec `describe`

### 3. Assertions

- Tester le comportement, pas l'implémentation
- Vérifier les cas d'erreur autant que les cas de succès
- Utiliser des matchers appropriés (`toHaveProperty`, `toMatchObject`, etc.)

### 4. Mocking

- Mocker les dépendances externes (DB, API, queues)
- Ne pas mocker le code testé
- Vérifier que les mocks sont appelés correctement

## Configuration Jest

Le fichier `jest.config.js` à la racine configure Jest pour le monorepo :

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages', '<rootDir>/apps'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@tilawa/(.*)$': '<rootDir>/packages/$1/src',
  },
};
```

## Tests d'intégration et base de données

Les tests d'intégration utilisent la vraie base de données PostgreSQL configurée dans `.env`.

**Important :**
- Les tests nettoient automatiquement les données créées
- Utilisez des emails uniques avec un préfixe `test-integration-`
- La base de données doit être accessible pendant les tests

## Coverage

Pour générer un rapport de couverture :

```bash
npm run test:coverage
```

Le rapport sera généré dans `coverage/` :
- `coverage/lcov-report/index.html` : Rapport HTML
- `coverage/lcov.info` : Format LCOV pour CI/CD

## CI/CD

Les tests peuvent être intégrés dans un pipeline CI/CD :

```yaml
# Exemple GitHub Actions
- name: Run tests
  run: npm test
  
- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Prochaines étapes

- [ ] Tests pour UserService
- [ ] Tests pour les endpoints de récitation
- [ ] Tests pour le moderation worker
- [ ] Tests end-to-end du flux complet
- [ ] Tests de performance
