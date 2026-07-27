@extends('layouts.app')

@section('title', 'PutiMach | Timeless Heritage & Handcrafted Vintage Fashion')

@section('content')
<div class="space-y-20 pb-20">
    <!-- Cinematic Hero Section -->
    <section class="relative h-screen flex items-center justify-center bg-[#9C8975] overflow-hidden border-b border-[#E9E2D2]" style="height: 100vh; min-height: 100vh;">
        <div class="absolute inset-0 z-0 bg-[#9C8975]">
            <img src="{{ $settings['heroBgImage'] ?? 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=75' }}" alt="Vintage Fashion Collection" class="w-full h-full object-cover" fetchpriority="high" draggable="false" />
            <div class="absolute inset-0 bg-gradient-to-r from-[#FDFBF7]/20 via-transparent to-[#FDFBF7]/20"></div>
        </div>
        
        <div class="relative z-10 text-center px-4 max-w-3xl mx-auto -translate-y-20">
            <div class="animate-fade-in-up">
                <a href="/shop" class="border border-[#1C1613]/30 bg-[#9C8975]/35 backdrop-blur-sm text-[#1C1613] hover:bg-[#1C1613] hover:text-[#FDFBF7] hover:border-[#1C1613] font-black tracking-[0.25em] text-sm uppercase px-8 py-4 transition-all duration-300 inline-block cursor-pointer">
                    {{ $settings['heroButtonText'] ?? 'Shop Now' }}
                </a>
            </div>
        </div>
    </section>

    <!-- Categories Showcase (PDF Section 1) -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div class="text-center space-y-3 mb-12">
            <p class="text-[10px] font-bold text-[#C5A880] uppercase tracking-[0.25em]">
                {{ $settings['collectionsLabel'] ?? 'THE SECTIONS' }}
            </p>
            <h2 class="text-3xl font-serif text-[#1C1613] uppercase tracking-wider">
                {{ $settings['collectionsTitle'] ?? 'Browse Curated Archives' }}
            </h2>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            @php
                $catFallbackImages = [
                    'men' => 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=650&q=70',
                    'women' => 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=650&q=70',
                    'accessories' => 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=650&q=70'
                ];
            @endphp

            @foreach($categories as $cat)
                @php
                    $catData = is_array($cat) ? ($cat['data'] ?? $cat) : json_decode($cat->data, true);
                    $catSlug = $catData['slug'] ?? 'shop';
                    $catName = $catData['name'] ?? 'Vintage';
                    $catImg = $catData['image_url'] ?? ($catFallbackImages[strtolower($catSlug)] ?? 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=650&q=70');
                @endphp
                <a href="/shop?category={{ $catSlug }}" class="relative block aspect-[16/10] md:aspect-[4/3] overflow-hidden group border border-[#E9E2D2]">
                    <img src="{{ $catImg }}" alt="{{ $catName }} Collection" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" decoding="async" />
                    <div class="absolute inset-0 bg-[#1C1613]/20 group-hover:bg-[#1C1613]/30 transition-colors"></div>
                    <div class="absolute inset-0 flex flex-col justify-end p-6">
                        <span class="text-[9px] font-bold text-[#C5A880] uppercase tracking-widest mb-1">Explore Range</span>
                        <h3 class="text-xl font-serif text-white uppercase tracking-wider">{{ $catName }}</h3>
                    </div>
                </a>
            @endforeach
        </div>
    </section>

    <!-- Keep Shopping Section (Recently Viewed, PDF Section 1.2) -->
    @if(!empty($keepShopping))
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-baseline justify-between border-b border-[#E9E2D2] pb-3 mb-8">
            <h2 class="text-lg font-serif font-semibold uppercase tracking-vintage text-[#1C1613]">Keep Shopping</h2>
            <span class="text-[10px] text-[#7C6E65] uppercase tracking-vintage">Based on your recent views</span>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            @foreach($keepShopping as $prod)
                @include('layouts.partials.product-card', ['product' => $prod, 'isSmall' => true])
            @endforeach
        </div>
    </section>
    @endif

    <!-- Recommended For You (PDF Section 1.2) -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-baseline justify-between border-b border-[#E9E2D2] pb-3 mb-8">
            <h2 class="text-lg font-serif font-semibold uppercase tracking-vintage text-[#1C1613]">Recommended For You</h2>
            <a href="/shop?sort=popular" class="text-xs font-semibold text-[#C5A880] uppercase tracking-vintage hover:text-[#1C1613] transition-colors">
                View All
            </a>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
            @foreach($recommended as $prod)
                @include('layouts.partials.product-card', ['product' => $prod])
            @endforeach
        </div>
    </section>

    <!-- Our Story Section (Vintage heritage storytelling, PDF Section 1.2) -->
    <section class="bg-[#F5F2EB] py-20 border-y border-[#E9E2D2]">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <!-- Story Image Grid -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="h-80 overflow-hidden border border-[#E9E2D2]">
                        <img src="{{ $settings['brandStoryImage'] ?? $settings['storyImage1'] ?? 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80' }}" alt="Handcrafted brass detailing" class="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" decoding="async" />
                    </div>
                    <div class="h-80 overflow-hidden border border-[#E9E2D2] mt-8">
                        <img src="{{ $settings['brandStoryImage2'] ?? $settings['storyImage2'] ?? 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80' }}" alt="Fine threads weaving" class="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" decoding="async" />
                    </div>
                </div>
                
                <!-- Story Content -->
                <div class="space-y-6 lg:pl-8">
                    <p class="text-[10px] font-bold text-[#C5A880] uppercase tracking-[0.25em]">{{ $settings['brandStoryLabel'] ?? $settings['storyLabel'] ?? 'OUR HERITAGE & STORIES' }}</p>
                    <h2 class="text-3xl md:text-5xl font-serif text-[#1C1613] tracking-wide uppercase leading-tight">
                        {!! nl2br(e($settings['brandStoryTitle'] ?? $settings['storyTitle'] ?? "Woven in Nostalgia,\nTailored for Today.")) !!}
                    </h2>
                    <p class="text-xs text-[#7C6E65] uppercase tracking-wider leading-relaxed">
                        {{ $settings['brandStoryText1'] ?? $settings['storySubtext1'] ?? 'At PutiMach, we reject the noise of fast fashion. Our collection is built upon the rhythm of antique wooden looms, handloomed yarns, and organic dyes that whisper stories of the past.' }}
                    </p>
                    <p class="text-xs text-[#7C6E65] uppercase tracking-wider leading-relaxed">
                        {{ $settings['brandStoryText2'] ?? $settings['storySubtext2'] ?? 'Every button is selected to age, every stitch is positioned to hold, and every weave carries the legacy of master weavers of Sonargaon and Tangail.' }}
                    </p>
                    <div class="pt-4">
                        <a href="/about" class="btn-vintage tracking-[0.2em] text-[10px]">
                            {{ $settings['brandStoryButtonText'] ?? $settings['storyButtonText'] ?? 'Explore Our Craft' }}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Discount / Offers (PDF Section 1.2) -->
    @if(!empty($offers))
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-baseline justify-between border-b border-[#E9E2D2] pb-3 mb-8">
            <h2 class="text-lg font-serif font-semibold uppercase tracking-vintage text-[#1C1613]">Exclusive Offers</h2>
            <span class="text-[10px] text-[#C5A880] font-bold uppercase tracking-vintage">Limited Vintage Pieces</span>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
            @foreach($offers as $prod)
                @include('layouts.partials.product-card', ['product' => $prod])
            @endforeach
        </div>
    </section>
    @endif

    <!-- New Arrivals (PDF Section 1.2) -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-baseline justify-between border-b border-[#E9E2D2] pb-3 mb-8">
            <h2 class="text-lg font-serif font-semibold uppercase tracking-vintage text-[#1C1613]">New Arrivals</h2>
            <a href="/shop?sort=newest" class="text-xs font-semibold text-[#C5A880] uppercase tracking-vintage hover:text-[#1C1613] transition-colors">
                Explore All
            </a>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
            @foreach($newArrivals as $prod)
                @include('layouts.partials.product-card', ['product' => $prod])
            @endforeach
        </div>
    </section>

    <!-- Vintage Instagram Gallery (Asymmetric grid, PDF Section 1) -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <a href="{{ $settings['instagramUrl'] ?? 'https://www.instagram.com/putimach' }}" target="_blank" rel="noopener" class="block text-center space-y-3 mb-12 group">
            <p class="text-[9px] font-bold text-[#C5A880] uppercase tracking-[0.25em]">{{ $settings['instagramLabel'] ?? '#PUTIMACHSTORIES' }}</p>
            <h2 class="text-2xl sm:text-4xl font-serif text-[#1C1613] group-hover:text-[#C5A880] uppercase tracking-wider transition-colors">{{ $settings['instagramTitle'] ?? 'ON INSTAGRAM' }}</h2>
        </a>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div class="h-64 overflow-hidden border border-[#E9E2D2] relative group">
                <img src="{{ $settings['instagramImage1'] ?? 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=70' }}" alt="Instagram style" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                <div class="absolute inset-0 bg-[#1C1613]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs tracking-widest font-sans uppercase">VIEW STYLING</div>
            </div>
            <div class="h-64 overflow-hidden border border-[#E9E2D2] md:mt-6 relative group">
                <img src="{{ $settings['instagramImage2'] ?? 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=70' }}" alt="Instagram style" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                <div class="absolute inset-0 bg-[#1C1613]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs tracking-widest font-sans uppercase">VIEW WEAVE</div>
            </div>
            <div class="h-64 overflow-hidden border border-[#E9E2D2] relative group">
                <img src="{{ $settings['instagramImage3'] ?? 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=400&q=70' }}" alt="Instagram style" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                <div class="absolute inset-0 bg-[#1C1613]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs tracking-widest font-sans uppercase">VIEW FABRIC</div>
            </div>
            <div class="h-64 overflow-hidden border border-[#E9E2D2] md:mt-6 relative group">
                <img src="{{ $settings['instagramImage4'] ?? 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=70' }}" alt="Instagram style" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                <div class="absolute inset-0 bg-[#1C1613]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs tracking-widest font-sans uppercase">VIEW DETAIL</div>
            </div>
            <div class="h-64 overflow-hidden border border-[#E9E2D2] relative group">
                <img src="{{ $settings['instagramImage5'] ?? 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=70' }}" alt="Instagram style" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                <div class="absolute inset-0 bg-[#1C1613]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs tracking-widest font-sans uppercase">VIEW EDIT</div>
            </div>
        </div>
    </section>
</div>
@endsection
