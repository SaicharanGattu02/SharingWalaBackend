Add-Type -AssemblyName System.Drawing

$width = 1024
$height = 500
$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)

$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Helper: Rounded Rectangle
function DrawRoundedRect($graphics, $brush, $pen, [float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $path.CloseFigure()

    if ($brush -ne $null) { $graphics.FillPath($brush, $path) }
    if ($pen -ne $null) { $graphics.DrawPath($pen, $path) }
}

# 1. Base Background: Deep Modern Midnight
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 10, 14, 23))
$g.FillRectangle($bgBrush, 0, 0, $width, $height)

# 2. Ambient Lighting Gradients
# Soft golden glow focused behind the logo on the right
$pathGold = New-Object System.Drawing.Drawing2D.GraphicsPath
$pathGold.AddEllipse(560, 40, 420, 420)
$pgbGold = New-Object System.Drawing.Drawing2D.PathGradientBrush($pathGold)
$pgbGold.CenterColor = [System.Drawing.Color]::FromArgb(60, 255, 184, 0)
$pgbGold.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 10, 14, 23))
$g.FillPath($pgbGold, $pathGold)

# Soft emerald glow on bottom left
$pathEmerald = New-Object System.Drawing.Drawing2D.GraphicsPath
$pathEmerald.AddEllipse(-100, 200, 480, 480)
$pgbEmerald = New-Object System.Drawing.Drawing2D.PathGradientBrush($pathEmerald)
$pgbEmerald.CenterColor = [System.Drawing.Color]::FromArgb(35, 16, 185, 129)
$pgbEmerald.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 10, 14, 23))
$g.FillPath($pgbEmerald, $pathEmerald)

# 3. Clean Subtle Grid Pattern
$dotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(16, 255, 255, 255))
for ($dx = 36; $dx -lt $width; $dx += 36) {
    for ($dy = 25; $dy -lt $height; $dy += 36) {
        $g.FillEllipse($dotBrush, $dx, $dy, 2, 2)
    }
}

# 4. Left Section: Clean, Authoritative Branding
# Top Pill
$pillBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(32, 255, 184, 0))
$pillBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 255, 184, 0), 1.2)
DrawRoundedRect $g $pillBg $pillBorder 64 64 260 32 16

$pillDot = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 184, 0))
$g.FillEllipse($pillDot, 80, 75, 8, 8)

$pillFont = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Bold)
$pillTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 184, 0))
$g.DrawString("VERIFIED COMMUNITY CARPOOL", $pillFont, $pillTextBrush, 96, 70)

# Brand Name: "SharingWala"
$brandFont = New-Object System.Drawing.Font("Segoe UI", 56, [System.Drawing.FontStyle]::Bold)
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$goldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 184, 0))

$g.DrawString("Sharing", $brandFont, $whiteBrush, 58, 112)
$sizeSharing = $g.MeasureString("Sharing", $brandFont)
$g.DrawString("Wala", $brandFont, $goldBrush, (58 + $sizeSharing.Width - 16), 112)

# Subtitle & Value Proposition
$subFont = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Bold)
$subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 241, 245, 249))
$g.DrawString("Daily Office Commute & Rideshare", $subFont, $subBrush, 64, 206)

$descFont = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Regular)
$descBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 156, 163, 175))
$g.DrawString("Share empty seats, split fuel costs & commute safely every day.", $descFont, $descBrush, 64, 244)

# 4 Core Value Chips (Spacious & Clean)
function DrawCleanChip($icon, $title, [float]$x, [float]$y, [float]$w, [float]$h, $dotColor) {
    $cBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 18, 24, 38))
    $cBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, 55, 65, 85), 1.2)
    DrawRoundedRect $g $cBg $cBorder $x $y $w $h 12

    # Dot indicator
    $dBrush = New-Object System.Drawing.SolidBrush($dotColor)
    $g.FillEllipse($dBrush, ($x + 14), ($y + ($h / 2) - 4), 8, 8)

    $f = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
    $tb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 226, 232, 240))
    $g.DrawString($title, $f, $tb, ($x + 30), ($y + 9))
}

$cGold = [System.Drawing.Color]::FromArgb(255, 255, 184, 0)
$cGreen = [System.Drawing.Color]::FromArgb(255, 16, 185, 129)
$cBlue = [System.Drawing.Color]::FromArgb(255, 59, 130, 246)
$cPink = [System.Drawing.Color]::FromArgb(255, 244, 63, 94)

DrawCleanChip "•" "100% Verified Profiles" 64 300 230 40 $cGreen
DrawCleanChip "•" "Save Up To 70% Fuel" 306 300 230 40 $cGold

DrawCleanChip "•" "Private In-App Calling" 64 352 230 40 $cBlue
DrawCleanChip "•" "Women-Only Option" 306 352 230 40 $cPink

# 5. Right Section: PURE LOGO FOCUS (No Clutter, Clean & Prominent)
$logoPath = "C:\Users\SIRI\.gemini\antigravity\brain\5c02b4f5-3492-4cdb-9e00-7ee6cf1e412a\.user_uploaded\media_1794429614651_93627ca8.jpg"
if (Test-Path $logoPath) {
    $logoImg = [System.Drawing.Image]::FromFile($logoPath)

    # Logo Card Dimensions
    $cardW = 310
    $cardH = 310
    $cardX = 640
    $cardY = 95

    # Multi-layered Soft Drop Shadow
    $shadowBrush1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(120, 0, 0, 0))
    DrawRoundedRect $g $shadowBrush1 $null ($cardX + 10) ($cardY + 16) $cardW $cardH 48

    $shadowBrush2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 255, 184, 0))
    DrawRoundedRect $g $shadowBrush2 $null ($cardX - 4) ($cardY - 4) ($cardW + 8) ($cardH + 8) 50

    # Modern App Icon Card Body
    $cardBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 16, 22, 35))
    $cardBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 255, 184, 0), 2.5)
    DrawRoundedRect $g $cardBg $cardBorder $cardX $cardY $cardW $cardH 46

    # Logo Image placed cleanly and centered inside
    $imgPadding = 24
    $imgSize = $cardW - ($imgPadding * 2)
    $g.DrawImage($logoImg, ($cardX + $imgPadding), ($cardY + $imgPadding), $imgSize, $imgSize)

    $logoImg.Dispose()
}

# 6. Save image to store_assets and brain directory
$outPng = "store_assets\android\feature_graphic.png"
$brainPng = "C:\Users\SIRI\.gemini\antigravity\brain\5c02b4f5-3492-4cdb-9e00-7ee6cf1e412a\feature_graphic.png"

$bmp.Save($outPng, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save($brainPng, [System.Drawing.Imaging.ImageFormat]::Png)

Write-Host "✅ Minimalist SharingWala Feature Graphic generated: $outPng"
Write-Host "Dimensions: $($bmp.Width) x $($bmp.Height) px"

$g.Dispose()
$bmp.Dispose()
