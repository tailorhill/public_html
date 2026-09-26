<?php
// Bild- och typsnittsuppladdning för katalog-admin (admin.html).
//
//   POST admin-upload.php   (multipart/form-data)
//     password : admin-lösenordet
//     kind     : "lining" | "webbing" | "font"
//     id       : materialets/typsnittets id (a–z, 0–9, bindestreck)
//     image    : bild (lining/webbing) eller fontfil (font)
//
//   Bild → skalar och skriver textur + miniatyr som WebP:
//     Foder:  textures/<id>.webp        + foder-thumb/<id>.webp
//     Band:   wtex/<id>.webp            + band-thumb/<id>.webp
//   Font → skriver fontfilen till fonts/<id>.ttf|otf (för både förhandsvisning
//     via @font-face och skärfilernas opentype.js).
//
// Lösenordet delas med admin.php via admin-config.php.

require __DIR__ . '/admin-config.php';

const MAX_UPLOAD = 12000000;   // 12 MB källbild
const MAX_FONT   = 6000000;    // 6 MB fontfil
const TEX_MAX    = 1024;       // längsta sida på texturen
const THUMB      = 256;        // miniatyrens sida (kvadrat)

$IMG_PATHS = [
  'lining'  => ['tex' => 'textures', 'thumb' => 'foder-thumb'],
  'webbing' => ['tex' => 'wtex',     'thumb' => 'band-thumb'],
];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') admin_json(['error' => 'method'], 405);

$ok = admin_check_pw($_POST['password'] ?? '');
if ($ok === null) admin_json(['error' => 'Admin är inte konfigurerad: sätt ADMIN_PW_SHA256 i admin-config.php.'], 503);
if (!$ok) admin_json(['error' => 'Fel lösenord.'], 401);

$kind = $_POST['kind'] ?? '';
$id = $_POST['id'] ?? '';
if (!preg_match('/^[a-z0-9-]{1,64}$/', $id)) admin_json(['error' => 'Ogiltigt id (endast a–z, 0–9, bindestreck).'], 400);

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) admin_json(['error' => 'Ingen fil mottogs.'], 400);
$tmp = $_FILES['image']['tmp_name'];

// ─────────────────────────────────────────────────────── typsnitt (font)
if ($kind === 'font') {
  if ($_FILES['image']['size'] > MAX_FONT) admin_json(['error' => 'Fontfilen är för stor (max 6 MB).'], 413);
  $head = file_get_contents($tmp, false, null, 0, 4);
  $sig = bin2hex($head);
  $okSig = in_array($sig, ['00010000', '74727565', '74746366']) || $head === 'OTTO';  // ttf, 'true', 'ttcf', otf
  if (!$okSig) admin_json(['error' => 'Filen verkar inte vara ett TTF/OTF-typsnitt (woff/woff2 stöds inte – exportera som TTF).'], 400);
  $ext = ($head === 'OTTO') ? 'otf' : 'ttf';
  $file = 'fonts/' . $id . '.' . $ext;
  $dir = __DIR__ . '/fonts';
  if (!is_dir($dir)) @mkdir($dir, 0755, true);
  if (!@move_uploaded_file($tmp, __DIR__ . '/' . $file)) {
    if (!@copy($tmp, __DIR__ . '/' . $file)) admin_json(['error' => 'Kunde inte skriva fontfilen (kontrollera skrivrättigheter).'], 500);
  }
  admin_json(['ok' => true, 'ttf' => $id . '.' . $ext]);
}

// ─────────────────────────────────────────────────────── bild (lining/webbing)
if (!isset($IMG_PATHS[$kind])) admin_json(['error' => 'Okänd typ.'], 400);
if (!function_exists('imagecreatefromstring') || !function_exists('imagewebp')) {
  admin_json(['error' => 'Servern saknar GD med WebP-stöd – ladda upp färdiga .webp-filer manuellt i stället.'], 501);
}
if ($_FILES['image']['size'] > MAX_UPLOAD) admin_json(['error' => 'Bilden är för stor (max 12 MB).'], 413);

$bytes = file_get_contents($tmp);
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
  $d = $dir . '/' . $IMG_PATHS[$kind][$slot];
  if (!is_dir($d)) @mkdir($d, 0755, true);
}
$texPath   = $IMG_PATHS[$kind]['tex'] . '/' . $id . '.webp';
$thumbPath = $IMG_PATHS[$kind]['thumb'] . '/' . $id . '.webp';

$tex = scaled($src, $sw, $sh, TEX_MAX);
$thb = squareThumb($src, $sw, $sh, THUMB);
$okTex = imagewebp($tex, $dir . '/' . $texPath, 82);
$okThb = imagewebp($thb, $dir . '/' . $thumbPath, 82);
imagedestroy($src); imagedestroy($tex); imagedestroy($thb);

if (!$okTex || !$okThb) admin_json(['error' => 'Kunde inte skriva bildfilerna (kontrollera skrivrättigheter).'], 500);

admin_json(['ok' => true, 'texture' => $texPath, 'thumb' => $thumbPath, 'w' => $sw, 'h' => $sh]);
