# SHARE2GO Official Store Screenshot Generator
# Strong Types & High-Fidelity 4K Vector Graphics

Add-Type -AssemblyName System.Drawing

function Get-Color([string]$hex) {
    return [System.Drawing.ColorTranslator]::FromHtml($hex)
}

function Create-RoundedRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = ([Math]::Max(2.0, $r * 2.0))
    if ($d -gt $w) { $d = $w }
    if ($d -gt $h) { $d = $h }
    $path.AddArc($x, $y, $d, $d, [float]180, [float]90)
    $path.AddArc($x + $w - $d, $y, $d, $d, [float]270, [float]90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, [float]0, [float]90)
    $path.AddArc($x, $y + $h - $d, $d, $d, [float]90, [float]90)
    $path.CloseFigure()
    return $path
}

function Fill-RoundedRect($g, $brush, [float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $path = Create-RoundedRectPath $x $y $w $h $r
    $g.FillPath($brush, $path)
    $path.Dispose()
}

function Draw-RoundedRect($g, $pen, [float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $path = Create-RoundedRectPath $x $y $w $h $r
    $g.DrawPath($pen, $path)
    $path.Dispose()
}

$fontName = "Segoe UI"
$testFont = New-Object System.Drawing.Font($fontName, 12)
if ($testFont.Name -ne $fontName) {
    $fontName = "Arial"
}
$testFont.Dispose()

function Render-Screenshot {
    param (
        [int]$ScreenIndex,
        [string]$Platform, # "android" or "ios"
        [int]$Width,
        [int]$Height,
        [string]$OutputPath
    )

    $bmp = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $cBg1 = Get-Color "#080C14"
    $cBg2 = Get-Color "#0F172A"
    $cGold = Get-Color "#FFC107"
    $cGoldDark = Get-Color "#D97706"
    $cEmerald = Get-Color "#059669"
    $cSapphire = Get-Color "#2563EB"
    $cWhite = Get-Color "#FFFFFF"
    $cMuted = Get-Color "#94A3B8"
    $cCardDark = Get-Color "#151D2A"
    $cCardBorder = Get-Color "#263346"

    # Base Background Gradient
    $pt1 = New-Object System.Drawing.PointF(0, 0)
    $pt2 = New-Object System.Drawing.PointF(0, $Height)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($pt1, $pt2, $cBg1, $cBg2)
    $g.FillRectangle($bgBrush, 0, 0, $Width, $Height)
    $bgBrush.Dispose()

    # Ambient Accent Radial Glow behind phone
    $accentGlowColor = switch ($ScreenIndex) {
        1 { [System.Drawing.Color]::FromArgb(60, 255, 193, 7) }  # Amber Gold
        2 { [System.Drawing.Color]::FromArgb(60, 5, 150, 105) }  # Emerald
        3 { [System.Drawing.Color]::FromArgb(60, 37, 99, 235) }  # Sapphire
        4 { [System.Drawing.Color]::FromArgb(65, 239, 68, 68) }  # Red SOS
        5 { [System.Drawing.Color]::FromArgb(65, 37, 211, 102) } # WhatsApp Call
        6 { [System.Drawing.Color]::FromArgb(60, 79, 70, 229) }  # Indigo
        7 { [System.Drawing.Color]::FromArgb(65, 245, 158, 11) } # Amber
        8 { [System.Drawing.Color]::FromArgb(65, 6, 182, 212) }  # Cyan/Teal
        Default { [System.Drawing.Color]::FromArgb(50, 255, 193, 7) }
    }

    $glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $glowRect = New-Object System.Drawing.RectangleF(($Width * 0.1), ($Height * 0.35), ($Width * 0.8), ($Height * 0.55))
    $glowPath.AddEllipse($glowRect)
    $pghBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath)
    $pghBrush.CenterColor = $accentGlowColor
    $pghBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    $g.FillPath($pghBrush, $glowPath)
    $pghBrush.Dispose()
    $glowPath.Dispose()

    # Brand badge at the top
    $brandFont = New-Object System.Drawing.Font($fontName, ($Width * 0.022), [System.Drawing.FontStyle]::Bold)
    $brandBrush = New-Object System.Drawing.SolidBrush($cGold)
    $sfCenter = New-Object System.Drawing.StringFormat
    $sfCenter.Alignment = [System.Drawing.StringAlignment]::Center

    $topLogoY = ($Height * 0.045)
    $g.DrawString("✦  S H A R E 2 G O  ✦", $brandFont, $brandBrush, ($Width / 2.0), $topLogoY, $sfCenter)
    $brandBrush.Dispose()
    $brandFont.Dispose()

    # Marketing Headlines and Subcaptions
    $headlineText = ""
    $subcaptionText = ""

    switch ($ScreenIndex) {
        1 {
            $headlineText = "Share Rides. Split Costs."
            $subcaptionText = "Smart daily carpooling & bikepooling for modern commuters."
        }
        2 {
            $headlineText = "Find Your Perfect Route"
            $subcaptionText = "Real-time route matching with verified co-passengers in seconds."
        }
        3 {
            $headlineText = "Turn Empty Seats into Savings"
            $subcaptionText = "Publish your daily route, set fares & offset fuel expenses."
        }
        4 {
            $headlineText = "Live GPS Tracking & Shake SOS"
            $subcaptionText = "Turn-by-turn navigation, secure ride OTPs & instant emergency safety."
        }
        5 {
            $headlineText = "Crystal-Clear In-App Calling"
            $subcaptionText = "End-to-end encrypted VoIP calls without sharing personal phone numbers."
        }
        6 {
            $headlineText = "Seamless In-Ride Messaging"
            $subcaptionText = "Coordinate pickup spots with instant chat and smart quick replies."
        }
        7 {
            $headlineText = "Connect with Travel Buddies"
            $subcaptionText = "Discover verified commuters matching your route and travel vibe."
        }
        8 {
            $headlineText = "100% Verified Trust & Safety"
            $subcaptionText = "Govt ID & DL verification, corporate commuter clubs & total peace of mind."
        }
    }

    # Draw Headline
    $headlineSize = ($Width * 0.052)
    $hlFont = New-Object System.Drawing.Font($fontName, $headlineSize, [System.Drawing.FontStyle]::Bold)
    $hlBrush = New-Object System.Drawing.SolidBrush($cWhite)
    $hlY = ($Height * 0.078)
    $hlRect = New-Object System.Drawing.RectangleF(($Width * 0.05), $hlY, ($Width * 0.90), ($Height * 0.07))
    $g.DrawString($headlineText, $hlFont, $hlBrush, $hlRect, $sfCenter)
    $hlBrush.Dispose()
    $hlFont.Dispose()

    # Draw Subcaption
    $subSize = ($Width * 0.026)
    $subFont = New-Object System.Drawing.Font($fontName, $subSize, [System.Drawing.FontStyle]::Regular)
    $subBrush = New-Object System.Drawing.SolidBrush($cMuted)
    $subY = ($Height * 0.138)
    $subRect = New-Object System.Drawing.RectangleF(($Width * 0.07), $subY, ($Width * 0.86), ($Height * 0.05))
    $g.DrawString($subcaptionText, $subFont, $subBrush, $subRect, $sfCenter)
    $subBrush.Dispose()
    $subFont.Dispose()

    # ==========================================
    # Realistic Phone Mockup Frame
    # ==========================================
    $phoneW = ($Width * 0.82)
    $phoneH = ($Height * 0.82)
    $phoneX = (($Width - $phoneW) / 2.0)
    $phoneY = ($Height * 0.20)
    $phoneRadius = ($Width * 0.075)

    # 3D Drop Shadow behind phone
    for ($s = 12; $s -ge 1; $s--) {
        $shadowAlpha = [int](22 / $s)
        $sPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb($shadowAlpha, 0, 0, 0), ($s * 2.5))
        $sPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
        $sPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
        Draw-RoundedRect $g $sPen ($phoneX - $s) ($phoneY + ($s * 1.5)) ($phoneW + ($s * 2)) ($phoneH + ($s * 2)) ($phoneRadius + $s)
        $sPen.Dispose()
    }

    # Outer Titanium Bezel
    $bezelBrush = New-Object System.Drawing.SolidBrush((Get-Color "#1A2230"))
    Fill-RoundedRect $g $bezelBrush $phoneX $phoneY $phoneW $phoneH $phoneRadius
    $bezelBrush.Dispose()

    # Metallic Rim Highlight
    $rimPen = New-Object System.Drawing.Pen((Get-Color "#334155"), ($Width * 0.0035))
    Draw-RoundedRect $g $rimPen ($phoneX + 1.0) ($phoneY + 1.0) ($phoneW - 2.0) ($phoneH - 2.0) $phoneRadius
    $rimPen.Dispose()

    # Inner Screen Area
    $borderThickness = ($Width * 0.02)
    $screenX = ($phoneX + $borderThickness)
    $screenY = ($phoneY + $borderThickness)
    $screenW = ($phoneW - ($borderThickness * 2.0))
    $screenH = ($phoneH - ($borderThickness * 2.0))
    $screenRadius = ($phoneRadius - $borderThickness)

    $screenPath = Create-RoundedRectPath $screenX $screenY $screenW $screenH $screenRadius
    $oldClip = $g.Clip
    $g.SetClip($screenPath, [System.Drawing.Drawing2D.CombineMode]::Replace)

    # Screen Background (Obsidian Dark)
    $screenBgBrush = New-Object System.Drawing.SolidBrush((Get-Color "#0B0F17"))
    $g.FillRectangle($screenBgBrush, $screenX, $screenY, $screenW, $screenH)
    $screenBgBrush.Dispose()

    # ==========================================
    # Status Bar
    # ==========================================
    $sbFont = New-Object System.Drawing.Font($fontName, ($screenW * 0.038), [System.Drawing.FontStyle]::Bold)
    $sbBrush = New-Object System.Drawing.SolidBrush($cWhite)
    $g.DrawString("9:41", $sbFont, $sbBrush, ($screenX + ($screenW * 0.08)), ($screenY + ($screenH * 0.016)))

    # Battery & Wi-Fi Icons
    $batPen = New-Object System.Drawing.Pen($cWhite, ($screenW * 0.003))
    $batW = ($screenW * 0.06)
    $batH = ($screenH * 0.013)
    $batX = ($screenX + $screenW - ($screenW * 0.14))
    $batY = ($screenY + ($screenH * 0.018))
    Draw-RoundedRect $g $batPen $batX $batY $batW $batH 2.0
    $batFill = New-Object System.Drawing.SolidBrush((Get-Color "#10B981"))
    $g.FillRectangle($batFill, ($batX + 2.0), ($batY + 2.0), ($batW * 0.75), ($batH - 4.0))
    $batFill.Dispose()
    $batPen.Dispose()

    # Dynamic Island / Camera
    if ($Platform -eq "ios") {
        $islandW = ($screenW * 0.28)
        $islandH = ($screenH * 0.032)
        $islandX = ($screenX + (($screenW - $islandW) / 2.0))
        $islandY = ($screenY + ($screenH * 0.012))
        $islandBrush = New-Object System.Drawing.SolidBrush((Get-Color "#000000"))
        Fill-RoundedRect $g $islandBrush $islandX $islandY $islandW $islandH ($islandH / 2.0)
        $islandBrush.Dispose()
    } else {
        # Android Central Punch Hole Camera
        $camSize = ($screenW * 0.032)
        $camX = ($screenX + (($screenW - $camSize) / 2.0))
        $camY = ($screenY + ($screenH * 0.016))
        $camBrush = New-Object System.Drawing.SolidBrush((Get-Color "#000000"))
        $g.FillEllipse($camBrush, $camX, $camY, $camSize, $camSize)
        $camBrush.Dispose()
    }
    $sbBrush.Dispose()
    $sbFont.Dispose()

    # ==========================================
    # AUTHENTIC SCREEN UI RENDERING
    # ==========================================
    $contentY = ($screenY + ($screenH * 0.055))
    $contentW = $screenW
    $contentH = ($screenH * 0.94)

    switch ($ScreenIndex) {
        1 {
            # SCREEN 1: Home Dashboard & Search
            $hdrFont = New-Object System.Drawing.Font($fontName, ($screenW * 0.052), [System.Drawing.FontStyle]::Bold)
            $hdrBrush = New-Object System.Drawing.SolidBrush($cWhite)
            $g.DrawString("SHARE2GO", $hdrFont, $hdrBrush, ($screenX + ($screenW * 0.06)), $contentY)
            $hdrBrush.Dispose()
            $hdrFont.Dispose()

            $locFont = New-Object System.Drawing.Font($fontName, ($screenW * 0.030), [System.Drawing.FontStyle]::Regular)
            $locBrush = New-Object System.Drawing.SolidBrush($cGold)
            $g.DrawString("📍 Hitech City, Hyderabad", $locFont, $locBrush, ($screenX + ($screenW * 0.06)), ($contentY + ($screenH * 0.032)))
            $locBrush.Dispose()
            $locFont.Dispose()

            # Mode Selector Tabs (Carpool vs Bikepool)
            $tabY = ($contentY + ($screenH * 0.068))
            $tabW = (($screenW * 0.88) / 2.0 - ($screenW * 0.02))
            $tabH = ($screenH * 0.052)

            $tab1X = ($screenX + ($screenW * 0.06))
            $activeTabBrush = New-Object System.Drawing.SolidBrush((Get-Color "#059669"))
            Fill-RoundedRect $g $activeTabBrush $tab1X $tabY $tabW $tabH 12.0
            $activeTabBrush.Dispose()

            $tabFont = New-Object System.Drawing.Font($fontName, ($screenW * 0.035), [System.Drawing.FontStyle]::Bold)
            $tabTextBrush = New-Object System.Drawing.SolidBrush($cWhite)
            $g.DrawString("🚗  Carpool", $tabFont, $tabTextBrush, ($tab1X + ($tabW * 0.22)), ($tabY + ($tabH * 0.25)))

            $tab2X = ($tab1X + $tabW + ($screenW * 0.04))
            $inActiveTabBrush = New-Object System.Drawing.SolidBrush((Get-Color "#1E293B"))
            Fill-RoundedRect $g $inActiveTabBrush $tab2X $tabY $tabW $tabH 12.0
            $inActiveTabBrush.Dispose()
            $tabMutedBrush = New-Object System.Drawing.SolidBrush($cMuted)
            $g.DrawString("🏍️  Bikepool", $tabFont, $tabMutedBrush, ($tab2X + ($tabW * 0.22)), ($tabY + ($tabH * 0.25)))
            $tabMutedBrush.Dispose()
            $tabTextBrush.Dispose()
            $tabFont.Dispose()

            # "Where are you going?" Search Card
            $cardY = ($tabY + $tabH + ($screenH * 0.022))
            $cardX = ($screenX + ($screenW * 0.06))
            $cardWidth = ($screenW * 0.88)
            $cardHeight = ($screenH * 0.32)

            $cardBrush = New-Object System.Drawing.SolidBrush((Get-Color "#151D2A"))
            Fill-RoundedRect $g $cardBrush $cardX $cardY $cardWidth $cardHeight 16.0
            $cardBrush.Dispose()
            $cardBorderPen = New-Object System.Drawing.Pen((Get-Color "#263346"), [float]1.5)
            Draw-RoundedRect $g $cardBorderPen $cardX $cardY $cardWidth $cardHeight 16.0
            $cardBorderPen.Dispose()

            $fieldFont = New-Object System.Drawing.Font($fontName, ($screenW * 0.033), [System.Drawing.FontStyle]::Bold)
            $subFieldFont = New-Object System.Drawing.Font($fontName, ($screenW * 0.027), [System.Drawing.FontStyle]::Regular)
            $fTextBrush = New-Object System.Drawing.SolidBrush($cWhite)
            $fLabelBrush = New-Object System.Drawing.SolidBrush($cMuted)

            # Pickup
            $g.DrawString("PICKUP LOCATION", $subFieldFont, $fLabelBrush, ($cardX + ($cardWidth * 0.12)), ($cardY + ($cardHeight * 0.08)))
            $g.DrawString("Mindspace IT Park, Gate 3", $fieldFont, $fTextBrush, ($cardX + ($cardWidth * 0.12)), ($cardY + ($cardHeight * 0.16)))
            $dotBrush1 = New-Object System.Drawing.SolidBrush((Get-Color "#10B981"))
            $g.FillEllipse($dotBrush1, ($cardX + ($cardWidth * 0.05)), ($cardY + ($cardHeight * 0.17)), ($screenW * 0.03), ($screenW * 0.03))
            $dotBrush1.Dispose()

            # Divider line
            $divPen = New-Object System.Drawing.Pen((Get-Color "#334155"), [float]1.0)
            $g.DrawLine($divPen, ($cardX + ($cardWidth * 0.12)), ($cardY + ($cardHeight * 0.32)), ($cardX + ($cardWidth * 0.9)), ($cardY + ($cardHeight * 0.32)))
            $divPen.Dispose()

            # Dropoff
            $g.DrawString("DROPOFF LOCATION", $subFieldFont, $fLabelBrush, ($cardX + ($cardWidth * 0.12)), ($cardY + ($cardHeight * 0.38)))
            $g.DrawString("Financial District, Waverock", $fieldFont, $fTextBrush, ($cardX + ($cardWidth * 0.12)), ($cardY + ($cardHeight * 0.46)))
            $dotBrush2 = New-Object System.Drawing.SolidBrush((Get-Color "#EF4444"))
            $g.FillEllipse($dotBrush2, ($cardX + ($cardWidth * 0.05)), ($cardY + ($cardHeight * 0.47)), ($screenW * 0.03), ($screenW * 0.03))
            $dotBrush2.Dispose()

            # Date & Seats Row
            $chipBrush = New-Object System.Drawing.SolidBrush((Get-Color "#1E293B"))
            $chip1X = ($cardX + ($cardWidth * 0.05))
            $chipY = ($cardY + ($cardHeight * 0.62))
            $chipW = ($cardWidth * 0.42)
            $chipH = ($cardHeight * 0.14)
            Fill-RoundedRect $g $chipBrush $chip1X $chipY $chipW $chipH 8.0
            $g.DrawString("📅 Today, 06:30 PM", $subFieldFont, $fTextBrush, ($chip1X + 10.0), ($chipY + 8.0))

            $chip2X = ($cardX + ($cardWidth * 0.52))
            Fill-RoundedRect $g $chipBrush $chip2X $chipY $chipW $chipH 8.0
            $chipBrush.Dispose()
            $g.DrawString("👤 2 Seats Required", $subFieldFont, $fTextBrush, ($chip2X + 10.0), ($chipY + 8.0))

            # CTA Button: Search Rides
            $btnY = ($cardY + ($cardHeight * 0.81))
            $btnW = ($cardWidth * 0.9)
            $btnH = ($cardHeight * 0.15)
            $btnX = ($cardX + ($cardWidth * 0.05))
            $btnBrush = New-Object System.Drawing.SolidBrush($cGold)
            Fill-RoundedRect $g $btnBrush $btnX $btnY $btnW $btnH 10.0
            $btnBrush.Dispose()

            $btnFont = New-Object System.Drawing.Font($fontName, ($screenW * 0.038), [System.Drawing.FontStyle]::Bold)
            $btnTextBrush = New-Object System.Drawing.SolidBrush((Get-Color "#000000"))
            $g.DrawString("Search Available Rides", $btnFont, $btnTextBrush, ($btnX + ($btnW * 0.22)), ($btnY + ($btnH * 0.2)))
            $btnTextBrush.Dispose()
            $btnFont.Dispose()
            $fLabelBrush.Dispose()
            $fTextBrush.Dispose()
            $subFieldFont.Dispose()
            $fieldFont.Dispose()

            # Live Trips Nearby Section Header
            $secY = ($cardY + $cardHeight + ($screenH * 0.025))
            $secFont = New-Object System.Drawing.Font($fontName, ($screenW * 0.038), [System.Drawing.FontStyle]::Bold)
            $secBrush = New-Object System.Drawing.SolidBrush($cWhite)
            $g.DrawString("Verified Commuters Nearby", $secFont, $secBrush, ($screenX + ($screenW * 0.06)), $secY)
            $secBrush.Dispose()
            $secFont.Dispose()

            # Trip Card 1
            $tc1Y = ($secY + ($screenH * 0.035))
            $tcH = ($screenH * 0.125)
            $tcBrush = New-Object System.Drawing.SolidBrush((Get-Color "#151D2A"))
            Fill-RoundedRect $g $tcBrush $cardX $tc1Y $cardWidth $tcH 14.0
            $tcBrush.Dispose()
            $tcPen = New-Object System.Drawing.Pen((Get-Color "#263346"), [float]1.0)
            Draw-RoundedRect $g $tcPen $cardX $tc1Y $cardWidth $tcH 14.0
            $tcPen.Dispose()

            # Avatar
            $avBrush = New-Object System.Drawing.SolidBrush((Get-Color "#FFC107"))
            $g.FillEllipse($avBrush, ($cardX + 14.0), ($tc1Y + 14.0), ($screenW * 0.1), ($screenW * 0.1))
            $avBrush.Dispose()
            $avTextFont = New-Object System.Drawing.Font($fontName, ($screenW * 0.04), [System.Drawing.FontStyle]::Bold)
            $avTextBrush = New-Object System.Drawing.SolidBrush((Get-Color "#000000"))
            $g.DrawString("R", $avTextFont, $avTextBrush, ($cardX + 22.0), ($tc1Y + 18.0))
            $avTextBrush.Dispose()
            $avTextFont.Dispose()

            # Details
            $tTitleFont = New-Object System.Drawing.Font($fontName, ($screenW * 0.036), [System.Drawing.FontStyle]::Bold)
            $tSubFont = New-Object System.Drawing.Font($fontName, ($screenW * 0.028), [System.Drawing.FontStyle]::Regular)
            $tWhite = New-Object System.Drawing.SolidBrush($cWhite)
            $tMuted = New-Object System.Drawing.SolidBrush($cMuted)
            $tGold = New-Object System.Drawing.SolidBrush($cGold)

            $g.DrawString("Rahul Verma", $tTitleFont, $tWhite, ($cardX + ($screenW * 0.16)), ($tc1Y + 12.0))
            $g.DrawString("⭐ 4.9 • Honda City • AC", $tSubFont, $tMuted, ($cardX + ($screenW * 0.16)), ($tc1Y + 34.0))
            $g.DrawString("Hitech City ➔ Gachibowli • 2 Seats", $tSubFont, $tGold, ($cardX + ($screenW * 0.16)), ($tc1Y + 54.0))

            # Fare Badge
            $fareFont = New-Object System.Drawing.Font($fontName, ($screenW * 0.046), [System.Drawing.FontStyle]::Bold)
            $fareBrush = New-Object System.Drawing.SolidBrush((Get-Color "#10B981"))
            $g.DrawString("₹120", $fareFont, $fareBrush, ($cardX + $cardWidth - ($screenW * 0.18)), ($tc1Y + 22.0))
            $fareBrush.Dispose()
            $fareFont.Dispose()

            $tGold.Dispose()
            $tMuted.Dispose()
            $tWhite.Dispose()
            $tSubFont.Dispose()
            $tTitleFont.Dispose()
        }

        2 {
            # SCREEN 2: Search Rides & Interactive Map
            $sbBg = New-Object System.Drawing.SolidBrush((Get-Color "#1E293B"))
            Fill-RoundedRect $g $sbBg ($screenX + ($screenW * 0.06)) $contentY ($screenW * 0.88) ($screenH * 0.052) 12.0
            $sbBg.Dispose()

            $sf = New-Object System.Drawing.Font($fontName, ($screenW * 0.032), [System.Drawing.FontStyle]::Regular)
            $sw = New-Object System.Drawing.SolidBrush($cWhite)
            $g.DrawString("🔍  Hitech City to Financial District", $sf, $sw, ($screenX + ($screenW * 0.10)), ($contentY + 12.0))
            $sw.Dispose()
            $sf.Dispose()

            # Route Map Canvas Preview
            $mapY = ($contentY + ($screenH * 0.065))
            $mapH = ($screenH * 0.36)
            $mapW = ($screenW * 0.88)
            $mapX = ($screenX + ($screenW * 0.06))

            $mapBg = New-Object System.Drawing.SolidBrush((Get-Color "#0F1A2A"))
            Fill-RoundedRect $g $mapBg $mapX $mapY $mapW $mapH 16.0
            $mapBg.Dispose()

            # Map Grid Roads
            $roadPen = New-Object System.Drawing.Pen((Get-Color "#1E2C42"), [float]4.0)
            $g.DrawLine($roadPen, $mapX, ($mapY + ($mapH * 0.3)), ($mapX + $mapW), ($mapY + ($mapH * 0.3)))
            $g.DrawLine($roadPen, $mapX, ($mapY + ($mapH * 0.7)), ($mapX + $mapW), ($mapY + ($mapH * 0.7)))
            $g.DrawLine($roadPen, ($mapX + ($mapW * 0.35)), $mapY, ($mapX + ($mapW * 0.35)), ($mapY + $mapH))
            $g.DrawLine($roadPen, ($mapX + ($mapW * 0.75)), $mapY, ($mapX + ($mapW * 0.75)), ($mapY + $mapH))
            $roadPen.Dispose()

            # Glowing Route Polyline (Gold)
            $routePen = New-Object System.Drawing.Pen((Get-Color "#FFC107"), [float]6.0)
            $routePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
            $routePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

            [System.Drawing.PointF[]]$points = @(
                (New-Object System.Drawing.PointF(($mapX + ($mapW * 0.15)), ($mapY + ($mapH * 0.75)))),
                (New-Object System.Drawing.PointF(($mapX + ($mapW * 0.35)), ($mapY + ($mapH * 0.70)))),
                (New-Object System.Drawing.PointF(($mapX + ($mapW * 0.35)), ($mapY + ($mapH * 0.35)))),
                (New-Object System.Drawing.PointF(($mapX + ($mapW * 0.65)), ($mapY + ($mapH * 0.30)))),
                (New-Object System.Drawing.PointF(($mapX + ($mapW * 0.85)), ($mapY + ($mapH * 0.20))))
            )
            $g.DrawCurve($routePen, $points, [float]0.4)
            $routePen.Dispose()

            # Pin Start & End
            $pin1 = New-Object System.Drawing.SolidBrush((Get-Color "#10B981"))
            $g.FillEllipse($pin1, ($mapX + ($mapW * 0.13)), ($mapY + ($mapH * 0.72)), [float]16.0, [float]16.0)
            $pin1.Dispose()
            $pin2 = New-Object System.Drawing.SolidBrush((Get-Color "#EF4444"))
            $g.FillEllipse($pin2, ($mapX + ($mapW * 0.83)), ($mapY + ($mapH * 0.18)), [float]16.0, [float]16.0)
            $pin2.Dispose()

            # Floating Route Info Badge
            $rBadge = New-Object System.Drawing.SolidBrush((Get-Color "#151D2A"))
            Fill-RoundedRect $g $rBadge ($mapX + ($mapW * 0.05)) ($mapY + 12.0) ($mapW * 0.5) 32.0 8.0
            $rBadge.Dispose()
            $rbFont = New-Object System.Drawing.Font($fontName, ($screenW * 0.026), [System.Drawing.FontStyle]::Bold)
            $rbWhite = New-Object System.Drawing.SolidBrush($cWhite)
            $g.DrawString("⚡ Fastest: 12.4 km • 24 min", $rbFont, $rbWhite, ($mapX + ($mapW * 0.08)), ($mapY + 18.0))
            $rbWhite.Dispose()
            $rbFont.Dispose()

            # Filter Chips Row
            $fRowY = ($mapY + $mapH + ($screenH * 0.02))
            $chips = @("🚗 Cars Only", "⭐ 4.5+ Rating", "⚡ Instant Book", "🛡️ KYC Verified")
            $chipX = ($screenX + ($screenW * 0.06))
            foreach ($c in $chips) {
                $cBg = New-Object System.Drawing.SolidBrush((Get-Color "#1E293B"))
                Fill-RoundedRect $g $cBg $chipX $fRowY ($screenW * 0.21) 28.0 6.0
                $cBg.Dispose()
                $cf = New-Object System.Drawing.Font($fontName, ($screenW * 0.022), [System.Drawing.FontStyle]::Regular)
                $cw = New-Object System.Drawing.SolidBrush($cWhite)
                $g.DrawString($c, $cf, $cw, ($chipX + 6.0), ($fRowY + 6.0))
                $cw.Dispose()
                $cf.Dispose()
                $chipX += ($screenW * 0.225)
            }

            # Search Result Card 1
            $resY = ($fRowY + ($screenH * 0.045))
            $rcBrush = New-Object System.Drawing.SolidBrush((Get-Color "#151D2A"))
            Fill-RoundedRect $g $rcBrush $mapX $resY $mapW ($screenH * 0.16) 14.0
            $rcBrush.Dispose()
            $rcBorder = New-Object System.Drawing.Pen((Get-Color "#059669"), [float]1.5)
            Draw-RoundedRect $g $rcBorder $mapX $resY $mapW ($screenH * 0.16) 14.0
            $rcBorder.Dispose()

            # Card 1 Info
            $tF = New-Object System.Drawing.Font($fontName, ($screenW * 0.038), [System.Drawing.FontStyle]::Bold)
            $mF = New-Object System.Drawing.Font($fontName, ($screenW * 0.028), [System.Drawing.FontStyle]::Regular)
            $wB = New-Object System.Drawing.SolidBrush($cWhite)
            $g.DrawString("Vikram Sharma", $tF, $wB, ($mapX + 16.0), ($resY + 14.0))
            $g.DrawString("Hyundai Creta • ⭐ 4.95 (84 reviews)", $mF, (New-Object System.Drawing.SolidBrush($cMuted)), ($mapX + 16.0), ($resY + 38.0))
            $g.DrawString("Departs Today at 06:45 PM • 3 Seats Available", $mF, (New-Object System.Drawing.SolidBrush($cGold)), ($mapX + 16.0), ($resY + 58.0))

            $reqBtn = New-Object System.Drawing.SolidBrush((Get-Color "#059669"))
            Fill-RoundedRect $g $reqBtn ($mapX + $mapW - 120.0) ($resY + 45.0) 105.0 34.0 8.0
            $reqBtn.Dispose()
            $g.DrawString("Request Seat", (New-Object System.Drawing.Font($fontName, ($screenW * 0.026), [System.Drawing.FontStyle]::Bold)), $wB, ($mapX + $mapW - 112.0), ($resY + 53.0))

            $g.DrawString("₹140", (New-Object System.Drawing.Font($fontName, ($screenW * 0.05), [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush((Get-Color "#10B981"))), ($mapX + $mapW - 110.0), ($resY + 12.0))
            $wB.Dispose()
            $mF.Dispose()
            $tF.Dispose()
        }

        3 {
            # SCREEN 3: Offer a Ride & Offset Fuel Costs
            $tF = New-Object System.Drawing.Font($fontName, ($screenW * 0.048), [System.Drawing.FontStyle]::Bold)
            $wB = New-Object System.Drawing.SolidBrush($cWhite)
            $g.DrawString("Host a Trip • Offer Seats", $tF, $wB, ($screenX + ($screenW * 0.06)), $contentY)
            $tF.Dispose()

            # Vehicle Selection (Car vs Bike)
            $vCardY = ($contentY + ($screenH * 0.045))
            $vW = ($screenW * 0.88)
            $vX = ($screenX + ($screenW * 0.06))

            $vBg = New-Object System.Drawing.SolidBrush((Get-Color "#151D2A"))
            Fill-RoundedRect $g $vBg $vX $vCardY $vW ($screenH * 0.075) 12.0
            $vBg.Dispose()

            $vPen = New-Object System.Drawing.Pen((Get-Color "#2563EB"), [float]1.5)
            Draw-RoundedRect $g $vPen $vX $vCardY $vW ($screenH * 0.075) 12.0
            $vPen.Dispose()

            $g.DrawString("🚗  Select Vehicle: Honda City (TS 09 EQ 4092)", (New-Object System.Drawing.Font($fontName, ($screenW * 0.034), [System.Drawing.FontStyle]::Bold)), $wB, ($vX + 16.0), ($vCardY + 16.0))
            $g.DrawString("4 Passenger Seats Available • AC Sedans", (New-Object System.Drawing.Font($fontName, ($screenW * 0.026), [System.Drawing.FontStyle]::Regular)), (New-Object System.Drawing.SolidBrush($cMuted)), ($vX + 16.0), ($vCardY + 40.0))

            # Route & Stops Container
            $rBoxY = ($vCardY + ($screenH * 0.095))
            $rBoxH = ($screenH * 0.32)
            $rBoxBrush = New-Object System.Drawing.SolidBrush((Get-Color "#151D2A"))
            Fill-RoundedRect $g $rBoxBrush $vX $rBoxY $vW $rBoxH 14.0
            $rBoxBrush.Dispose()

            $subF = New-Object System.Drawing.Font($fontName, ($screenW * 0.028), [System.Drawing.FontStyle]::Regular)
            $lblF = New-Object System.Drawing.Font($fontName, ($screenW * 0.034), [System.Drawing.FontStyle]::Bold)
            $mB = New-Object System.Drawing.SolidBrush($cMuted)

            # Origin
            $g.DrawString("PICKUP LOCATION", $subF, $mB, ($vX + 20.0), ($rBoxY + 14.0))
            $g.DrawString("Kondapur RTO Office", $lblF, $wB, ($vX + 20.0), ($rBoxY + 34.0))

            # Stopover
            $g.DrawString("+ STOP OVER (EN ROUTE)", $subF, (New-Object System.Drawing.SolidBrush($cGold)), ($vX + 20.0), ($rBoxY + 70.0))
            $g.DrawString("Gachibowli Junction / Bio-Diversity", $lblF, $wB, ($vX + 20.0), ($rBoxY + 90.0))

            # Destination
            $g.DrawString("FINAL DESTINATION", $subF, $mB, ($vX + 20.0), ($rBoxY + 126.0))
            $g.DrawString("Raheja Mindspace, Madhapur", $lblF, $wB, ($vX + 20.0), ($rBoxY + 146.0))

            # Departure Time
            $g.DrawString("SCHEDULE TIME", $subF, $mB, ($vX + 20.0), ($rBoxY + 182.0))
            $g.DrawString("Today • 08:30 AM (Morning Commute)", $lblF, (New-Object System.Drawing.SolidBrush((Get-Color "#10B981"))), ($vX + 20.0), ($rBoxY + 202.0))

            # Seat Price Card
            $pCardY = ($rBoxY + $rBoxH + ($screenH * 0.022))
            $pCardH = ($screenH * 0.12)
            $pBg = New-Object System.Drawing.SolidBrush((Get-Color "#1E293B"))
            Fill-RoundedRect $g $pBg $vX $pCardY $vW $pCardH 12.0
            $pBg.Dispose()

            $g.DrawString("Recommended Price Per Seat", $subF, $mB, ($vX + 16.0), ($pCardY + 14.0))
            $g.DrawString("₹130", (New-Object System.Drawing.Font($fontName, ($screenW * 0.065), [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush($cGold)), ($vX + 16.0), ($pCardY + 36.0))
            $g.DrawString("Estimated earnings for 3 co-riders: ₹390", $subF, (New-Object System.Drawing.SolidBrush((Get-Color "#10B981"))), ($vX + 16.0), ($pCardY + 80.0))

            # Publish Button
            $pubY = ($pCardY + $pCardH + ($screenH * 0.025))
            $pubBtn = New-Object System.Drawing.SolidBrush((Get-Color "#2563EB"))
            Fill-RoundedRect $g $pubBtn $vX $pubY $vW ($screenH * 0.058) 12.0
            $pubBtn.Dispose()
            $g.DrawString("Publish Ride Now", (New-Object System.Drawing.Font($fontName, ($screenW * 0.04), [System.Drawing.FontStyle]::Bold)), $wB, ($vX + ($vW * 0.32)), ($pubY + 14.0))

            $mB.Dispose()
            $lblF.Dispose()
            $subF.Dispose()
            $wB.Dispose()
        }

        4 {
            # SCREEN 4: Active Ride & Live Turn-by-Turn GPS with SOS
            $mapH = ($screenH * 0.44)
            $mapW = ($screenW * 0.88)
            $mapX = ($screenX + ($screenW * 0.06))
            $mapY = $contentY

            $mapBg = New-Object System.Drawing.SolidBrush((Get-Color "#0E1726"))
            Fill-RoundedRect $g $mapBg $mapX $mapY $mapW $mapH 16.0
            $mapBg.Dispose()

            # Navigation Top Banner inside map
            $navBanner = New-Object System.Drawing.SolidBrush((Get-Color "#1E293B"))
            Fill-RoundedRect $g $navBanner ($mapX + 12.0) ($mapY + 12.0) ($mapW - 24.0) ($mapH * 0.22) 10.0
            $navBanner.Dispose()

            $g.DrawString("↱ In 250m, Turn Right", (New-Object System.Drawing.Font($fontName, ($screenW * 0.038), [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush($cWhite)), ($mapX + 24.0), ($mapY + 20.0))
            $g.DrawString("onto Financial District Main Road", (New-Object System.Drawing.Font($fontName, ($screenW * 0.028), [System.Drawing.FontStyle]::Regular)), (New-Object System.Drawing.SolidBrush($cMuted)), ($mapX + 24.0), ($mapY + 46.0))

            # Active Ride Status Bottom Sheet
            $sheetY = ($mapY + $mapH + ($screenH * 0.02))
            $sheetH = ($screenH * 0.36)
            $sheetBrush = New-Object System.Drawing.SolidBrush((Get-Color "#151D2A"))
            Fill-RoundedRect $g $sheetBrush $mapX $sheetY $mapW $sheetH 16.0
            $sheetBrush.Dispose()
            $sheetPen = New-Object System.Drawing.Pen((Get-Color "#263346"), [float]1.0)
            Draw-RoundedRect $g $sheetPen $mapX $sheetY $mapW $sheetH 16.0
            $sheetPen.Dispose()

            # Driver Info Row
            $wB = New-Object System.Drawing.SolidBrush($cWhite)
            $mB = New-Object System.Drawing.SolidBrush($cMuted)
            $g.DrawString("Ride In Progress", (New-Object System.Drawing.Font($fontName, ($screenW * 0.038), [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush((Get-Color "#10B981"))), ($mapX + 18.0), ($sheetY + 16.0))
            $g.DrawString("ETA: 14 mins • 4.8 km remaining", (New-Object System.Drawing.Font($fontName, ($screenW * 0.028), [System.Drawing.FontStyle]::Regular)), $mB, ($mapX + 18.0), ($sheetY + 40.0))

            # Driver details
            $g.DrawString("Driver: Arjun Reddy", (New-Object System.Drawing.Font($fontName, ($screenW * 0.035), [System.Drawing.FontStyle]::Bold)), $wB, ($mapX + 18.0), ($sheetY + 70.0))
            $g.DrawString("Kia Seltos • TS 09 FB 8821 • ⭐ 4.9", (New-Object System.Drawing.Font($fontName, ($screenW * 0.028), [System.Drawing.FontStyle]::Regular)), $mB, ($mapX + 18.0), ($sheetY + 94.0))

            # Ride OTP Box
            $otpX = ($mapX + $mapW - 130.0)
            $otpY = ($sheetY + 65.0)
            $otpBg = New-Object System.Drawing.SolidBrush((Get-Color "#1E293B"))
            Fill-RoundedRect $g $otpBg $otpX $otpY 115.0 50.0 8.0
            $otpBg.Dispose()
            $g.DrawString("RIDE OTP", (New-Object System.Drawing.Font($fontName, ($screenW * 0.022), [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush($cGold)), ($otpX + 30.0), ($otpY + 8.0))
            $g.DrawString("4 8 9 2", (New-Object System.Drawing.Font($fontName, ($screenW * 0.04), [System.Drawing.FontStyle]::Bold)), $wB, ($otpX + 18.0), ($otpY + 24.0))

            # Emergency SOS Button (CRITICAL SAFETY FEATURE)
            $sosY = ($sheetY + ($sheetH * 0.58))
            $sosW = ($mapW - 36.0)
            $sosX = ($mapX + 18.0)
            $sosBrush = New-Object System.Drawing.SolidBrush((Get-Color "#EF4444"))
            Fill-RoundedRect $g $sosBrush $sosX $sosY $sosW ($sheetH * 0.18) 10.0
            $sosBrush.Dispose()

            $g.DrawString("🛡️ EMERGENCY SHAKE SOS ACTIVATED", (New-Object System.Drawing.Font($fontName, ($screenW * 0.032), [System.Drawing.FontStyle]::Bold)), $wB, ($sosX + ($sosW * 0.14)), ($sosY + 14.0))

            # Action Buttons (Call / Chat)
            $cBtnY = ($sheetY + ($sheetH * 0.80))
            $halfW = (($sosW - 12.0) / 2.0)
            $callBtn = New-Object System.Drawing.SolidBrush((Get-Color "#059669"))
            Fill-RoundedRect $g $callBtn $sosX $cBtnY $halfW ($sheetH * 0.15) 8.0
            $callBtn.Dispose()
            $g.DrawString("📞 Call Driver", (New-Object System.Drawing.Font($fontName, ($screenW * 0.03), [System.Drawing.FontStyle]::Bold)), $wB, ($sosX + ($halfW * 0.25)), ($cBtnY + 8.0))

            $chatBtn = New-Object System.Drawing.SolidBrush((Get-Color "#2563EB"))
            Fill-RoundedRect $g $chatBtn ($sosX + $halfW + 12.0) $cBtnY $halfW ($sheetH * 0.15) 8.0
            $chatBtn.Dispose()
            $g.DrawString("💬 Chat Message", (New-Object System.Drawing.Font($fontName, ($screenW * 0.03), [System.Drawing.FontStyle]::Bold)), $wB, ($sosX + $halfW + 12.0 + ($halfW * 0.2)), ($cBtnY + 8.0))

            $mB.Dispose()
            $wB.Dispose()
        }

        5 {
            # SCREEN 5: In-App VoIP Call Screen (WhatsApp-style Clean)
            $callW = ($screenW * 0.88)
            $callX = ($screenX + ($screenW * 0.06))
            $cY = $contentY

            # Top Privacy Badge
            $encBg = New-Object System.Drawing.SolidBrush((Get-Color "#1E293B"))
            Fill-RoundedRect $g $encBg ($callX + ($callW * 0.2)) $cY ($callW * 0.6) 30.0 15.0
            $encBg.Dispose()
            $g.DrawString("🔒 SHARE2GO End-to-End Encrypted", (New-Object System.Drawing.Font($fontName, ($screenW * 0.024), [System.Drawing.FontStyle]::Regular)), (New-Object System.Drawing.SolidBrush($cMuted)), ($callX + ($callW * 0.24)), ($cY + 7.0))

            # Caller Name
            $wB = New-Object System.Drawing.SolidBrush($cWhite)
            $g.DrawString("Priya Sharma", (New-Object System.Drawing.Font($fontName, ($screenW * 0.055), [System.Drawing.FontStyle]::Bold)), $wB, ($callX + ($callW * 0.28)), ($cY + 50.0))
            $g.DrawString("📞 SHARE2GO audio call • 00:28", (New-Object System.Drawing.Font($fontName, ($screenW * 0.032), [System.Drawing.FontStyle]::Regular)), (New-Object System.Drawing.SolidBrush((Get-Color "#25D366"))), ($callX + ($callW * 0.25)), ($cY + 85.0))

            # Central Pulsing Avatar Ring
            $avCenterY = ($cY + ($screenH * 0.32))
            $avRadius = ($screenW * 0.18)
            $avX = ($screenX + ($screenW / 2.0) - $avRadius)

            # Outer Ripple Waves
            $wavePen = New-Object System.Drawing.Pen((Get-Color "#25D366"), [float]2.0)
            $g.DrawEllipse($wavePen, ($avX - 25.0), ($avCenterY - 25.0), ($avRadius * 2.0 + 50.0), ($avRadius * 2.0 + 50.0))
            $wavePen.Dispose()

            # Main Avatar Circle
            $avBg = New-Object System.Drawing.SolidBrush((Get-Color "#1E293B"))
            $g.FillEllipse($avBg, $avX, $avCenterY, ($avRadius * 2.0), ($avRadius * 2.0))
            $avBg.Dispose()
            $avBorder = New-Object System.Drawing.Pen($cGold, [float]4.0)
            $g.DrawEllipse($avBorder, $avX, $avCenterY, ($avRadius * 2.0), ($avRadius * 2.0))
            $avBorder.Dispose()

            $g.DrawString("P", (New-Object System.Drawing.Font($fontName, ($screenW * 0.12), [System.Drawing.FontStyle]::Bold)), $wB, ($screenX + ($screenW / 2.0) - 24.0), ($avCenterY + 25.0))

            # Call Controls Dock
            $dockY = ($screenY + ($screenH * 0.68))
            $dockW = ($screenW * 0.8)
            $dockX = ($screenX + ($screenW * 0.1))
            $dockH = ($screenH * 0.12)

            $dockBg = New-Object System.Drawing.SolidBrush((Get-Color "#151D2A"))
            Fill-RoundedRect $g $dockBg $dockX $dockY $dockW $dockH 30.0
            $dockBg.Dispose()

            # Speaker Button (Active Gold)
            $spkBg = New-Object System.Drawing.SolidBrush($cGold)
            $g.FillEllipse($spkBg, ($dockX + ($dockW * 0.12)), ($dockY + ($dockH * 0.2)), [float]50.0, [float]50.0)
            $spkBg.Dispose()
            $g.DrawString("🔊", (New-Object System.Drawing.Font($fontName, 18)), $wB, ($dockX + ($dockW * 0.12) + 12.0), ($dockY + ($dockH * 0.2) + 10.0))

            # End Call Button (Red)
            $endBg = New-Object System.Drawing.SolidBrush((Get-Color "#EF4444"))
            $g.FillEllipse($endBg, ($dockX + ($dockW * 0.42)), ($dockY + ($dockH * 0.15)), [float]60.0, [float]60.0)
            $endBg.Dispose()
            $g.DrawString("📞", (New-Object System.Drawing.Font($fontName, 22)), $wB, ($dockX + ($dockW * 0.42) + 16.0), ($dockY + ($dockH * 0.15) + 12.0))

            # Mute Button
            $muteBg = New-Object System.Drawing.SolidBrush((Get-Color "#263346"))
            $g.FillEllipse($muteBg, ($dockX + ($dockW * 0.74)), ($dockY + ($dockH * 0.2)), [float]50.0, [float]50.0)
            $muteBg.Dispose()
            $g.DrawString("🎤", (New-Object System.Drawing.Font($fontName, 18)), $wB, ($dockX + ($dockW * 0.74) + 12.0), ($dockY + ($dockH * 0.2) + 10.0))

            $wB.Dispose()
        }

        6 {
            # SCREEN 6: In-App Chat & Ride Coordination
            $chatW = ($screenW * 0.88)
            $chatX = ($screenX + ($screenW * 0.06))
            $cY = $contentY

            # Header User Bar
            $cHeader = New-Object System.Drawing.SolidBrush((Get-Color "#151D2A"))
            Fill-RoundedRect $g $cHeader $chatX $cY $chatW ($screenH * 0.075) 12.0
            $cHeader.Dispose()

            $wB = New-Object System.Drawing.SolidBrush($cWhite)
            $g.DrawString("Suresh Kumar", (New-Object System.Drawing.Font($fontName, ($screenW * 0.038), [System.Drawing.FontStyle]::Bold)), $wB, ($chatX + 55.0), ($cY + 12.0))
            $g.DrawString("Online • Carpooling in Honda City", (New-Object System.Drawing.Font($fontName, ($screenW * 0.026), [System.Drawing.FontStyle]::Regular)), (New-Object System.Drawing.SolidBrush((Get-Color "#10B981"))), ($chatX + 55.0), ($cY + 34.0))

            # Header Avatar
            $avB = New-Object System.Drawing.SolidBrush((Get-Color "#2563EB"))
            $g.FillEllipse($avB, ($chatX + 12.0), ($cY + 12.0), [float]38.0, [float]38.0)
            $avB.Dispose()
            $g.DrawString("S", (New-Object System.Drawing.Font($fontName, 14, [System.Drawing.FontStyle]::Bold)), $wB, ($chatX + 24.0), ($cY + 20.0))

            # Messages Stream
            $m1Y = ($cY + ($screenH * 0.11))

            # Peer Message 1
            $b1Bg = New-Object System.Drawing.SolidBrush((Get-Color "#1E293B"))
            Fill-RoundedRect $g $b1Bg $chatX $m1Y ($chatW * 0.75) 60.0 12.0
            $b1Bg.Dispose()
            $g.DrawString("Hi! I have reached Mindspace Gate 2 near Starbucks.", (New-Object System.Drawing.Font($fontName, ($screenW * 0.028), [System.Drawing.FontStyle]::Regular)), $wB, ($chatX + 12.0), ($m1Y + 12.0))
            $g.DrawString("06:25 PM", (New-Object System.Drawing.Font($fontName, ($screenW * 0.022), [System.Drawing.FontStyle]::Regular)), (New-Object System.Drawing.SolidBrush($cMuted)), ($chatX + ($chatW * 0.6)), ($m1Y + 38.0))

            # My Reply 1
            $m2Y = ($m1Y + 75.0)
            $b2Bg = New-Object System.Drawing.SolidBrush((Get-Color "#059669"))
            Fill-RoundedRect $g $b2Bg ($chatX + ($chatW * 0.25)) $m2Y ($chatW * 0.75) 60.0 12.0
            $b2Bg.Dispose()
            $g.DrawString("Great! Walking out of building now. Wearing black jacket.", (New-Object System.Drawing.Font($fontName, ($screenW * 0.028), [System.Drawing.FontStyle]::Regular)), $wB, ($chatX + ($chatW * 0.28)), ($m2Y + 12.0))
            $g.DrawString("06:26 PM ✓✓", (New-Object System.Drawing.Font($fontName, ($screenW * 0.022), [System.Drawing.FontStyle]::Regular)), (New-Object System.Drawing.SolidBrush((Get-Color "#A7F3D0"))), ($chatX + ($chatW * 0.82)), ($m2Y + 38.0))

            # Peer Message 2
            $m3Y = ($m2Y + 75.0)
            $b3Bg = New-Object System.Drawing.SolidBrush((Get-Color "#1E293B"))
            Fill-RoundedRect $g $b3Bg $chatX $m3Y ($chatW * 0.75) 55.0 12.0
            $b3Bg.Dispose()
            $g.DrawString("Sure, hazard lights are ON. Car is White Honda City.", (New-Object System.Drawing.Font($fontName, ($screenW * 0.028), [System.Drawing.FontStyle]::Regular)), $wB, ($chatX + 12.0), ($m3Y + 12.0))
            $g.DrawString("06:27 PM", (New-Object System.Drawing.Font($fontName, ($screenW * 0.022), [System.Drawing.FontStyle]::Regular)), (New-Object System.Drawing.SolidBrush($cMuted)), ($chatX + ($chatW * 0.6)), ($m3Y + 34.0))

            # Quick Reply Chips
            $qY = ($screenY + ($screenH * 0.66))
            $chips = @("I'm here! 📍", "2 mins away", "In traffic")
            $qX = $chatX
            foreach ($q in $chips) {
                $qBg = New-Object System.Drawing.SolidBrush((Get-Color "#1E293B"))
                Fill-RoundedRect $g $qBg $qX $qY ($chatW * 0.3) 30.0 15.0
                $qBg.Dispose()
                $g.DrawString($q, (New-Object System.Drawing.Font($fontName, ($screenW * 0.024), [System.Drawing.FontStyle]::Regular)), $wB, ($qX + 12.0), ($qY + 7.0))
                $qX += ($chatW * 0.33)
            }

            # Bottom Chat Input Bar
            $inpY = ($screenY + ($screenH * 0.73))
            $inpBg = New-Object System.Drawing.SolidBrush((Get-Color "#151D2A"))
            Fill-RoundedRect $g $inpBg $chatX $inpY $chatW 48.0 24.0
            $inpBg.Dispose()
            $g.DrawString("Type a message to co-passenger...", (New-Object System.Drawing.Font($fontName, ($screenW * 0.028), [System.Drawing.FontStyle]::Regular)), (New-Object System.Drawing.SolidBrush($cMuted)), ($chatX + 20.0), ($inpY + 14.0))

            $sendBg = New-Object System.Drawing.SolidBrush($cGold)
            $g.FillEllipse($sendBg, ($chatX + $chatW - 44.0), ($inpY + 6.0), [float]36.0, [float]36.0)
            $sendBg.Dispose()
            $g.DrawString("➤", (New-Object System.Drawing.Font($fontName, 14, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush((Get-Color "#000000"))), ($chatX + $chatW - 32.0), ($inpY + 12.0))

            $wB.Dispose()
        }

        7 {
            # SCREEN 7: Stranger Mode & Social Travel Vibe Deck
            $sW = ($screenW * 0.88)
            $sX = ($screenX + ($screenW * 0.06))
            $sY = $contentY

            $wB = New-Object System.Drawing.SolidBrush($cWhite)
            $g.DrawString("Stranger Mode • Travel Vibes", (New-Object System.Drawing.Font($fontName, ($screenW * 0.045), [System.Drawing.FontStyle]::Bold)), $wB, $sX, $sY)
            $g.DrawString("Discover co-travelers matching your commute vibe", (New-Object System.Drawing.Font($fontName, ($screenW * 0.028), [System.Drawing.FontStyle]::Regular)), (New-Object System.Drawing.SolidBrush($cMuted)), $sX, ($sY + 28.0))

            # Main Vibe Card (Swipeable Profile Deck)
            $vCardY = ($sY + 60.0)
            $vCardH = ($screenH * 0.58)

            $ptV1 = New-Object System.Drawing.PointF($sX, $vCardY)
            $ptV2 = New-Object System.Drawing.PointF($sX, ($vCardY + $vCardH))
            $vCardBg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($ptV1, $ptV2, (Get-Color "#1E293B"), (Get-Color "#0F172A"))
            Fill-RoundedRect $g $vCardBg $sX $vCardY $sW $vCardH 20.0
            $vCardBg.Dispose()

            # Profile Header Inside Deck
            $g.DrawString("Neha Kapoor, 26", (New-Object System.Drawing.Font($fontName, ($screenW * 0.05), [System.Drawing.FontStyle]::Bold)), $wB, ($sX + 20.0), ($vCardY + 24.0))
            $g.DrawString("UI/UX Designer at Fintech Startup • Verified ✓", (New-Object System.Drawing.Font($fontName, ($screenW * 0.028), [System.Drawing.FontStyle]::Regular)), (New-Object System.Drawing.SolidBrush($cGold)), ($sX + 20.0), ($vCardY + 54.0))

            # Commute Route Tag
            $rtBg = New-Object System.Drawing.SolidBrush((Get-Color "#151D2A"))
            Fill-RoundedRect $g $rtBg ($sX + 20.0) ($vCardY + 85.0) ($sW - 40.0) 40.0 8.0
            $rtBg.Dispose()
            $g.DrawString("📍 Daily Route: Jubilee Hills ➔ Cyber Towers (9 AM - 6 PM)", (New-Object System.Drawing.Font($fontName, ($screenW * 0.026), [System.Drawing.FontStyle]::Bold)), $wB, ($sX + 28.0), ($vCardY + 96.0))

            # Travel Vibe Chips
            $g.DrawString("INTERESTS & COMMUTE VIBES", (New-Object System.Drawing.Font($fontName, ($screenW * 0.025), [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush($cMuted)), ($sX + 20.0), ($vCardY + 145.0))

            $vibes = @("🎧 Indie Rock / Podcasts", "☕ Coffee Lover", "💻 Startup Tech", "🏸 Weekend Badminton", "🔇 Quiet Morning Rides")
            $vibeY = ($vCardY + 175.0)
            $vx = ($sX + 20.0)
            foreach ($vb in $vibes) {
                $vbBg = New-Object System.Drawing.SolidBrush((Get-Color "#2563EB"))
                Fill-RoundedRect $g $vbBg $vx $vibeY 145.0 28.0 6.0
                $vbBg.Dispose()
                $g.DrawString($vb, (New-Object System.Drawing.Font($fontName, ($screenW * 0.022), [System.Drawing.FontStyle]::Regular)), $wB, ($vx + 6.0), ($vibeY + 6.0))
                $vx += 155.0
                if ($vx -gt ($sX + $sW - 140.0)) {
                    $vx = ($sX + 20.0)
                    $vibeY += 36.0
                }
            }

            # Action Buttons: Connect / Skip
            $actY = ($vCardY + ($vCardH * 0.8))
            $btnW = (($sW - 60.0) / 2.0)

            $skipBtn = New-Object System.Drawing.SolidBrush((Get-Color "#334155"))
            Fill-RoundedRect $g $skipBtn ($sX + 20.0) $actY $btnW 44.0 10.0
            $skipBtn.Dispose()
            $g.DrawString("Next Vibe", (New-Object System.Drawing.Font($fontName, ($screenW * 0.032), [System.Drawing.FontStyle]::Bold)), $wB, ($sX + 20.0 + ($btnW * 0.28)), ($actY + 12.0))

            $connBtn = New-Object System.Drawing.SolidBrush($cGold)
            Fill-RoundedRect $g $connBtn ($sX + 40.0 + $btnW) $actY $btnW 44.0 10.0
            $connBtn.Dispose()
            $g.DrawString("Connect & Pool", (New-Object System.Drawing.Font($fontName, ($screenW * 0.032), [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush((Get-Color "#000000"))), ($sX + 40.0 + $btnW + ($btnW * 0.16)), ($actY + 12.0))

            $wB.Dispose()
        }

        8 {
            # SCREEN 8: 100% Verified Community & Trust
            $tW = ($screenW * 0.88)
            $tX = ($screenX + ($screenW * 0.06))
            $tY = $contentY

            $wB = New-Object System.Drawing.SolidBrush($cWhite)
            $g.DrawString("Trust & Safety Hub", (New-Object System.Drawing.Font($fontName, ($screenW * 0.048), [System.Drawing.FontStyle]::Bold)), $wB, $tX, $tY)
            $g.DrawString("Every commuter is government ID verified", (New-Object System.Drawing.Font($fontName, ($screenW * 0.028), [System.Drawing.FontStyle]::Regular)), (New-Object System.Drawing.SolidBrush($cMuted)), $tX, ($tY + 28.0))

            # Central Trust Badge
            $shieldY = ($tY + 65.0)
            $shieldH = ($screenH * 0.16)
            $shieldBg = New-Object System.Drawing.SolidBrush((Get-Color "#151D2A"))
            Fill-RoundedRect $g $shieldBg $tX $shieldY $tW $shieldH 16.0
            $shieldBg.Dispose()
            $shieldPen = New-Object System.Drawing.Pen($cGold, [float]1.5)
            Draw-RoundedRect $g $shieldPen $tX $shieldY $tW $shieldH 16.0
            $shieldPen.Dispose()

            # Gold Shield Icon
            $g.DrawString("🛡️", (New-Object System.Drawing.Font($fontName, 36)), $wB, ($tX + 18.0), ($shieldY + 18.0))
            $g.DrawString("100% Identity Verified Commuters", (New-Object System.Drawing.Font($fontName, ($screenW * 0.036), [System.Drawing.FontStyle]::Bold)), $wB, ($tX + 85.0), ($shieldY + 22.0))
            $g.DrawString("Govt Aadhaar • Driving Licence • Background Check", (New-Object System.Drawing.Font($fontName, ($screenW * 0.026), [System.Drawing.FontStyle]::Regular)), (New-Object System.Drawing.SolidBrush((Get-Color "#10B981"))), ($tX + 85.0), ($shieldY + 50.0))

            # Corporate Commuter Clubs
            $corpY = ($shieldY + $shieldH + 20.0)
            $corpH = ($screenH * 0.22)
            $corpBg = New-Object System.Drawing.SolidBrush((Get-Color "#151D2A"))
            Fill-RoundedRect $g $corpBg $tX $corpY $tW $corpH 16.0
            $corpBg.Dispose()

            $g.DrawString("🏢 Verified Corporate Commuter Clubs", (New-Object System.Drawing.Font($fontName, ($screenW * 0.034), [System.Drawing.FontStyle]::Bold)), $wB, ($tX + 18.0), ($corpY + 18.0))

            # Corporate Badges
            $cBadges = @("Microsoft Hitech City (480 members)", "Google Knowledge City (320 members)", "Amazon HYD (610 members)", "Infosys Gachibowli (750 members)")
            $by = ($corpY + 50.0)
            foreach ($b in $cBadges) {
                $bBrush = New-Object System.Drawing.SolidBrush((Get-Color "#1E293B"))
                Fill-RoundedRect $g $bBrush ($tX + 18.0) $by ($tW - 36.0) 28.0 6.0
                $bBrush.Dispose()
                $g.DrawString("✓ $b", (New-Object System.Drawing.Font($fontName, ($screenW * 0.024), [System.Drawing.FontStyle]::Regular)), (New-Object System.Drawing.SolidBrush($cGold)), ($tX + 26.0), ($by + 6.0))
                $by += 34.0
            }

            # Safety Highlights Box
            $safY = ($corpY + $corpH + 20.0)
            $safH = ($screenH * 0.20)
            $safBg = New-Object System.Drawing.SolidBrush((Get-Color "#151D2A"))
            Fill-RoundedRect $g $safBg $tX $safY $tW $safH 16.0
            $safBg.Dispose()

            $g.DrawString("Safety & Protection Guarantees", (New-Object System.Drawing.Font($fontName, ($screenW * 0.034), [System.Drawing.FontStyle]::Bold)), $wB, ($tX + 18.0), ($safY + 18.0))
            $g.DrawString("⚡ Shake Phone for Instant SOS Emergency Alert", (New-Object System.Drawing.Font($fontName, ($screenW * 0.026), [System.Drawing.FontStyle]::Regular)), (New-Object System.Drawing.SolidBrush((Get-Color "#EF4444"))), ($tX + 18.0), ($safY + 48.0))
            $g.DrawString("📍 Real-time Live Location Sharing with Trusted Family", (New-Object System.Drawing.Font($fontName, ($screenW * 0.026), [System.Drawing.FontStyle]::Regular)), $wB, ($tX + 18.0), ($safY + 76.0))
            $g.DrawString("👩 Women-Only Commuting Option Available", (New-Object System.Drawing.Font($fontName, ($screenW * 0.026), [System.Drawing.FontStyle]::Regular)), (New-Object System.Drawing.SolidBrush((Get-Color "#A78BFA"))), ($tX + 18.0), ($safY + 104.0))

            $wB.Dispose()
        }
    }

    # Reset Clip
    $g.Clip = $oldClip

    # Save to disk
    $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $OutputPath ($Width x $Height)"
}

# 1. Generate Android Screenshots (1080 x 1920)
for ($i = 1; $i -le 8; $i++) {
    $num = "{0:D2}" -f $i
    $outPath = "d:\node_projects\SHARE2GO\store_assets\android\screenshot_$num.png"
    Render-Screenshot -ScreenIndex $i -Platform "android" -Width 1080 -Height 1920 -OutputPath $outPath
}

# 2. Generate iOS Screenshots (1290 x 2796)
for ($i = 1; $i -le 8; $i++) {
    $num = "{0:D2}" -f $i
    $outPath = "d:\node_projects\SHARE2GO\store_assets\ios\screenshot_$num.png"
    Render-Screenshot -ScreenIndex $i -Platform "ios" -Width 1290 -Height 2796 -OutputPath $outPath
}

Write-Host "All 16 promotional store screenshots created successfully!"
