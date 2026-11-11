Add-Type -AssemblyName System.Drawing

$width = 1024
$height = 500
$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)

$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# 1. Background: Deep obsidian
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 8, 13, 20))
$g.FillRectangle($bgBrush, 0, 0, $width, $height)

# 2. Glowing atmospheric gradients
$goldColor = [System.Drawing.Color]::FromArgb(45, 255, 193, 7)
$greenColor = [System.Drawing.Color]::FromArgb(35, 16, 185, 129)
$transparent = [System.Drawing.Color]::FromArgb(0, 8, 13, 20)

# Radial gold glow on right
$pathGold = New-Object System.Drawing.Drawing2D.GraphicsPath
$pathGold.AddEllipse(600, -100, 550, 550)
$pgbGold = New-Object System.Drawing.Drawing2D.PathGradientBrush($pathGold)
$pgbGold.CenterColor = $goldColor
$pgbGold.SurroundColors = @($transparent)
$g.FillPath($pgbGold, $pathGold)

# Radial green glow on bottom-left
$pathGreen = New-Object System.Drawing.Drawing2D.GraphicsPath
$pathGreen.AddEllipse(-100, 200, 500, 500)
$pgbGreen = New-Object System.Drawing.Drawing2D.PathGradientBrush($pathGreen)
$pgbGreen.CenterColor = $greenColor
$pgbGreen.SurroundColors = @($transparent)
$g.FillPath($pgbGreen, $pathGreen)

# 3. Subtle grid lines
$gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(12, 255, 255, 255), 1)
for ($x = 0; $x -lt $width; $x += 40) {
    $g.DrawLine($gridPen, $x, 0, $x, $height)
}
for ($y = 0; $y -lt $height; $y += 40) {
    $g.DrawLine($gridPen, 0, $y, $width, $y)
}

# 4. Left Column Branding
# Category Pill
$pillBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 255, 193, 7))
$pillBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, 255, 193, 7), 1)
$pillRect = New-Object System.Drawing.Rectangle(56, 52, 240, 32)
$g.FillRectangle($pillBg, $pillRect)
$g.DrawRectangle($pillBorder, $pillRect)

$pillFont = New-Object System.Drawing.Font("Arial", 10, [System.Drawing.FontStyle]::Bold)
$pillTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 193, 7))
$g.DrawString("VERIFIED DAILY CARPOOLING", $pillFont, $pillTextBrush, 68, 59)

# App Title: SHARE2GO
$titleFont = New-Object System.Drawing.Font("Trebuchet MS", 48, [System.Drawing.FontStyle]::Bold)
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$goldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 193, 7))

$g.DrawString("SHARE", $titleFont, $whiteBrush, 52, 92)
$sizeShare = $g.MeasureString("SHARE", $titleFont)
$g.DrawString("2GO", $titleFont, $goldBrush, (52 + $sizeShare.Width - 10), 92)

# Tagline
$subFont = New-Object System.Drawing.Font("Arial", 14, [System.Drawing.FontStyle]::Bold)
$subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 226, 232, 240))
$g.DrawString("Share Empty Seats. Split Costs. Commute Safely.", $subFont, $subBrush, 56, 172)

$descFont = New-Object System.Drawing.Font("Arial", 11.5, [System.Drawing.FontStyle]::Regular)
$descBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
$g.DrawString("Connect with verified colleagues & commuters on your daily route.", $descFont, $descBrush, 56, 202)

# Feature Badges
function DrawBadge($text, $x, $y, $w, $h, $iconColor) {
    $bBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 20, 30, 48))
    $bBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 70, 95, 130), 1.2)
    $g.FillRectangle($bBg, $x, $y, $w, $h)
    $g.DrawRectangle($bBorder, $x, $y, $w, $h)

    $dotBrush = New-Object System.Drawing.SolidBrush($iconColor)
    $g.FillEllipse($dotBrush, ($x + 12), ($y + ($h / 2) - 4), 8, 8)

    $f = New-Object System.Drawing.Font("Arial", 10.5, [System.Drawing.FontStyle]::Bold)
    $tBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 241, 245, 249))
    $g.DrawString($text, $f, $tBrush, ($x + 28), ($y + 8))
}

DrawBadge "100% Govt ID & Corporate Verified" 56 250 290 36 ([System.Drawing.Color]::FromArgb(255, 16, 185, 129))
DrawBadge "Save Up To 70% Monthly Fuel Costs" 356 250 280 36 ([System.Drawing.Color]::FromArgb(255, 255, 193, 7))

DrawBadge "Private In-App Encrypted Calling" 56 298 270 36 ([System.Drawing.Color]::FromArgb(255, 59, 130, 246))
DrawBadge "Exclusive Women-Only Commute Mode" 336 298 300 36 ([System.Drawing.Color]::FromArgb(255, 236, 72, 153))

DrawBadge "Live GPS Tracking & Instant SOS" 56 346 260 36 ([System.Drawing.Color]::FromArgb(255, 239, 68, 68))
DrawBadge "Zero Surge & Fair Transparent Split" 326 346 290 36 ([System.Drawing.Color]::FromArgb(255, 16, 185, 129))

# 5. Right Column: Brand Pin Logo Card
$logoPath = "C:\Users\SIRI\.gemini\antigravity\brain\5c02b4f5-3492-4cdb-9e00-7ee6cf1e412a\.user_uploaded\media_1794429614651_93627ca8.jpg"
if (Test-Path $logoPath) {
    $logoImg = [System.Drawing.Image]::FromFile($logoPath)

    # Outer Card
    $cardBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240, 13, 20, 32))
    $cardBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 255, 193, 7), 2.5)
    $g.FillRectangle($cardBg, 680, 100, 270, 280)
    $g.DrawRectangle($cardBorder, 680, 100, 270, 280)

    # Logo Image
    $g.DrawImage($logoImg, 715, 120, 200, 200)

    # Card Bottom Label
    $cFont = New-Object System.Drawing.Font("Arial", 11, [System.Drawing.FontStyle]::Bold)
    $cBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 193, 7))
    $cText = "SMART COMMUTE"
    $cSize = $g.MeasureString($cText, $cFont)
    $g.DrawString($cText, $cFont, $cBrush, (680 + (270 - $cSize.Width) / 2), 336)

    $logoImg.Dispose()
}

# 6. Save image
$outDir = "store_assets\android"
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force
}
$outPng = "store_assets\android\feature_graphic.png"
$brainPng = "C:\Users\SIRI\.gemini/antigravity\brain\5c02b4f5-3492-4cdb-9e00-7ee6cf1e412a\feature_graphic.png"

$bmp.Save($outPng, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save($brainPng, [System.Drawing.Imaging.ImageFormat]::Png)

Write-Host "✅ Feature Graphic successfully created at: $outPng"
Write-Host "Width: $($bmp.Width) px, Height: $($bmp.Height) px"

$g.Dispose()
$bmp.Dispose()

