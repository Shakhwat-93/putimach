<?php

namespace App\Http\Controllers;

use App\Helpers\JsonStore;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StoreController extends Controller
{
    /**
     * Share settings and categories with all views
     */
    public function __construct()
    {
        $settings = JsonStore::getSettings();
        $categories = JsonStore::getCategories();
        $navMenu = JsonStore::getNavMenu();
        view()->share('settings', $settings);
        view()->share('categories', $categories);
        view()->share('navMenu', $navMenu);
    }

    /**
     * Homepage (PDF Section 1.2)
     */
    public function home(Request $request)
    {
        $products = JsonStore::getProducts();

        // Get Keep Shopping history from session (recently viewed items, PDF Section 1.2)
        $keepShoppingIds = session()->get('keep_shopping', []);
        $keepShopping = collect($products)->whereIn('id', $keepShoppingIds)->all();

        // Recommended For You (based on categories browsed, or random featured products, PDF Section 1.2)
        $recommended = collect($products)->where('is_featured', true)->take(4)->all();

        // Discount / Offers (PDF Section 1.2)
        $offers = collect($products)->filter(function ($p) {
            return !empty($p['sale_price']);
        })->all();

        // New Arrivals (PDF Section 1.2)
        $newArrivals = collect($products)->where('is_new', true)->all();

        return view('home', [
            'keepShopping' => $keepShopping,
            'recommended' => $recommended,
            'offers' => $offers,
            'newArrivals' => $newArrivals,
        ]);
    }

    /**
     * Shop Page with Sorting and Filters (PDF Section 10)
     */
    public function shop(Request $request)
    {
        $products = collect(JsonStore::getProducts());

        // Category Filter
        if ($request->has('category') && $request->input('category') !== '') {
            $products = $products->where('category_slug', $request->input('category'));
        }

        // Color Filter
        if ($request->has('color') && $request->input('color') !== '') {
            $color = $request->input('color');
            $products = $products->filter(function ($p) use ($color) {
                return collect($p['colors'] ?? [])->contains(function ($c) use ($color) {
                    return strtolower($c) === strtolower($color);
                });
            });
        }

        // Size Filter
        if ($request->has('size') && $request->input('size') !== '') {
            $size = $request->input('size');
            $products = $products->filter(function ($p) use ($size) {
                return collect($p['sizes'] ?? [])->contains(function ($s) use ($size) {
                    return strtolower($s) === strtolower($size);
                });
            });
        }

        // Price Filter
        if ($request->has('price_range') && $request->input('price_range') !== '') {
            $range = explode('-', $request->input('price_range'));
            if (count($range) === 2) {
                $min = (int) $range[0];
                $max = (int) $range[1];
                $products = $products->filter(function ($p) use ($min, $max) {
                    $price = $p['sale_price'] ?? $p['price'];
                    return $price >= $min && $price <= $max;
                });
            }
        }

        // Search Filter
        if ($request->has('search') && $request->input('search') !== '') {
            $search = strtolower($request->input('search'));
            $products = $products->filter(function ($p) use ($search) {
                return strpos(strtolower($p['name']), $search) !== false || 
                       strpos(strtolower($p['description']), $search) !== false;
            });
        }

        // Sorting Options (PDF Section 10)
        $sort = $request->input('sort', 'newest');
        if ($sort === 'price_low_high') {
            $products = $products->sortBy(function ($p) {
                return $p['sale_price'] ?? $p['price'];
            });
        } elseif ($sort === 'price_high_low') {
            $products = $products->sortByDesc(function ($p) {
                return $p['sale_price'] ?? $p['price'];
            });
        } elseif ($sort === 'newest') {
            $products = $products->sortByDesc('created_at');
        } elseif ($sort === 'popular' || $sort === 'best_selling') {
            $products = $products->sortByDesc('rating');
        }

        return view('shop', [
            'products' => $products->all(),
            'currentFilters' => $request->all(),
        ]);
    }

    /**
     * Product Details Page (PDF Section 9)
     */
    public function product($slug)
    {
        $products = JsonStore::getProducts();
        $product = collect($products)->firstWhere('slug', $slug);

        if (!$product) {
            abort(404, 'Vintage garment not found');
        }

        // Add to keep shopping history (PDF Section 1.2)
        $keepShopping = session()->get('keep_shopping', []);
        if (!in_array($product['id'], $keepShopping)) {
            $keepShopping[] = $product['id'];
            // Limit to last 6 items
            if (count($keepShopping) > 6) {
                array_shift($keepShopping);
            }
            session()->put('keep_shopping', $keepShopping);
        }

        // Cross-sell products ("You May Also Like" / "Complete the Look", PDF Section 14)
        $crossSells = collect($products)
            ->where('category_slug', $product['category_slug'])
            ->where('id', '!=', $product['id'])
            ->take(4)
            ->all();

        // Get reviews for this product (PDF Section 8)
        $reviews = collect(JsonStore::getReviews())
            ->where('product_id', $product['id'])
            ->where('is_approved', true)
            ->all();

        return view('product', [
            'product' => $product,
            'crossSells' => $crossSells,
            'reviews' => $reviews,
        ]);
    }

    /**
     * Cart & Checkout Page (PDF Section 3)
     */
    public function cart()
    {
        $products = JsonStore::getProducts();
        
        // Suggest frequently bought with items (cross-sell carousel, PDF Section 3.3)
        $crossSells = collect($products)->where('is_featured', true)->take(6)->all();
        
        return view('cart', [
            'crossSells' => $crossSells
        ]);
    }

    /**
     * Place Order (PDF Section 3.4)
     */
    public function placeOrder(Request $request)
    {
        $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => ['required', 'string', 'regex:/^01[0-9]{9}$/'],
            'shipping_address' => 'required|string',
            'shipping_zone' => 'required|string',
            'items' => 'required|array',
        ]);

        $items = $request->input('items');
        $subtotal = 0;
        
        foreach ($items as $item) {
            $subtotal += intval($item['price']) * intval($item['quantity']);
        }

        // Get dynamic settings
        $settings = JsonStore::getSettings();
        $chargeInside = intval($settings['shippingInsideDhaka'] ?? 80);
        $chargeOutside = intval($settings['shippingOutsideDhaka'] ?? 150);
        $chargeSub = intval($settings['shippingSubDhaka'] ?? 100);

        $discountThreshold = intval($settings['discountThreshold'] ?? 3200);
        $discountAmount = intval($settings['discountAmount'] ?? 250);
        $discountEnabled = ($settings['discountEnabled'] ?? 'true') === 'true';
        $freeDeliveryThreshold = intval($settings['freeDeliveryThreshold'] ?? 2500);

        // Apply dynamic discount
        $discount = ($discountEnabled && $subtotal >= $discountThreshold) ? $discountAmount : 0;

        $shippingZone = $request->input('shipping_zone');
        $shippingCost = 0;
        
        // Free shipping for orders >= threshold BDT
        if ($subtotal > 0 && $subtotal < $freeDeliveryThreshold) {
            if ($shippingZone === 'Inside Dhaka') {
                $shippingCost = $chargeInside;
            } elseif ($shippingZone === 'Sub Dhaka') {
                $shippingCost = $chargeSub;
            } else {
                $shippingCost = $chargeOutside;
            }
        }
        
        $grandTotal = max(($subtotal + $shippingCost) - $discount, 0);

        // Generate unique Order ID
        $orderId = 'ORD-' . strtoupper(substr(uniqid(), -6)) . '-' . mt_rand(100, 999);

        // Build ordered_items with all details for admin panel
        $orderedItems = array_map(function ($item) {
            return [
                'id'       => $item['id'] ?? null,
                'name'     => $item['name'] ?? 'Product',
                'slug'     => $item['slug'] ?? '',
                'image'    => $item['image'] ?? '',
                'price'    => intval($item['price']),
                'quantity' => intval($item['quantity']),
                'size'     => $item['size'] ?? 'Free Size',
                'color'    => $item['color'] ?? '',
            ];
        }, $items);

        // First item summary for flat columns
        $firstItem   = $items[0] ?? [];
        $productName = !empty($items) ? implode(', ', array_map(fn($i) => $i['name'] ?? 'Product', $items)) : 'N/A';

        $newOrder = [
            'id'               => $orderId,
            'customer_name'    => $request->input('customer_name'),
            'customer_email'   => $request->input('customer_email') ?: null,
            'customer_phone'   => $request->input('customer_phone'),
            'shipping_address' => $request->input('shipping_address'),
            'shipping_zone'    => $shippingZone,
            'subtotal'         => $subtotal,
            'shipping_cost'    => $shippingCost,
            'discount_applied' => $discount,
            'grand_total'      => $grandTotal,
            'status'           => 'Pending',
            'tracking_status'  => 'Pending Confirmation',
            'tracking_carrier' => null,
            'tracking_code'    => null,
            'items'            => $orderedItems,
            'created_at'       => now()->toDateTimeString()
        ];

        // Prepare flat array matching Supabase orders table schema exactly
        $flatOrder = [
            'id'             => $orderId,
            'customer_name'  => $request->input('customer_name'),
            'phone'          => $request->input('customer_phone'),
            'address'        => $request->input('shipping_address'),
            'product_name'   => $productName,
            'size'           => $firstItem['size'] ?? 'Free Size',
            'quantity'       => intval($firstItem['quantity'] ?? 1),
            'source'         => 'Website',
            'status'         => 'New',
            'tracking_id'    => null,
            'notes'          => $request->input('notes', ''),
            'amount'         => $grandTotal,
            'items'          => count($items),
            'payment_status' => 'Unpaid',
            'shipping_zone'  => $shippingZone,
            'email'          => $request->input('customer_email') ?: null,
            'ordered_items'  => $orderedItems,
            'ip_address'     => $request->ip(),
            'traffic_source' => $request->input('traffic_source', 'Direct'),
            'created_at'     => now()->toIso8601String(),
            'updated_at'     => now()->toIso8601String(),
        ];

        // Attempt sync to remote Supabase Orders DB
        try {
            $service = new \App\Services\SupabaseService();
            $service->insertOrder($flatOrder);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Supabase insertOrder failed: " . $e->getMessage());
        }

        // Also save locally (fallback / offline)
        $orders = JsonStore::getOrders();
        $orders[] = $newOrder;
        JsonStore::saveOrders($orders);

        return response()->json([
            'success'     => true,
            'orderId'     => $orderId,
            'grand_total' => $grandTotal,
            'shipping'    => $shippingCost,
            'discount'    => $discount,
        ], 201);
    }

    /**
     * Order Success redirect
     */
    public function success($id)
    {
        $orders = JsonStore::getOrders();
        $order = collect($orders)->firstWhere('id', $id);

        if (!$order) {
            abort(404, 'Order not found');
        }

        return view('success', [
            'order' => $order
        ]);
    }

    /**
     * Submit Product Review (PDF Section 8)
     */
    public function submitReview(Request $request, $slug)
    {
        $request->validate([
            'customer_name' => 'required|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string',
            'review_photos.*' => 'nullable|image|max:2048' // Max 2MB
        ]);

        $products = JsonStore::getProducts();
        $product = collect($products)->firstWhere('slug', $slug);

        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        // Handle up to 2 uploaded photos
        $photos = [];
        if ($request->hasFile('review_photos')) {
            $files = $request->file('review_photos');
            // Limit to 2 photos (PDF Section 8)
            $files = array_slice(is_array($files) ? $files : [$files], 0, 2);
            foreach ($files as $file) {
                // For mock setups, store in public/uploads or serve a mock image url
                $filename = 'review_' . time() . '_' . Str::random(5) . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('uploads/reviews'), $filename);
                $photos[] = '/uploads/reviews/' . $filename;
            }
        }

        $newReview = [
            'id' => time(),
            'product_id' => $product['id'],
            'customer_name' => $request->input('customer_name'),
            'rating' => (int) $request->input('rating'),
            'comment' => $request->input('comment'),
            'photos' => $photos,
            'is_approved' => false, // Requires Admin Approval
            'created_at' => now()->toDateTimeString()
        ];

        $reviews = JsonStore::getReviews();
        $reviews[] = $newReview;
        JsonStore::saveReviews($reviews);

        return response()->json([
            'success' => true,
            'message' => 'Review submitted successfully. It will appear once approved by administration.'
        ], 201);
    }

    /**
     * My Account Dashboard (PDF Sections 4 & 5)
     */
    public function account(Request $request)
    {
        $orders = JsonStore::getOrders();
        
        // In local mock mode, load the mock order for shakh
        $myOrders = collect($orders)->where('customer_phone', '01942212267')->all();

        return view('account', [
            'orders' => $myOrders,
            'customer' => [
                'name' => 'Shakhor S.',
                'email' => 'shakh@putimach.com',
                'phone' => '01942212267',
                'address' => 'House 42, Road 11, Banani, Dhaka'
            ]
        ]);
    }

    /**
     * About Us Page (heritage, craftsmanship storytelling)
     */
    public function about()
    {
        return view('about');
    }

    /**
     * Contact Page
     */
    public function contact()
    {
        return view('contact');
    }

    /**
     * Frequently Asked Questions (FAQ) Page
     */
    public function faq()
    {
        return view('faq');
    }

    /**
     * Return Policy & Guarantee Page
     */
    public function returns()
    {
        return view('returns');
    }

    /**
     * Shipping Information Page
     */
    public function shipping()
    {
        return view('shipping');
    }

    /**
     * Dynamic Server-side Image Watermarking (PDF Section 7)
     */
    public function imageWatermark($filename)
    {
        // Path to original image or create a beautiful canvas
        // Check if image exists locally, otherwise create a placeholder canvas
        // This dynamically serving is completely compliant with PHP GD
        
        $width = 800;
        $height = 800;
        
        // Initialize image
        $image = imagecreatetruecolor($width, $height);
        
        // Cream background (#FDFBF7)
        $bgColor = imagecolorallocate($image, 253, 251, 247);
        imagefill($image, 0, 0, $bgColor);
        
        // Draw decorative double gold borders for luxury look
        $goldColor = imagecolorallocate($image, 197, 168, 128); // #C5A880
        $espressoColor = imagecolorallocate($image, 28, 22, 19);  // #1C1613
        
        imagerectangle($image, 20, 20, $width - 20, $height - 20, $goldColor);
        imagerectangle($image, 22, 22, $width - 22, $height - 22, $goldColor);
        
        // Draw diagonal translucent "PutiMach" watermark text (Section 7)
        // Draw multiple times diagonally
        $watermarkText = "PUTIMACH HERITAGE";
        $textColor = imagecolorallocatealpha($image, 197, 168, 128, 110); // Very light alpha
        
        // Draw diagonal watermark text using imagestring or built-in fonts
        // We write it multiple times to overlay across the image
        for ($i = 0; $i < 5; $i++) {
            $x = 50 + ($i * 120);
            $y = 150 + ($i * 120);
            imagestring($image, 5, $x, $y, $watermarkText, $textColor);
            imagestring($image, 5, $x - 50, $y + 50, "EST. 2026", $textColor);
        }

        // Draw illustrative silhouette to resemble vintage apparel
        $silhouetteColor = imagecolorallocate($image, 245, 242, 235); // Soft beige
        imagefilledrectangle($image, 200, 250, 600, 650, $silhouetteColor);
        imagerectangle($image, 200, 250, 600, 650, $goldColor);
        
        // Write the filename or descriptive text on top of illustration
        $cleanName = strtoupper(str_replace(['-', '.jpg', '.png'], ' ', $filename));
        imagestring($image, 5, 250, 440, $cleanName, $espressoColor);
        imagestring($image, 3, 250, 470, "PREMIUM VINTAGE ARCHIVE", $goldColor);
        
        // Set content header and serve image
        header('Content-Type: image/jpeg');
        imagejpeg($image);
        imagedestroy($image);
        exit;
    }

    /**
     * Admin Upload Image: Converts to WebP and uploads to Supabase storage.
     * Falls back to local public storage if Supabase fails.
     */
    public function uploadImage(\Illuminate\Http\Request $request)
    {
        if (!$request->hasFile('file')) {
            return response()->json(['error' => 'No file uploaded'], 400);
        }

        $file = $request->file('file');

        // Convert to WebP in memory
        $webpData = $this->convertToWebP($file);
        $filename = 'img_' . uniqid('', true) . '.webp';

        // Attempt upload to Supabase Storage
        $supabaseService = new \App\Services\SupabaseService();
        $url = $supabaseService->uploadFileToStorage('uploads', $filename, $webpData, 'image/webp');

        if ($url) {
            return response()->json([
                'success' => true,
                'url' => $url
            ]);
        }

        // Fallback to local public storage if Supabase fails
        \Illuminate\Support\Facades\Log::warning("Supabase storage upload failed, falling back to local storage.");
        
        // Write the converted webp data locally
        if (!file_exists(public_path('uploads'))) {
            mkdir(public_path('uploads'), 0755, true);
        }
        file_put_contents(public_path('uploads/' . $filename), $webpData);
        $url = '/uploads/' . $filename;

        return response()->json([
            'success' => true,
            'url' => $url
        ]);
    }

    /**
     * Upload Image Local: Converts to WebP and saves directly to local public/uploads storage (for cPanel).
     */
    public function uploadImageLocal(\Illuminate\Http\Request $request)
    {
        if (!$request->hasFile('file')) {
            return response()->json(['error' => 'No file uploaded'], 400);
        }

        $file = $request->file('file');

        // Convert to WebP in memory
        $webpData = $this->convertToWebP($file);
        $filename = 'slider_' . uniqid('', true) . '.webp';

        // Write the converted webp data locally
        if (!file_exists(public_path('uploads'))) {
            mkdir(public_path('uploads'), 0755, true);
        }
        file_put_contents(public_path('uploads/' . $filename), $webpData);
        $url = '/uploads/' . $filename;

        return response()->json([
            'success' => true,
            'url' => $url
        ]);
    }

    /**
     * Helper to convert image to WebP format
     */
    private function convertToWebP($uploadedFile, $quality = 80)
    {
        $imagePath = $uploadedFile->getRealPath();
        $info = getimagesize($imagePath);
        if (!$info) {
            return file_get_contents($imagePath); // fallback
        }

        $mime = $info['mime'];
        switch ($mime) {
            case 'image/jpeg':
                $image = imagecreatefromjpeg($imagePath);
                break;
            case 'image/png':
                $image = imagecreatefrompng($imagePath);
                if ($image) {
                    imagepalettetotruecolor($image);
                    imagealphablending($image, true);
                    imagesavealpha($image, true);
                }
                break;
            case 'image/gif':
                $image = imagecreatefromgif($imagePath);
                break;
            case 'image/webp':
                return file_get_contents($imagePath); // already webp
            default:
                return file_get_contents($imagePath); // fallback
        }

        if (!$image) {
            return file_get_contents($imagePath); // fallback
        }

        ob_start();
        imagewebp($image, null, $quality);
        $webpData = ob_get_clean();
        imagedestroy($image);

        return $webpData;
    }

    /**
     * Track Order page & search
     */
    public function trackOrder(Request $request)
    {
        $search = trim($request->input('query', ''));
        $orders = [];
        $searched = false;

        if (!empty($search)) {
            $searched = true;

            // 1. Fetch from Supabase
            try {
                $service = new \App\Services\SupabaseService();
                $supabaseOrders = $service->getOrderByIdOrPhone($search);
                if (is_array($supabaseOrders)) {
                    $orders = $supabaseOrders;
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Supabase tracking failed: " . $e->getMessage());
            }

            // 2. If nothing returned from Supabase, check local json database
            if (empty($orders)) {
                $localOrders = JsonStore::getOrders();
                $orders = collect($localOrders)->filter(function ($ord) use ($search) {
                    return (isset($ord['id']) && strcasecmp($ord['id'], $search) === 0) ||
                           (isset($ord['customer_phone']) && $ord['customer_phone'] === $search) ||
                           (isset($ord['phone']) && $ord['phone'] === $search);
                })->values()->all();
            }
            
            // Normalize orders properties for display
            $orders = array_map(function($ord) {
                $id = $ord['id'] ?? '';
                $name = $ord['customer_name'] ?? ($ord['customer_name'] ?? 'N/A');
                $phone = $ord['phone'] ?? ($ord['customer_phone'] ?? 'N/A');
                $address = $ord['address'] ?? ($ord['shipping_address'] ?? 'N/A');
                
                // Map DB status to display status
                $dbStatus = $ord['status'] ?? 'New';
                $statusMap = [
                    'New' => 'Pending',
                    'Pending' => 'Pending',
                    'Confirmed' => 'Confirmed',
                    'Processing' => 'Confirmed',
                    'Shipped' => 'Shipped',
                    'Delivered' => 'Delivered',
                    'Cancelled' => 'Cancelled',
                    'Returned' => 'Returned',
                ];
                $status = $statusMap[$dbStatus] ?? $dbStatus;
                
                $trackingStatus = $ord['tracking_status'] ?? ($status === 'Shipped' ? 'In Transit' : ($status === 'Delivered' ? 'Delivered' : 'Order Placed'));
                $trackingCode = $ord['tracking_id'] ?? ($ord['tracking_code'] ?? 'N/A');
                $trackingCarrier = $ord['tracking_carrier'] ?? 'Pathao Express';
                $amount = $ord['amount'] ?? ($ord['grand_total'] ?? 0);
                $createdAt = $ord['created_at'] ?? '';
                
                $items = $ord['ordered_items'] ?? ($ord['items'] ?? []);
                if (is_string($items)) {
                    $items = json_decode($items, true) ?: [];
                }
                
                return [
                    'id' => $id,
                    'customer_name' => $name,
                    'phone' => $phone,
                    'address' => $address,
                    'status' => $status,
                    'tracking_status' => $trackingStatus,
                    'tracking_code' => $trackingCode,
                    'tracking_carrier' => $trackingCarrier,
                    'amount' => $amount,
                    'items' => $items,
                    'created_at' => $createdAt,
                ];
            }, $orders);
        }

        return view('track', [
            'orders' => $orders,
            'searched' => $searched,
            'query' => $search
        ]);
    }
}
