# Generate Store Previews Contact Sheets (4x2 Grid)
Add-Type -AssemblyName System.Drawing

function Create-PreviewComposite([string]$Platform, [string]$SourceDir, [string]$OutFile, [string]$TitleText) {
    $cols = 4
    $rows = 2
    $padding = 50
    $headerHeight = 160
    
    # Load first image to get aspect ratio
    $firstImg = [System.Drawing.Image]::FromFile("$SourceDir\screenshot_01.png")
    $srcW = $firstImg.Width
    $srcH = $firstImg.Height
    $firstImg.Dispose()

    # Target thumbnail size
    $thumbW = 420
    $thumbH = [int]($thumbW * ($srcH / $srcW))

    $canvasW = [int](($cols * $thumbW) + (($cols + 1) * $padding))
    $canvasH = [int]($headerHeight + ($rows * $thumbH) + (($rows + 1) * $padding))

    $bmp = New-Object System.Drawing.Bitmap($canvasW, $canvasH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    # Dark Luxury Background
    $cBg1 = [System.Drawing.ColorTranslator]::FromHtml("#080C14")
    $cBg2 = [System.Drawing.ColorTranslator]::FromHtml("#0F172A")
    $cGold = [System.Drawing.ColorTranslator]::FromHtml("#FFC107")
    $cWhite = [System.Drawing.ColorTranslator]::FromHtml("#FFFFFF")
    $cMuted = [System.Drawing.ColorTranslator]::FromHtml("#94A3B8")

    $pt1 = New-Object System.Drawing.PointF(0, 0)
    $pt2 = New-Object System.Drawing.PointF(0, $canvasH)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($pt1, $pt2, $cBg1, $cBg2)
    $g.FillRectangle($bgBrush, 0, 0, $canvasW, $canvasH)
    $bgBrush.Dispose()

    # Header Title
    $titleFont = New-Object System.Drawing.Font("Segoe UI", 34, [System.Drawing.FontStyle]::Bold)
    $subFont = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Regular)
    $goldBrush = New-Object System.Drawing.SolidBrush($cGold)
    $whiteBrush = New-Object System.Drawing.SolidBrush($cWhite)
    $mutedBrush = New-Object System.Drawing.SolidBrush($cMuted)
    $sfCenter = New-Object System.Drawing.StringFormat
    $sfCenter.Alignment = [System.Drawing.StringAlignment]::Center

    $g.DrawString("✦  SHARE2GO  ✦", (New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)), $goldBrush, [float]($canvasW / 2), 25, $sfCenter)
    $g.DrawString($TitleText, $titleFont, $whiteBrush, [float]($canvasW / 2), 60, $sfCenter)
    $subSpec = if ($Platform -eq "android") { "8 Individual Screenshots • 1080 × 1920 px (16:9) • Verified Store Collection" } else { "8 Individual Screenshots • 1290 × 2796 px (6.7"" Super Retina XDR) • Verified Store Collection" }
    $g.DrawString($subSpec, $subFont, $mutedBrush, [float]($canvasW / 2), 115, $sfCenter)

    # Draw 8 thumbnails
    for ($i = 1; $i -le 8; $i++) {
        $idx = $i - 1
        $col = $idx % $cols
        $row = [Math]::Floor($idx / $cols)

        $x = $padding + ($col * ($thumbW + $padding))
        $y = $headerHeight + $padding + ($row * ($thumbH + $padding))

        # Soft drop shadow
        $sPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40, 0, 0, 0), 12)
        $g.DrawRectangle($sPen, $x - 4, $y + 6, $thumbW + 8, $thumbH + 8)
        $sPen.Dispose()

        $num = "{0:D2}" -f $i
        $imgPath = "$SourceDir\screenshot_$num.png"
        $img = [System.Drawing.Image]::FromFile($imgPath)
        $g.DrawImage($img, $x, $y, $thumbW, $thumbH)
        $img.Dispose()

        # Outline border
        $bPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#334155"), 2)
        $g.DrawRectangle($bPen, $x, $y, $thumbW, $thumbH)
        $bPen.Dispose()
    }

    $bmp.Save($OutFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created Preview Composite: $OutFile ($canvasW x $canvasH)"
}

Create-PreviewComposite -Platform "android" -SourceDir "d:\node_projects\SHARE2GO\store_assets\android" -OutFile "d:\node_projects\SHARE2GO\store_assets\previews\android_preview.png" -TitleText "Google Play Store Official Screenshots"
Create-PreviewComposite -Platform "ios" -SourceDir "d:\node_projects\SHARE2GO\store_assets\ios" -OutFile "d:\node_projects\SHARE2GO\store_assets\previews\ios_preview.png" -TitleText "Apple App Store Official Screenshots (iPhone 15/16 Pro Max)"

