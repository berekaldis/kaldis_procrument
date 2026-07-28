<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ config('app.name', 'Laravel') }}</title>
        <link rel="icon" href="/images/favicon-64.png" type="image/png" sizes="64x64">
        <link rel="icon" href="/images/favicon-32.png" type="image/png" sizes="32x32">
        <link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
        <script>
            // Applied before paint (and before React mounts) to avoid a
            // light-mode flash when the user's saved preference is dark.
            (function () {
                var saved = localStorage.getItem('kaldi-theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (saved === 'dark' || (!saved && prefersDark)) {
                    document.documentElement.classList.add('dark');
                }
            })();
        </script>
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', 'resources/css/app.css'])
        @inertiaHead
    </head>
    <body class="bg-background text-foreground antialiased">
        @inertia
    </body>
</html>
