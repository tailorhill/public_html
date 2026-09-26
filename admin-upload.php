<?php
// Bilduppladdning för katalog-admin (admin.html).
//
//   POST admin-upload.php   (multipart/form-data)
//     password : admin-lösenordet
//     kind     : "lining" | "webbing"
//     id       : materialets id (a–z, 0–9, bindestreck)
//     image    : bildfil (webp/png/jpeg)
//   → skalar och skriver en textur + en miniatyr som WebP och svarar
//     { ok:true, texture, thumb }.
//
// Foder:  textures/<id>.webp        + foder-thumb/<id>.webp
// Band:   wtex/<id>.webp            + band-thumb/<id>.webp
// Lösenordet delas med admin.php via admin-config.php.

require __DIR__ . '/admin-config.php';

const MAX_UPLOAD = 12000000;   // 12 MB källbild
const TEX_MAX    = 1024;       // längsta sida på texturen
const THUMB      = 256;        // miniatyrens sida (kvadrat)

$PATHS = [
  'lining'  => ['tex' => 'textures',   'thumb' => 'foder-thumb'],
  'webbing' => ['tex' => 'wtex',       'thumb' => 'band-thumb'],
];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') admin_json(['error' => 'method'], 405);

$ok = admin_check_pw($_POST['password'] ?? '');
if ($ok === null) admin_json(['error' => 'Admin är inte konfigurerad: sätt ADMIN_PW_SHA256 i admin-config.php.'], 503);
if (!$ok) admin_json(['error' => 'Fel lösenord.'], 401);

if (!function_exists('imagecreatefromstring') || !function_exists('imagewebp')) {
  admin_json(['error' => 'Servern saknar GD med WebP-stöd – ladda upp färdiga .webp-filer manuellt i stället.'], 501);
}

$kind = $_POST['kind'] ?? '';
if (!isset($PATHS[$kind])) admin_json(['error' => 'Okänd typ.'], 400);

$id = $_POST['id'] ?? '';
if (!preg_match('/^[a-z0-9-]{1,64}$/', $id)) admin_json(['error' => 'Ogiltigt id (endast a–z, 0–9, bindestreck).'], 400);

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) admin_json(['error' => 'Ingen fil mottogs.'], 400);
if ($_FILES['image']['size'] > MAX_UPLOAD) admin_json(['error' => 'Bilden är för stor (max 12 MB).'], 413);

$bytes = file_get_contents($_FILES['image']['tmp_name']);
if ($bytes === false) admin_json(['error' => 'Kunde inte läsa filen.'], 400);
$src = @imagecreatefromstring($bytes);
if (!$src) admin_json(['error' => 'Filen är inte en giltig bild (webp/png/jpeg).'], 400);

$sw = imagesx($src); $sh = imagesy($src);

// Skala ned proportionellt så längsta sidan blir högst TEX_MAX (aldrig upp).
function scaled($src, $sw, $sh, $maxSide) {
  $scale = min(1, $maxSide / max($sw, $sh));
  $tw = max(1, (int) round($sw * $scale)); $th = max(1, (int) round($sh * $scale));
  $dst = imagecreatetruecolor($tw, $th);
  imagecopyresampled($dst, $src, 0, 0, 0, 0, $tw, $th, $sw, $sh);
  return $dst;
}
// Centrerad kvadratisk beskärning → THUMB×THUMB.
function squareThumb($src, $sw, $sh, $side) {
  $s = min($sw, $sh); $sx = (int) (($sw - $s) / 2); $sy = (int) (($sh - $s) / 2);
  $dst = imagecreatetruecolor($side, $side);
  imagecopyresampled($dst, $src, 0, 0, $sx, $sy, $side, $side, $s, $s);
  return $dst;
}

$dir = __DIR__;
foreach (['tex', 'thumb'] as $slot) {
  $d = $dir . '/' . $PATHS[$kind][$slot];
  if (!is_dir($d)) @mkdir($d, 0755, true);
}
$texPath   = $PATHS[$kind]['tex'] . '/' . $id . '.webp';
$thumbPath = $PATHS[$kind]['thumb'] . '/' . $id . '.webp';

$tex = scaled($src, $sw, $sh, TEX_MAX);
$thb = squareThumb($src, $sw, $sh, THUMB);

$okTex = imagewebp($tex, $dir . '/' . $texPath, 82);
$okThb = imagewebp($thb, $dir . '/' . $thumbPath, 82);
imagedestroy($src); imagedestroy($tex); imagedestroy($thb);

if (!$okTex || !$okThb) admin_json(['error' => 'Kunde inte skriva bildfilerna (kontrollera skrivrättigheter).'], 500);

admin_json(['ok' => true, 'texture' => $texPath, 'thumb' => $thumbPath, 'w' => $sw, 'h' => $sh]);
