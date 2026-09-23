<?php
// Kort designlänk för Valley Dogs designverktyg.
//
//   POST d.php   (fält 'd' = designens base64url-sträng, samma som #d=)
//        → svar: { "code": "xxxxxxxxxx" }
//   GET  d.php?c=<code>
//        → 302-redirect till /?supplier=1#d=<payload> (öppnar leverantörsvyn)
//
// Innehållsadresserat: koden = sha256(payload) trunkerad, så samma design ger
// alltid samma kod och en design kan aldrig skriva över en annan. Ingen databas
// behövs – designerna sparas som filer i mappen designs/.

$DIR = __DIR__ . '/designs';
$LEN = 10;      // kodlängd (hex)
$MAX = 4000;    // max payload-längd

function out_json($data, $status = 200) {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($data);
  exit;
}

$valid = '/^[A-Za-z0-9_\-]{1,' . $MAX . '}$/';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  // Hämta payload från form-fält 'd', annars raw body ({"d":..} eller "d=..").
  $payload = isset($_POST['d']) ? $_POST['d'] : '';
  if ($payload === '') {
    $raw = trim(file_get_contents('php://input'));
    if ($raw !== '' && $raw[0] === '{') { $j = json_decode($raw, true); if (isset($j['d'])) $payload = $j['d']; }
    elseif (strncmp($raw, 'd=', 2) === 0) { $payload = urldecode(substr($raw, 2)); }
    else { $payload = $raw; }
  }
  $payload = trim($payload);
  if (!preg_match($valid, $payload)) out_json(['error' => 'bad payload'], 400);

  if (!is_dir($DIR)) @mkdir($DIR, 0755, true);
  if (!is_dir($DIR)) out_json(['error' => 'storage unavailable'], 500);
  // skydda mappen mot listning/direktåtkomst (PHP läser filerna server-side)
  $ht = $DIR . '/.htaccess';
  if (!file_exists($ht)) {
    @file_put_contents($ht,
      "Options -Indexes\n" .
      "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n" .
      "<IfModule !mod_authz_core.c>\n  Deny from all\n</IfModule>\n");
  }

  $code = substr(hash('sha256', $payload), 0, $LEN);
  $file = $DIR . '/' . $code . '.txt';
  if (!file_exists($file)) {
    if (@file_put_contents($file, $payload) === false) out_json(['error' => 'write failed'], 500);
  }
  out_json(['code' => $code]);
}

// GET → lös upp koden och skicka vidare till verktyget i leverantörsvyn
$code = isset($_GET['c']) ? $_GET['c'] : '';
if (!preg_match('/^[a-f0-9]{' . $LEN . '}$/', $code)) out_json(['error' => 'bad code'], 404);
$file = $DIR . '/' . $code . '.txt';
if (!is_file($file)) out_json(['error' => 'not found'], 404);
$payload = trim(file_get_contents($file));
if (!preg_match($valid, $payload)) out_json(['error' => 'corrupt'], 500);
header('Cache-Control: no-store');
header('Location: /?supplier=1#d=' . $payload);
http_response_code(302);
exit;
