<div class="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
    <!-- Header Main Bar -->
    <div class="relative flex items-center justify-between h-14">
        <!-- Left: Menu Toggle Button (Drawer) -->
        <div class="flex items-center">
            <button onclick="toggleMobileMenu(true)" class="flex items-center gap-2 text-[#1C1613] hover:text-[#C5A880] transition-colors focus:outline-none cursor-pointer group" aria-label="Open menu">
                <span class="relative flex flex-col gap-1 w-6">
                    <span class="h-[2.5px] w-6 bg-[#1C1613] group-hover:bg-[#C5A880] transition-all"></span>
                    <span class="h-[2.5px] w-4 bg-[#1C1613] group-hover:bg-[#C5A880] transition-all"></span>
                    <span class="h-[2.5px] w-6 bg-[#1C1613] group-hover:bg-[#C5A880] transition-all"></span>
                </span>
                <span class="hidden md:inline text-xs font-bold uppercase tracking-vintage mt-0.5">Menu</span>
            </button>
        </div>

        <!-- Center Stack: Logo & Scroll-Swapped Search Bar -->
        <div class="flex-1 flex justify-center items-center relative h-12 overflow-hidden mx-4">
            <!-- PutiMach Logo (Visible at top) -->
            <div id="header-logo-container" class="absolute inset-0 flex justify-center items-center transition-all duration-300 transform opacity-100 translate-y-0">
                <a href="/" class="text-xl sm:text-2xl font-serif font-bold tracking-[0.2em] text-[#1C1613] hover:opacity-80 transition-opacity">
                    PUTIMACH
                </a>
            </div>

            <!-- Scroll-Swapped Search Bar (Initially Hidden) -->
            <div id="header-search-container" class="absolute inset-0 flex justify-center items-center transition-all duration-300 transform opacity-0 pointer-events-none translate-y-4 w-full max-w-md mx-auto">
                <form action="/shop" method="GET" class="w-full relative">
                    <input type="text" name="search" placeholder="Search heritage collection..." value="{{ request('search') }}" class="w-full bg-[#F5F2EB] border border-[#E9E2D2] text-[#1C1613] pl-10 pr-4 py-1.5 text-xs tracking-wider placeholder-[#7C6E65] focus:outline-none focus:border-[#C5A880] transition-all uppercase" />
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C6E65]">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </span>
                </form>
            </div>
        </div>

        <!-- Right: Shopping Cart Trigger -->
        <div class="flex items-center">
            <button onclick="toggleCartDrawer(true)" class="flex items-center gap-2 text-[#1C1613] hover:text-[#C5A880] transition-colors focus:outline-none cursor-pointer group" aria-label="Open cart">
                <span class="hidden md:inline text-xs font-bold uppercase tracking-vintage mt-0.5">Bag</span>
                <span class="relative">
                    <svg class="h-5 w-5 stroke-[2.5] group-hover:scale-105 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                    <span id="cart-count-badge" class="absolute -top-1.5 -right-2 hidden bg-[#C5A880] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">0</span>
                </span>
            </button>
        </div>
    </div>

    <!-- Below Header: Search Bar (Fades out on scroll) -->
    @if(!Route::is('home'))
    <div id="desktop-search-row" class="mt-2 transition-all duration-300 w-full max-w-lg mx-auto">
        <form action="/shop" method="GET" class="relative">
            <input type="text" name="search" placeholder="Search vintage garments, sarees, accessories..." value="{{ request('search') }}" class="w-full bg-[#FDFBF7] border border-[#E9E2D2] text-[#1C1613] pl-11 pr-4 py-2.5 text-xs tracking-wider placeholder-[#7C6E65] focus:outline-none focus:border-[#C5A880] transition-all uppercase" />
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[#7C6E65]">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </span>
        </form>
    </div>
    @endif
</div>


<script>
    // Accordion controller (collapses others when one opens, PDF Section 17)
    function toggleAccordion(id) {
        const activePanel = document.getElementById('panel-' + id);
        const activeChevron = document.getElementById('chevron-' + id);
        if (!activePanel) return;

        const allPanels = document.querySelectorAll('[id^="panel-nav-cat-"]');
        const allChevrons = document.querySelectorAll('[id^="chevron-nav-cat-"]');

        allPanels.forEach((panel) => {
            if (panel.id !== 'panel-' + id) {
                panel.classList.add('hidden');
            }
        });

        allChevrons.forEach((chevron) => {
            if (chevron.id !== 'chevron-' + id) {
                chevron.classList.remove('rotate-180');
            }
        });

        if (activePanel.classList.contains('hidden')) {
            activePanel.classList.remove('hidden');
            activeChevron.classList.add('rotate-180');
        } else {
            activePanel.classList.add('hidden');
            activeChevron.classList.remove('rotate-180');
        }
    }
</script>
