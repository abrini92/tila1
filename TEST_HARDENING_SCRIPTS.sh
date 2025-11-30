#!/bin/bash

# 🧪 Scripts de test pour les durcissements backend Tilawa
# Usage: chmod +x TEST_HARDENING_SCRIPTS.sh && ./TEST_HARDENING_SCRIPTS.sh

echo "🧪 Tests des durcissements backend Tilawa"
echo "=========================================="
echo ""

# Variables (à configurer)
API_URL="http://localhost:3000"
TOKEN=""  # À remplir après login
RECITATION_ID=""  # À remplir avec un ID valide

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
print_test() {
  echo -e "${YELLOW}Test: $1${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# ============================================
# TEST 1: Upload audio - Type invalide
# ============================================
print_test "1. Upload audio avec type MIME invalide"
echo "Création d'un fichier texte..."
echo "fake audio content" > /tmp/fake_audio.txt

if [ -z "$TOKEN" ] || [ -z "$RECITATION_ID" ]; then
  print_error "TOKEN ou RECITATION_ID non défini. Configurez les variables en haut du script."
else
  echo "Tentative d'upload..."
  RESPONSE=$(curl -s -X POST "$API_URL/api/v1/recitations/$RECITATION_ID/upload" \
    -H "Authorization: Bearer $TOKEN" \
    -F "audio=@/tmp/fake_audio.txt")
  
  if echo "$RESPONSE" | grep -q "VALIDATION_ERROR\|Invalid audio format"; then
    print_success "Upload rejeté correctement (type invalide)"
  else
    print_error "Upload non rejeté: $RESPONSE"
  fi
fi
echo ""

# ============================================
# TEST 2: Upload audio - Fichier trop grand
# ============================================
print_test "2. Upload audio avec fichier > 50 MB"
echo "Création d'un fichier de 51 MB..."
dd if=/dev/zero of=/tmp/large_audio.mp3 bs=1M count=51 2>/dev/null

if [ -z "$TOKEN" ] || [ -z "$RECITATION_ID" ]; then
  print_error "TOKEN ou RECITATION_ID non défini"
else
  echo "Tentative d'upload..."
  RESPONSE=$(curl -s -X POST "$API_URL/api/v1/recitations/$RECITATION_ID/upload" \
    -H "Authorization: Bearer $TOKEN" \
    -F "audio=@/tmp/large_audio.mp3")
  
  if echo "$RESPONSE" | grep -q "FILE_TOO_LARGE\|exceeds the maximum limit"; then
    print_success "Upload rejeté correctement (fichier trop grand)"
  else
    print_error "Upload non rejeté: $RESPONSE"
  fi
fi
echo ""

# ============================================
# TEST 3: Rate limit sur upload (6 tentatives)
# ============================================
print_test "3. Rate limit sur upload (6 tentatives)"
if [ -z "$TOKEN" ] || [ -z "$RECITATION_ID" ]; then
  print_error "TOKEN ou RECITATION_ID non défini"
else
  # Créer un petit fichier audio valide
  dd if=/dev/zero of=/tmp/test_audio.mp3 bs=1K count=100 2>/dev/null
  
  echo "Tentatives d'upload (5 autorisées, 6ème bloquée)..."
  for i in {1..6}; do
    echo -n "  Tentative $i: "
    RESPONSE=$(curl -s -X POST "$API_URL/api/v1/recitations/$RECITATION_ID/upload" \
      -H "Authorization: Bearer $TOKEN" \
      -F "audio=@/tmp/test_audio.mp3")
    
    if [ $i -le 5 ]; then
      if echo "$RESPONSE" | grep -q "success"; then
        echo "OK (autorisée)"
      else
        echo "Erreur métier (normal)"
      fi
    else
      if echo "$RESPONSE" | grep -q "UPLOAD_RATE_LIMIT_EXCEEDED"; then
        print_success "Rate limit déclenché à la 6ème tentative"
      else
        print_error "Rate limit non déclenché: $RESPONSE"
      fi
    fi
  done
fi
echo ""

# ============================================
# TEST 4: Cache Redis sur feed
# ============================================
print_test "4. Cache Redis sur feed (MISS puis HIT)"
echo "Première requête (cache MISS)..."
RESPONSE1=$(curl -s "$API_URL/api/v1/feed?page=1&pageSize=10")
CACHED1=$(echo "$RESPONSE1" | jq -r '.cached')

if [ "$CACHED1" = "false" ]; then
  print_success "Cache MISS détecté (première requête)"
else
  echo "⚠️  Cache déjà présent (requête précédente?)"
fi

echo "Attente de 1 seconde..."
sleep 1

echo "Deuxième requête (cache HIT attendu)..."
RESPONSE2=$(curl -s "$API_URL/api/v1/feed?page=1&pageSize=10")
CACHED2=$(echo "$RESPONSE2" | jq -r '.cached')

if [ "$CACHED2" = "true" ]; then
  print_success "Cache HIT détecté (deuxième requête)"
else
  print_error "Cache HIT non détecté: cached=$CACHED2"
fi
echo ""

# ============================================
# TEST 5: Performance du cache
# ============================================
print_test "5. Performance du cache (temps de réponse)"
echo "Mesure du temps de réponse sans cache..."
time curl -s "$API_URL/api/v1/feed?page=2&pageSize=10" > /dev/null

echo ""
echo "Mesure du temps de réponse avec cache..."
time curl -s "$API_URL/api/v1/feed?page=2&pageSize=10" > /dev/null
echo ""

# ============================================
# RÉSUMÉ
# ============================================
echo "=========================================="
echo "🎉 Tests terminés !"
echo ""
echo "Pour tester le rate limit sur les likes (50/heure):"
echo "  Exécutez 51 likes sur différentes récitations"
echo ""
echo "Pour tester l'invalidation du cache:"
echo "  1. Approuvez une nouvelle récitation (via worker)"
echo "  2. Vérifiez que le feed retourne cached=false"
echo ""
echo "Nettoyage des fichiers temporaires..."
rm -f /tmp/fake_audio.txt /tmp/large_audio.mp3 /tmp/test_audio.mp3
print_success "Nettoyage terminé"
