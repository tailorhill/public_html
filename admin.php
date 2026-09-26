<?php
// Spar-endpoint för Valley Dogs katalog-admin (admin.html).
//
//   POST admin.php   { "password": "...", "catalog": { ...hela katalogen... } }
//        → validerar lösenord + katalog, säkerhetskopierar nuvarande data.json
//          och skriver den nya. Svar: { "ok": true, "backup": "data-...json" }
//
// Ingen databas – samma filbaserade mönster som d.php. Endast skrivning kräver
// lösenord; data.json är ändå publik (verktyget läser den).
//
// ── INNAN DEN ANVÄNDS: sätt ett lösenord ──────────────────────────────────
// Byt ADMIN_PW_SHA256 nedan mot sha256-hashen av ditt valda lösenord.
// Generera hashen (byt ut lösenordet):
//     macOS/Linux:  printf '%s' 'ditt-lösenord' | shasum -a 256
//     Node:         node -e "console.log(require('crypto').createHash('sha256').update('ditt-lösenord').digest('hex'))"
// Tills en riktig hash är satt vägrar endpointen att spara.

const ADMIN_PW_SHA256 = 'SÄTT-MIG';   // ← klistra in sha256-hex här

$TARGET = __DIR__ . '/data.json';
$BKDIR  = __DIR__ . '/data-backups';
$MAX    = 2000000;   // 2 MB tak på inskickad katalog
$KEEP   = 30;        // antal säkerhetskopior att behålla

function out($data, $status = 200) {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(['error' => 'method'], 405);

if (!preg_match('/^[a-f0-9]{64}$/', ADMIN_PW_SHA256)) {
  out(['error' => 'Admin är inte konfigurerad: sätt ADMIN_PW_SHA256 i admin.php.'], 503);
}

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > $MAX) out(['error' => 'För stor eller tom begäran.'], 413);
$req = json_decode($raw, true);
if (!is_array($req)) out(['error' => 'Ogiltig JSON.'], 400);

// ── lösenord ──
$pw = isset($req['password']) ? (string) $req['password'] : '';
if (!hash_equals(ADMIN_PW_SHA256, hash('sha256', $pw))) out(['error' => 'Fel lösenord.'], 401);

// ── katalog-validering ──
$cat = isset($req['catalog']) ? $req['catalog'] : null;
if (!is_array($cat)) out(['error' => 'Ingen katalog.'], 400);

$LISTS = ['biothaneColors','webbingColors','textLayouts','textSizes','dubbelPositions',
  'liningGroups','textColors','fonts','symbols','hardwareFinishes','symbolPlacements',
  'cottonModels','cottonWidths'];
$OBJS = ['biothane','leatherSurcharge','productUrls'];

$errors = [];
foreach ($LISTS as $k) {
  if (!array_key_exists($k, $cat)) { $errors[] = "Saknar listan \"$k\"."; continue; }
  if (!is_array($cat[$k]) || (count($cat[$k]) && array_keys($cat[$k]) !== range(0, count($cat[$k]) - 1))) {
    $errors[] = "\"$k\" måste vara en lista."; continue;
  }
  if (!count($cat[$k])) { $errors[] = "\"$k\" får inte vara tom."; continue; }
  // id-krav + unika id:n (liningGroups är grupperad → hoppa id-kravet där)
  if ($k === 'liningGroups') continue;
  $seen = [];
  foreach ($cat[$k] as $i => $row) {
    if (!is_array($row) || !isset($row['id']) || !is_string($row['id']) || $row['id'] === '') {
      $errors[] = "\"$k\" rad " . ($i + 1) . " saknar id."; continue;
    }
    if (isset($seen[$row['id']])) $errors[] = "\"$k\": id \"{$row['id']}\" förekommer flera gånger.";
    $seen[$row['id']] = true;
    if (isset($row['hex']) && !preg_match('/^#[0-9a-fA-F]{3,8}$/', $row['hex'])) {
      $errors[] = "\"$k\" rad " . ($i + 1) . ": ogiltig hex \"{$row['hex']}\".";
    }
  }
}
foreach ($OBJS as $k) {
  if (!isset($cat[$k]) || !is_array($cat[$k])) $errors[] = "Saknar \"$k\".";
}
if (count($errors)) out(['error' => 'Validering misslyckades.', 'details' => array_slice($errors, 0, 20)], 422);

// ── säkerhetskopiera nuvarande data.json ──
if (!is_dir($BKDIR)) @mkdir($BKDIR, 0755, true);
if (is_dir($BKDIR)) {
  $ht = $BKDIR . '/.htaccess';
  if (!file_exists($ht)) @file_put_contents($ht,
    "Options -Indexes\n<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n" .
    "<IfModule !mod_authz_core.c>\n  Deny from all\n</IfModule>\n");
}
$backupName = null;
if (is_file($TARGET) && is_dir($BKDIR)) {
  $backupName = 'data-' . date('Ymd-His') . '.json';
  @copy($TARGET, $BKDIR . '/' . $backupName);
  // rensa gamla kopior (behåll de senaste KEEP)
  $old = glob($BKDIR . '/data-*.json');
  if ($old && count($old) > $KEEP) {
    usort($old, fn($a, $b) => filemtime($a) <=> filemtime($b));
    foreach (array_slice($old, 0, count($old) - $KEEP) as $f) @unlink($f);
  }
}

// ── skriv atomiskt (temp + rename) ──
$json = json_encode($cat, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($json === false) out(['error' => 'Kunde inte serialisera katalogen.'], 500);
$tmp = $TARGET . '.tmp';
if (@file_put_contents($tmp, $json) === false || !@rename($tmp, $TARGET)) {
  @unlink($tmp);
  out(['error' => 'Kunde inte skriva data.json (kontrollera skrivrättigheter).'], 500);
}

out(['ok' => true, 'backup' => $backupName, 'bytes' => strlen($json)]);
