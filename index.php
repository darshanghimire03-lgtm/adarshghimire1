<?php
// Simple PHP website starter for Render.
$phpVersion = phpversion();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Doroi PHP Website</title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            color: #172033;
            background: #f3f6fb;
        }
        main {
            width: min(100%, 620px);
            padding: 40px;
            text-align: center;
            background: #fff;
            border: 1px solid #e5eaf2;
            border-radius: 22px;
            box-shadow: 0 14px 45px rgba(25, 45, 80, .08);
        }
        h1 { margin: 0 0 12px; font-size: clamp(2rem, 6vw, 3rem); }
        p { color: #647089; line-height: 1.6; }
        .status {
            display: inline-block;
            margin-top: 12px;
            padding: 8px 14px;
            color: #147a52;
            background: #e7f7ef;
            border-radius: 999px;
            font-size: .9rem;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <main>
        <h1>Welcome to Doroi</h1>
        <p>Your PHP website is running on Render.</p>
        <p>PHP version: <?= htmlspecialchars($phpVersion, ENT_QUOTES, 'UTF-8') ?></p>
        <span class="status">Deployment successful</span>
    </main>
</body>
</html>