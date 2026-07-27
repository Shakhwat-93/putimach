<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="no-dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>@yield('title', 'PutiMach | Premium Vintage Fashion & Heritage Craft')</title>
    <meta name="description" content="@yield('meta_description', 'High-end, luxury, vintage-style fashion e-commerce. Timeless storytelling and handcrafted heritage clothing.')">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Favicon -->
    <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon">
    <link rel="icon" href="/favicon.png" type="image/png">

    <!-- Vite Styles and Scripts -->
    @vite(['resources/css/app.css', 'resources/js/app.js'])

    <!-- LCP Image Preload for Performance (PDF Section 7/9) -->
    @if(Route::is('home'))
        <link rel="preload" fetchpriority="high" as="image" href="{{ $settings['heroBgImage'] ?? 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=75' }}">
    @endif
</head>
<body class="min-h-screen flex flex-col w-full max-w-full overflow-x-hidden bg-[#FDFBF7] text-[#1C1613] vintage-grain">
    <!-- Transparent vintage-grain overlay handled by CSS ::before -->

    <!-- Welcome Popup Component (Triggered once per session) -->
    @include('layouts.partials.welcome-popup')

    <div id="main-header-container" class="fixed inset-x-0 top-0 z-50 flex flex-col transition-all duration-300 {{ Route::is('home') ? 'bg-transparent border-transparent text-[#1C1613]' : 'bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#E9E2D2] text-[#1C1613]' }}">
        @include('layouts.partials.header')
    </div>

    <!-- Main Content Area -->
    <main class="flex-1 w-full max-w-full overflow-x-hidden {{ Route::is('home') ? 'pt-0' : 'pt-[110px]' }} pb-16">
        @yield('content')
    </main>

    @include('layouts.partials.footer')
    @include('layouts.partials.cart-drawer')
    @include('layouts.partials.mobile-menu')

    <!-- Toast Container -->
    <div id="toast-container" class="fixed bottom-5 right-5 z-[200] flex flex-col gap-2.5 max-w-sm pointer-events-none"></div>

    <!-- Core Scripts -->
    <script src="/assets/js/analytics.js" defer></script>
    <script src="/assets/js/cart.js" defer></script>
    <script>
        // Image Protection Controls
        document.addEventListener('DOMContentLoaded', () => {
            // Disable right click on images
            document.addEventListener('contextmenu', (e) => {
                if (e.target.tagName === 'IMG' || e.target.closest('.image-shield-container')) {
                    e.preventDefault();
                }
            });

            // Disable drag on images
            document.addEventListener('dragstart', (e) => {
                if (e.target.tagName === 'IMG') {
                    e.preventDefault();
                }
            });
        });

        // Header Scroll Transition (Swap Logo for Search Bar and handle Homepage transparent header)
        window.addEventListener('scroll', () => {
            const headerContainer = document.getElementById('main-header-container');
            const logoContainer = document.getElementById('header-logo-container');
            const searchContainer = document.getElementById('header-search-container');
            const desktopSearchRow = document.getElementById('desktop-search-row');
            const isScroll = window.scrollY > 40;

            // Handle Homepage transparent header transition
            if (headerContainer && {{ Route::is('home') ? 'true' : 'false' }}) {
                if (window.scrollY > 20) {
                    headerContainer.classList.remove('bg-transparent', 'border-transparent');
                    headerContainer.classList.add('bg-[#FDFBF7]/90', 'backdrop-blur-md', 'border-b', 'border-[#E9E2D2]');
                } else {
                    headerContainer.classList.add('bg-transparent', 'border-transparent');
                    headerContainer.classList.remove('bg-[#FDFBF7]/90', 'backdrop-blur-md', 'border-b', 'border-[#E9E2D2]');
                }
            }

            if (logoContainer && searchContainer) {
                if (isScroll) {
                    logoContainer.classList.add('opacity-0', 'pointer-events-none', '-translate-y-4');
                    logoContainer.classList.remove('opacity-100');
                    
                    searchContainer.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
                    searchContainer.classList.add('opacity-100');

                    if (desktopSearchRow) {
                        desktopSearchRow.classList.add('opacity-0', 'pointer-events-none', '-translate-y-2');
                        desktopSearchRow.classList.remove('opacity-100');
                    }
                } else {
                    logoContainer.classList.remove('opacity-0', '-translate-y-4');
                    logoContainer.classList.add('opacity-100');
                    
                    searchContainer.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
                    searchContainer.classList.remove('opacity-100');

                    if (desktopSearchRow) {
                        desktopSearchRow.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-2');
                        desktopSearchRow.classList.add('opacity-100');
                    }
                }
            }
        });
    </script>
    @yield('scripts')
</body>
</html>
