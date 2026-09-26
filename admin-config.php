<?php
// Delad konfiguration för katalog-admin (admin.php + admin-upload.php).
//
// ── SÄTT ETT LÖSENORD ─────────────────────────────────────────────────────
// Byt SÄTT-MIG mot sha256-hashen av ditt valda lösenord. Generera (byt ut):
//     printf '%s' 'ditt-lösenord' | shasum -a 256
//     node -e "console.log(require('crypto').createHash('sha256').update('ditt-lösenord').digest('hex'))"
// Tills en riktig hash är satt vägrar admin att spara/ladda upp.

const ADMIN_PW_SHA256 = 'SÄTT-MIG';

// Returnerar true/false för rätt lösenord, eller null om admin inte är
// konfigurerad (ingen giltig hash satt).
function admin_check_pw($pw) {
  if (!preg_match('/^[a-f0-9]{64}$/', ADMIN_PW_SHA256)) return null;
  return hash_equals(ADMIN_PW_SHA256, hash('sha256', (string) $pw));
}

function admin_json($data, $status = 200) {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}
