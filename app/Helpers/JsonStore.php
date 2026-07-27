<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class JsonStore
{
    protected static function getFile($filename, $default = [])
    {
        $path = 'json_store/' . $filename;
        if (!Storage::exists($path)) {
            static::initializeFile($filename);
        }
        
        $content = Storage::get($path);
        return json_decode($content, true) ?: $default;
    }

    protected static function saveFile($filename, $data)
    {
        $path = 'json_store/' . $filename;
        Storage::put($path, json_encode($data, JSON_PRETTY_PRINT));
    }

    public static function getProducts()
    {
        $filename = 'products.json';
        $path = 'json_store/' . $filename;
        $cacheDuration = 120; // 2 minutes

        $forceRefresh = request()->has('clear_cache') || request()->has('refresh');

        $normalizeProduct = function ($p) {
            // 1. Normalize Category
            $p['category_slug'] = $p['category_slug'] ?? $p['category'] ?? 'women';
            $p['category'] = $p['category'] ?? $p['category_slug'] ?? 'women';

            // 2. Normalize Image
            if (empty($p['image'])) {
                if (!empty($p['images']) && is_array($p['images'])) {
                    $firstImg = $p['images'][0];
                    $p['image'] = is_array($firstImg) ? ($firstImg['url'] ?? '') : $firstImg;
                } else {
                    $p['image'] = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80';
                }
            }

            // 3. Normalize Gallery
            if (empty($p['gallery'])) {
                if (!empty($p['images']) && is_array($p['images'])) {
                    $p['gallery'] = array_map(function ($img) {
                        return is_array($img) ? ($img['url'] ?? '') : $img;
                    }, $p['images']);
                } else {
                    $p['gallery'] = [$p['image']];
                }
            }

            // 4. Normalize Description
            $p['description'] = $p['description'] ?? $p['shortDescription'] ?? $p['story'] ?? '';

            // 5. Normalize Sizes
            if (empty($p['sizes']) || !is_array($p['sizes'])) {
                $sizes = [];
                if (!empty($p['variants']) && is_array($p['variants'])) {
                    foreach ($p['variants'] as $v) {
                        if (!empty($v['size'])) {
                            $sizes[] = $v['size'];
                        }
                    }
                }
                $p['sizes'] = !empty($sizes) ? array_values(array_unique($sizes)) : ['Free Size'];
            }

            // 6. Normalize Colors
            if (empty($p['colors']) || !is_array($p['colors'])) {
                $colors = [];
                if (!empty($p['variants']) && is_array($p['variants'])) {
                    foreach ($p['variants'] as $v) {
                        if (!empty($v['color'])) {
                            $colors[] = $v['color'];
                        } elseif (!empty($v['name'])) {
                            $colors[] = $v['name'];
                        }
                    }
                }
                $p['colors'] = !empty($colors) ? array_values(array_unique($colors)) : ['Standard'];
            }

            return $p;
        };

        if (!$forceRefresh && \Illuminate\Support\Facades\Storage::exists($path)) {
            $lastModified = \Illuminate\Support\Facades\Storage::lastModified($path);
            if (time() - $lastModified < $cacheDuration) {
                $content = \Illuminate\Support\Facades\Storage::get($path);
                $decoded = json_decode($content, true);
                if (!empty($decoded)) {
                    return array_map($normalizeProduct, $decoded);
                }
            }
        }

        try {
            $service = new \App\Services\SupabaseService();
            $products = $service->getCatalogProducts();
            if (!empty($products)) {
                $products = array_map($normalizeProduct, $products);
                static::saveProducts($products);
                return $products;
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Supabase getCatalogProducts failed, using local fallback: " . $e->getMessage());
        }
        
        $localProducts = static::getFile($filename);
        return array_map($normalizeProduct, $localProducts);
    }

    public static function saveProducts($products)
    {
        static::saveFile('products.json', $products);
    }

    public static function getCategories()
    {
        $filename = 'categories.json';
        $path = 'json_store/' . $filename;
        $cacheDuration = 120; // 2 minutes

        $forceRefresh = request()->has('clear_cache') || request()->has('refresh');

        if (!$forceRefresh && \Illuminate\Support\Facades\Storage::exists($path)) {
            $lastModified = \Illuminate\Support\Facades\Storage::lastModified($path);
            if (time() - $lastModified < $cacheDuration) {
                $content = \Illuminate\Support\Facades\Storage::get($path);
                $decoded = json_decode($content, true);
                if (!empty($decoded)) {
                    return $decoded;
                }
            }
        }

        try {
            $service = new \App\Services\SupabaseService();
            $categories = $service->getCatalogCategories();
            if (!empty($categories)) {
                static::saveCategories($categories);
                return $categories;
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Supabase getCatalogCategories failed, using local fallback: " . $e->getMessage());
        }
        return static::getFile($filename);
    }

    public static function saveCategories($categories)
    {
        static::saveFile('categories.json', $categories);
    }

    public static function getReviews()
    {
        return static::getFile('reviews.json');
    }

    public static function saveReviews($reviews)
    {
        static::saveFile('reviews.json', $reviews);
    }

    public static function getSettings()
    {
        $filename = 'settings.json';
        $path = 'json_store/' . $filename;
        $cacheDuration = 120; // 2 minutes

        $forceRefresh = request()->has('clear_cache') || request()->has('refresh');

        if (!$forceRefresh && \Illuminate\Support\Facades\Storage::exists($path)) {
            $lastModified = \Illuminate\Support\Facades\Storage::lastModified($path);
            if (time() - $lastModified < $cacheDuration) {
                $content = \Illuminate\Support\Facades\Storage::get($path);
                $decoded = json_decode($content, true);
                if (!empty($decoded)) {
                    return $decoded;
                }
            }
        }

        try {
            $service = new \App\Services\SupabaseService();
            $settings = $service->getCatalogSettings();
            if (!empty($settings)) {
                static::saveSettings($settings);
                return $settings;
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Supabase getCatalogSettings failed, using local fallback: " . $e->getMessage());
        }
        return static::getFile($filename);
    }

    public static function saveSettings($settings)
    {
        static::saveFile('settings.json', $settings);
        try {
            $service = new \App\Services\SupabaseService();
            $service->updateCatalogSettings($settings);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Supabase updateCatalogSettings failed: " . $e->getMessage());
        }
    }

    public static function getShopSlider()
    {
        $filename = 'shop_slider.json';
        $path = 'json_store/' . $filename;
        $cacheDuration = 120; // 2 minutes

        $forceRefresh = request()->has('clear_cache') || request()->has('refresh');

        if (!$forceRefresh && \Illuminate\Support\Facades\Storage::exists($path)) {
            $lastModified = \Illuminate\Support\Facades\Storage::lastModified($path);
            if (time() - $lastModified < $cacheDuration) {
                $content = \Illuminate\Support\Facades\Storage::get($path);
                $decoded = json_decode($content, true);
                if (is_array($decoded)) {
                    return $decoded;
                }
            }
        }

        try {
            $service = new \App\Services\SupabaseService();
            $slider = $service->getShopSliderSettings();
            if (is_array($slider) && !empty($slider)) {
                static::saveShopSlider($slider);
                return $slider;
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Supabase getShopSlider failed, using local fallback: " . $e->getMessage());
        }
        return static::getFile($filename, []);
    }

    public static function saveShopSlider($slider)
    {
        static::saveFile('shop_slider.json', $slider);
    }

    public static function getNavMenu()
    {
        $filename = 'nav_menu.json';
        $path = 'json_store/' . $filename;
        $cacheDuration = 120; // 2 minutes

        $forceRefresh = request()->has('clear_cache') || request()->has('refresh');

        if (!$forceRefresh && \Illuminate\Support\Facades\Storage::exists($path)) {
            $lastModified = \Illuminate\Support\Facades\Storage::lastModified($path);
            if (time() - $lastModified < $cacheDuration) {
                $content = \Illuminate\Support\Facades\Storage::get($path);
                $decoded = json_decode($content, true);
                if (!empty($decoded)) {
                    return $decoded;
                }
            }
        }

        try {
            $service = new \App\Services\SupabaseService();
            $menu = $service->getNavMenu();
            if (!empty($menu)) {
                static::saveNavMenu($menu);
                return $menu;
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Supabase getNavMenu failed, using local fallback: " . $e->getMessage());
        }

        return static::getFile($filename) ?: \App\Services\FallbackData::navMenu();
    }

    public static function saveNavMenu($menu)
    {
        static::saveFile('nav_menu.json', $menu);
    }

    public static function getOrders()
    {
        return static::getFile('orders.json');
    }

    public static function saveOrders($orders)
    {
        static::saveFile('orders.json', $orders);
    }

    public static function getTasks()
    {
        return static::getFile('tasks.json');
    }

    public static function saveTasks($tasks)
    {
        static::saveFile('tasks.json', $tasks);
    }

    public static function getContentPlans()
    {
        return static::getFile('content_plans.json');
    }

    public static function saveContentPlans($plans)
    {
        static::saveFile('content_plans.json', $plans);
    }

    public static function getFinancePlans()
    {
        return static::getFile('finance_plans.json');
    }

    public static function saveFinancePlans($plans)
    {
        static::saveFile('finance_plans.json', $plans);
    }

    public static function getCourierConfigs()
    {
        return static::getFile('couriers.json');
    }

    public static function saveCourierConfigs($configs)
    {
        static::saveFile('couriers.json', $configs);
    }

    public static function getBackupLogs()
    {
        return static::getFile('backups.json');
    }

    public static function saveBackupLogs($logs)
    {
        static::saveFile('backups.json', $logs);
    }


    protected static function initializeFile($filename)
    {
        $data = [];
        
        if ($filename === 'categories.json') {
            $data = [
                ['id' => 1, 'name' => 'Men', 'slug' => 'men', 'parent_id' => null],
                ['id' => 2, 'name' => 'Women', 'slug' => 'women', 'parent_id' => null],
                ['id' => 3, 'name' => 'Accessories', 'slug' => 'accessories', 'parent_id' => null],
            ];
        } 
        elseif ($filename === 'products.json') {
            $data = [
                [
                    'id' => 1,
                    'category_id' => 2, // Women
                    'category_slug' => 'women',
                    'name' => 'Vintage Silk Jamdani Saree',
                    'slug' => 'vintage-silk-jamdani-saree',
                    'price' => 9500,
                    'sale_price' => 7800,
                    'stock' => 5,
                    'sizes' => ['Free Size'],
                    'colors' => ['Antique Gold', 'Crimson Ivory', 'Emerald Green'],
                    'image' => 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
                    'gallery' => [
                        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'
                    ],
                    'measurement_diagram' => 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=800&q=80',
                    'short_description' => 'A royal handloomed silk saree featuring traditional gold geometric motifs.',
                    'description' => 'Woven by master artisans in Sonargaon using ancient looms. This vintage silk Jamdani saree embodies old-world Bengali royalty. Made with 100% fine organic mulberry silk, featuring premium zardozi borders and antique gold threadwork. The fabric is lightweight, flowing, and designed to drape with class.',
                    'is_featured' => true,
                    'is_new' => true,
                    'rating' => 4.8,
                    'created_at' => now()->subDays(2)->toDateTimeString()
                ],
                [
                    'id' => 2,
                    'category_id' => 1, // Men
                    'category_slug' => 'men',
                    'name' => 'Heritage Tussar Panjabi',
                    'slug' => 'heritage-tussar-panjabi',
                    'price' => 5200,
                    'sale_price' => null,
                    'stock' => 12,
                    'sizes' => ['M', 'L', 'XL'],
                    'colors' => ['Raw Silk Cream', 'Espresso Brown', 'Muted Olive'],
                    'image' => 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=800&q=80',
                    'gallery' => [
                        'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=800&q=80'
                    ],
                    'measurement_diagram' => 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=800&q=80',
                    'short_description' => 'Elegant Tussar silk Panjabi featuring handcrafted thread embroidery.',
                    'description' => 'Crafted from hand-spun Tussar silk, this Panjabi features an heritage regular-fit cut with structured collars. Accentuated with vintage copper buttons and subtle tonal embroidery along the placket. A true mark of sophisticated heritage wear.',
                    'is_featured' => true,
                    'is_new' => false,
                    'rating' => 4.6,
                    'created_at' => now()->subDays(5)->toDateTimeString()
                ],
                [
                    'id' => 3,
                    'category_id' => 2, // Women
                    'category_slug' => 'women',
                    'name' => 'Retro Double-Breasted Trench Coat',
                    'slug' => 'retro-trench-coat',
                    'price' => 8900,
                    'sale_price' => 6900,
                    'stock' => 3,
                    'sizes' => ['S', 'M', 'L'],
                    'colors' => ['Khaki Beige', 'Classic Charcoal'],
                    'image' => 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
                    'gallery' => [
                        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80'
                    ],
                    'measurement_diagram' => null,
                    'short_description' => 'Vintage-style wool blend double-breasted coat with antique buckle belts.',
                    'description' => 'A classic double-breasted coat with custom wide lapels and antique-finish buttons. Keeps you warm while exuding timeless, old-money style. Fully lined with satin for maximum comfort.',
                    'is_featured' => false,
                    'is_new' => true,
                    'rating' => 5.0,
                    'created_at' => now()->subDays(1)->toDateTimeString()
                ],
                [
                    'id' => 4,
                    'category_id' => 3, // Accessories
                    'category_slug' => 'accessories',
                    'name' => 'Antique Hand-Carved Brass Clutch',
                    'slug' => 'antique-brass-clutch',
                    'price' => 6500,
                    'sale_price' => null,
                    'stock' => 4,
                    'sizes' => ['One Size'],
                    'colors' => ['Antique Brass Gold'],
                    'image' => 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
                    'gallery' => [
                        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'
                    ],
                    'measurement_diagram' => null,
                    'short_description' => 'A metal jewelry box clutch hand-carved in pure brass.',
                    'description' => 'Individually hand-carved by metal artisans using vintage casting methods. It features beautiful filigree detailing, a soft crimson velvet inner lining, and an antique gold chain strap. Fits phone, keys, and cards perfectly.',
                    'is_featured' => true,
                    'is_new' => false,
                    'rating' => 4.9,
                    'created_at' => now()->subDays(10)->toDateTimeString()
                ],
                [
                    'id' => 5,
                    'category_id' => 1, // Men
                    'category_slug' => 'men',
                    'name' => 'Vintage Cotton Linen Kurta',
                    'slug' => 'vintage-linen-kurta',
                    'price' => 3500,
                    'sale_price' => 2800,
                    'stock' => 15,
                    'sizes' => ['M', 'L', 'XL'],
                    'colors' => ['Sage Green', 'Warm Cream', 'Sky Blue'],
                    'image' => 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
                    'gallery' => [
                        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'
                    ],
                    'measurement_diagram' => null,
                    'short_description' => 'Casual vintage-cut organic cotton linen kurta.',
                    'description' => 'Crafted from an organic blend of 60% linen and 40% cotton. Stonewashed for ultimate vintage texture and softness. Detailed with wooden buttons and a minimal band collar. Perfect for everyday luxury comfort.',
                    'is_featured' => false,
                    'is_new' => false,
                    'rating' => 4.5,
                    'created_at' => now()->subDays(8)->toDateTimeString()
                ]
            ];
        }
        elseif ($filename === 'reviews.json') {
            $data = [
                [
                    'id' => 1,
                    'product_id' => 1,
                    'customer_name' => 'Tahmid Rahman',
                    'rating' => 5,
                    'comment' => 'Beautiful saree! The silk is top-notch and the antique gold zari borders look stunning. Delivered inside Dhaka within 24 hours. Recommended!',
                    'photos' => [
                        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80'
                    ],
                    'is_approved' => true,
                    'created_at' => now()->subDays(3)->toDateTimeString()
                ],
                [
                    'id' => 2,
                    'product_id' => 2,
                    'customer_name' => 'Naveed S.',
                    'rating' => 4,
                    'comment' => 'Very premium feel. The tussar silk texture is rough yet elegant. Perfect sizing. Happy with the purchase.',
                    'photos' => [],
                    'is_approved' => true,
                    'created_at' => now()->subDays(6)->toDateTimeString()
                ]
            ];
        }
        elseif ($filename === 'settings.json') {
            $data = [
                'announcementText' => 'TIMELESS VINTAGE CRAFTSMANSHIP — FREE NATIONWIDE COURIER DELIVERY',
                'heroBadge' => 'THE HEIRLOOM COLLECTION',
                'heroSubBadge' => 'ESTABLISHED 2026',
                'heroHeading' => "Timeless Heritage.\nNostalgic Luxury.",
                'heroSubtext' => 'A tribute to handloomed cottons, vintage sarees, and structured garments crafted to endure generations.',
                'heroButtonText' => 'Explore Archives',
                'heroBgImage' => 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=80',
                
                'collectionsLabel' => 'THE SECTIONS',
                'collectionsTitle' => 'Browse Curated Archives',
                
                'storyLabel' => 'OUR HERITAGE & STORIES',
                'storyTitle' => "Woven in Nostalgia,\nTailored for Today.",
                'storySubtext1' => 'At PutiMach, we reject the noise of fast fashion. Our collection is built upon the rhythm of antique wooden looms, handloomed yarns, and organic dyes that whisper stories of the past.',
                'storySubtext2' => 'Every button is selected to age, every stitch is positioned to hold, and every weave carries the legacy of master weavers of Sonargaon and Tangail.',
                'storyButtonText' => 'Explore Our Craft',
                'storyImage1' => 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
                'storyImage2' => 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
                
                'instagramLabel' => 'Join The Culture',
                'instagramTitle' => 'Follow @putimachhh',
                'instagramSubtext' => 'Tag us in your street fits to get featured on our official channel.',
                'instagramUrl' => 'https://www.instagram.com/putimachhh?igsh=dnYxeXhhdHhodzdn',
                'instagramProfileImage' => 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
                'facebookUrl' => 'https://www.facebook.com/share/1HitDwyphD/',
                
                'welcome_popup_enabled' => 'true',
                'welcome_image' => 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
                'welcome_title' => 'The Vintage Edit',
                'welcome_text' => 'Welcome to PutiMach. Explore our handcrafted heritage clothing, designed to transcend seasons and tell a story.',
                'welcome_button_text' => 'Enter Collection',
                'welcome_link' => '/shop',
                
                'contactEmail' => 'putimach324@gmail.com',
                'contactPhone' => '01827406756',
                'whatsapp' => '01827406756',
                'contactAddress' => 'House 42, Road 11, Banani, Dhaka, Bangladesh',
                
                'shippingInsideDhaka' => 80,
                'shippingOutsideDhaka' => 150,
                'shippingSubDhaka' => 100
            ];
        }
        elseif ($filename === 'orders.json') {
            $data = [
                [
                    'id' => 'ORD-763421',
                    'customer_name' => 'Shakhor S.',
                    'customer_email' => 'shakh@putimach.com',
                    'customer_phone' => '01942212267',
                    'shipping_address' => 'House 42, Road 11, Banani, Dhaka',
                    'subtotal' => 9500,
                    'shipping_cost' => 0,
                    'discount_applied' => 250,
                    'grand_total' => 9250,
                    'status' => 'Processing',
                    'tracking_status' => 'Shipped',
                    'tracking_carrier' => 'Pathao Courier',
                    'tracking_code' => 'PT-9988772',
                    'items' => [
                        [
                            'product_id' => 1,
                            'product_name' => 'Vintage Silk Jamdani Saree',
                            'price' => 9500,
                            'quantity' => 1,
                            'size' => 'Free Size',
                            'color' => 'Antique Gold'
                        ]
                    ],
                    'created_at' => now()->subDays(1)->toDateTimeString()
                ]
            ];
        }
        elseif ($filename === 'tasks.json') {
            $data = [
                ['id' => '1', 'title' => 'Check Steadfast consignment tracking status codes', 'priority' => 'high', 'recurrence' => 'daily', 'status' => 'pending', 'assigned_role' => 'Fulfillment Manager'],
                ['id' => '2', 'title' => 'Verify COD amounts matched with Pathao daily report', 'priority' => 'medium', 'recurrence' => 'daily', 'status' => 'completed', 'assigned_role' => 'Finance Admin'],
                ['id' => '3', 'title' => 'Update size measurement guide for new sarees drop', 'priority' => 'low', 'recurrence' => 'custom', 'status' => 'pending', 'assigned_role' => 'Product Manager']
            ];
        }
        elseif ($filename === 'content_plans.json') {
            $data = [
                ['id' => '1', 'month' => 'July 2026', 'product_name' => 'Vintage Silk Jamdani Saree', 'content_title' => 'Heritage Jamdani Drape Styling Guide', 'content_type' => 'UGC Video', 'platform' => 'Instagram', 'status' => 'In Progress', 'photographer' => 'Nabila I.', 'notes' => 'Focus on showing the close-up zardozi border work.'],
                ['id' => '2', 'month' => 'July 2026', 'product_name' => 'Heritage Tussar Panjabi', 'content_title' => 'Espresso Brown Panjabi Outdoors Shoot', 'content_type' => 'Photoshoot', 'platform' => 'Facebook', 'status' => 'Planning', 'photographer' => 'Rifat A.', 'notes' => 'Shoot at vintage setup near Panam City.']
            ];
        }
        elseif ($filename === 'finance_plans.json') {
            $data = [
                ['id' => '1', 'month' => 'July 2026', 'product_name' => 'Vintage Silk Jamdani Saree', 'target_sales_qty' => 50, 'mrp' => 9500, 'lifting_cost' => 4500, 'packing_cost' => 250, 'cod_cost' => 95, 'ad_cost_unit_bdt' => 850, 'opex_cost_unit' => 600]
            ];
        }
        elseif ($filename === 'couriers.json') {
            $data = [
                'steadfast_api_key' => 'sf_mock_key_998877',
                'steadfast_secret' => 'sf_mock_sec_112233',
                'pathao_client_id' => 'pt_mock_client_55',
                'pathao_client_secret' => 'pt_mock_secret_88',
                'pathao_store_id' => 'pt_mock_store_443'
            ];
        }
        elseif ($filename === 'backups.json') {
            $data = [
                ['id' => '1', 'created_at' => '2026-07-08 12:00:00', 'file_name' => 'putimach_backup_20260708.json', 'file_size_bytes' => 245100, 'status' => 'completed', 'triggered_by' => 'System Auto'],
                ['id' => '2', 'created_at' => '2026-07-09 18:30:00', 'file_name' => 'putimach_backup_20260709.json', 'file_size_bytes' => 245900, 'status' => 'completed', 'triggered_by' => 'Admin User']
            ];
        }
        elseif ($filename === 'shop_slider.json') {
            $data = [
                'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80'
            ];
        }
        
        Storage::put('json_store/' . $filename, json_encode($data, JSON_PRETTY_PRINT));
    }
}
