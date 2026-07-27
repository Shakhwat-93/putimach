<!-- Mobile Navigation Drawer Overlay -->
<div id="mobile-menu" class="fixed inset-0 z-[100] flex justify-start bg-black/40 backdrop-blur-xs transition-opacity duration-300 pointer-events-none opacity-0">
    <!-- Backdrop click close -->
    <div onclick="toggleMobileMenu(false)" class="absolute inset-0 cursor-pointer"></div>

    <!-- Navigation Panel (Slides from left to right) -->
    <div class="relative w-[85%] sm:max-w-xs h-full bg-[#FDFBF7] p-6 border-r border-[#E9E2D2] shadow-2xl transition-transform duration-300 -translate-x-full flex flex-col justify-between z-10">
        <div>
            <!-- Mobile Menu Header -->
            <div class="flex items-center justify-between pb-4 border-b border-[#E9E2D2]">
                <span class="font-serif font-bold text-lg tracking-wider text-[#1C1613]">PUTIMACH</span>
                <button onclick="toggleMobileMenu(false)" class="p-2 text-[#7C6E65] hover:text-[#1C1613] focus:outline-none cursor-pointer">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>

            <!-- Dynamic Navigation Menu from Admin Panel -->
            <nav class="mt-6 flex flex-col">
                @php $accIdx = 0; @endphp
                @foreach($navMenu as $item)
                    @if(($item['type'] ?? 'link') === 'category' && !empty($item['subs']))
                        {{-- Accordion item with sub-links --}}
                        <div class="border-b border-[#E9E2D2]/50">
                            <button onclick="toggleAccordion('nav-cat-{{ $accIdx }}')" class="flex w-full items-center justify-between rounded-lg px-4 py-3.5 text-xs font-semibold uppercase tracking-vintage text-[#1C1613] hover:text-[#C5A880] transition-all focus:outline-none cursor-pointer">
                                <span>{{ $item['label'] }}</span>
                                <svg id="chevron-nav-cat-{{ $accIdx }}" class="w-3.5 h-3.5 text-[#7C6E65] transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                            </button>
                            <div id="panel-nav-cat-{{ $accIdx }}" class="hidden pl-6 pr-4 py-1.5 flex flex-col gap-2 transition-all duration-300 bg-[#F5F2EB]/30">
                                <a href="{{ $item['url'] ?? '#' }}" onclick="toggleMobileMenu(false)" class="text-[11px] uppercase tracking-wider py-1.5 text-[#7C6E65] hover:text-[#C5A880]">View All {{ $item['label'] }}</a>
                                @foreach($item['subs'] as $sub)
                                    <a href="{{ $sub['url'] ?? '#' }}" onclick="toggleMobileMenu(false)" class="text-[11px] uppercase tracking-wider py-1.5 text-[#7C6E65] hover:text-[#C5A880]">{{ $sub['label'] }}</a>
                                @endforeach
                            </div>
                        </div>
                        @php $accIdx++; @endphp
                    @else
                        {{-- Simple link item --}}
                        <div class="border-b border-[#E9E2D2]/50">
                            <a href="{{ $item['url'] ?? '#' }}" onclick="toggleMobileMenu(false)" class="flex items-center justify-between rounded-lg px-4 py-3.5 text-xs font-semibold uppercase tracking-vintage text-[#1C1613] hover:text-[#C5A880] transition-colors">
                                <span>{{ $item['label'] }}</span>
                            </a>
                        </div>
                    @endif
                @endforeach
            </nav>
        </div>

        <!-- Mobile Drawer Footer Info -->
        <div class="pt-6 border-t border-[#E9E2D2] space-y-4">
            <a href="/order/track" onclick="toggleMobileMenu(false)" class="border border-[#E9E2D2] text-[#1C1613] hover:border-[#C5A880] w-full text-center flex items-center justify-center gap-2 text-xs py-3.5 bg-[#F5F2EB]/20 transition-all font-semibold uppercase tracking-vintage">
                <svg class="w-4 h-4 text-[#C5A880]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                <span>Track My Order</span>
            </a>
            <a href="/account" onclick="toggleMobileMenu(false)" class="btn-vintage-solid w-full text-center flex items-center justify-center gap-2 text-xs py-3.5">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                <span>My Account</span>
            </a>
            <p class="text-[9px] text-[#7C6E65] font-semibold uppercase tracking-vintage text-center">PUTIMACH EST. 2026</p>
        </div>
    </div>
</div>
