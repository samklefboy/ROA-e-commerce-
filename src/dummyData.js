// ============================================================
// r.o.a. DUMMY DATA — Development purpose only
// Replace with real API calls when backend is ready
// ============================================================

// ============================================================
// USERS
// ============================================================
export const USERS = [
  {
    id: "user-001",
    name: "Samuel Adeolu",
    email: "samuel@gmail.com",
    phone: "+2348012345678",
    avatar: null,
    handle: "@samklefboy",
    verified: true,
    createdAt: "2024-01-15T10:00:00.000Z",
    address: {
      street: "15 Bode Thomas Street",
      city: "Surulere",
      state: "Lagos",
      country: "Nigeria",
    },
  },
  {
    id: "user-002",
    name: "Chioma Okafor",
    email: "chioma@gmail.com",
    phone: "+2348023456789",
    avatar: null,
    handle: "@chioma_o",
    verified: false,
    createdAt: "2024-02-20T09:00:00.000Z",
    address: {
      street: "22 Ozumba Mbadiwe Avenue",
      city: "Victoria Island",
      state: "Lagos",
      country: "Nigeria",
    },
  },
  {
    id: "user-003",
    name: "Ibrahim Musa",
    email: "ibrahim@gmail.com",
    phone: "+2348034567890",
    avatar: null,
    handle: "@ibrahimm",
    verified: true,
    createdAt: "2024-03-10T08:00:00.000Z",
    address: {
      street: "5 Ahmadu Bello Way",
      city: "Wuse",
      state: "Abuja",
      country: "Nigeria",
    },
  },
];

// ============================================================
// STORES
// ============================================================
export const STORES = [
  {
    id: "store-001",
    name: "SportZone Official",
    tagline: "Authentic Sports & Lifestyle Gear — Fast Nationwide Delivery",
    handle: "@sportzone",
    about:
      "SportZone is your one-stop destination for authentic sports gear, athletic apparel and lifestyle accessories. We partner directly with top manufacturers to bring you the best quality at competitive prices.",
    logo: "images/products/intermediate-composite-basketball.jpg",
    coverImage: "images/products/intermediate-composite-basketball.jpg",
    location: "Lagos, Nigeria",
    whatsapp: "+2348012345678",
    email: "hello@sportzone.ng",
    socialLinks: {
      instagram: "@sportzone_ng",
      twitter: "@sportzone",
    },
    category: "SPORTS",
    isOpen: true,
    verified: true,
    status: "ACTIVE",
    ratingStars: 4.8,
    ratingCount: 234,
    followerCount: 2400,
    totalListings: 128,
    walletBalance: 284500,
    bankDetails: {
      bankName: "GTBank",
      accountNumber: "0123456789",
      accountName: "SportZone Nigeria Ltd",
    },
    policies: [
      { label: "Delivery", value: "1-3 business days" },
      { label: "Returns", value: "Within 30 days" },
      { label: "Warranty", value: "1 year on all gear" },
      { label: "Support", value: "24hr response" },
      { label: "Location", value: "Lagos, Nigeria" },
    ],
    trust: [
      "Verified Seller",
      "Secure Checkout",
      "Free Returns",
      "24h Support",
    ],
    stats: [
      { value: "400+", label: "Products" },
      { value: "98.4%", label: "Ratings fulfilled" },
      { value: "Free", label: "Returns" },
      { value: "1-3 Days", label: "Delivery" },
    ],
    ownerId: "user-001",
    createdAt: "2023-01-15T00:00:00.000Z",
  },
  {
    id: "store-002",
    name: "Zara NG",
    tagline: "Premium Fashion For Every Nigerian",
    handle: "@zarang",
    about:
      "Bringing the latest fashion trends to Nigeria at affordable prices. Quality fabrics, modern designs.",
    logo: "images/products/intermediate-composite-basketball.jpg",
    coverImage: "images/products/2-slot-toaster-white.jpg",
    location: "Lekki, Lagos",
    whatsapp: "+2348023456789",
    email: "hello@zarang.ng",
    socialLinks: {
      instagram: "@zarang_official",
    },
    category: "FASHION",
    isOpen: true,
    verified: true,
    status: "ACTIVE",
    ratingStars: 4.9,
    ratingCount: 412,
    followerCount: 5600,
    totalListings: 320,
    walletBalance: 512000,
    bankDetails: {
      bankName: "Access Bank",
      accountNumber: "9876543210",
      accountName: "Zara Nigeria Ltd",
    },
    policies: [
      { label: "Delivery", value: "2-3 business days" },
      { label: "Returns", value: "Within 14 days" },
      { label: "Support", value: "Mon-Sat 9am-6pm" },
    ],
    trust: ["Verified Seller", "Free Returns", "Quality Assured"],
    stats: [
      { value: "320+", label: "Products" },
      { value: "99.1%", label: "Satisfaction" },
      { value: "2-3 Days", label: "Delivery" },
    ],
    ownerId: "user-002",
    createdAt: "2022-06-10T00:00:00.000Z",
  },
  {
    id: "store-003",
    name: "TechHub Lagos",
    tagline: "Latest Electronics At The Best Prices",
    handle: "@techhublag",
    about:
      "Your trusted electronics store in Lagos. We sell only authentic products with full warranty.",
    logo: "images/stores/techhub-lagos-logo.jpg",
    coverImage: null,
    location: "Ikeja, Lagos",
    whatsapp: "+2348034567890",
    email: "info@techhub.ng",
    socialLinks: {
      instagram: "@techhub_lagos",
      twitter: "@techhublag",
    },
    category: "ELECTRONICS",
    isOpen: true,
    verified: true,
    status: "ACTIVE",
    ratingStars: 4.7,
    ratingCount: 189,
    followerCount: 3200,
    totalListings: 214,
    walletBalance: 195000,
    bankDetails: {
      bankName: "Zenith Bank",
      accountNumber: "1234567890",
      accountName: "TechHub Nigeria Ltd",
    },
    policies: [
      { label: "Delivery", value: "1-2 business days" },
      { label: "Warranty", value: "1 year all products" },
      { label: "Returns", value: "7 days unopened" },
    ],
    trust: ["Verified Seller", "Warranty Guaranteed", "Secure Checkout"],
    stats: [
      { value: "214+", label: "Products" },
      { value: "1 Year", label: "Warranty" },
      { value: "1-2 Days", label: "Delivery" },
    ],
    ownerId: "user-003",
    createdAt: "2023-03-20T00:00:00.000Z",
  },
];

// ============================================================
// PRODUCTS
// ============================================================
export const PRODUCTS = [
  // ---- REGULAR — Fashion ----
  {
    id: "prod-001",
    storeId: "store-002",
    store: STORES[1],
    type: "REGULAR",
    name: "Oversized Linen Blazer — Premium Collection",
    description:
      "A breathable linen blend blazer with a relaxed oversized silhouette. Perfect for both casual and semi-formal occasions. Features a single button closure and two front pockets.",
    images: [
      "images/products/2-slot-toaster-white.jpg",
      "images/products/elegant-white-dinner-plate-set.jpg",
    ],
    price: 28000,
    oldPrice: 33000,
    costPrice: 14000,
    category: "Fashion",
    condition: "Brand new",
    status: "ACTIVE",
    stock: null,
    ratingStars: 4.5,
    ratingCount: 42,
    soldCount: 128,
    keywords: ["blazer", "fashion", "oversized", "linen"],
    deliveryOptions: ["Nationwide delivery"],
    deliveryTime: "2-3 business days",
    deliveryFee: "Buyer pays fee",
    hasVariants: true,
    variants: {
      Sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      Colours: ["Beige", "Black", "White", "Navy"],
    },
    productVariants: [
      {
        combination: { Sizes: "S", Colours: "Beige" },
        price: 28000,
        stock: 10,
        sku: "BLZ-S-BEI",
      },
      {
        combination: { Sizes: "M", Colours: "Beige" },
        price: 28000,
        stock: 15,
        sku: "BLZ-M-BEI",
      },
      {
        combination: { Sizes: "L", Colours: "Beige" },
        price: 28000,
        stock: 8,
        sku: "BLZ-L-BEI",
      },
      {
        combination: { Sizes: "S", Colours: "Black" },
        price: 28000,
        stock: 12,
        sku: "BLZ-S-BLK",
      },
      {
        combination: { Sizes: "M", Colours: "Black" },
        price: 28500,
        stock: 6,
        sku: "BLZ-M-BLK",
      },
      {
        combination: { Sizes: "L", Colours: "Black" },
        price: 29000,
        stock: 4,
        sku: "BLZ-L-BLK",
      },
    ],
    listingMeta: null,
    createdAt: "2026-07-15T10:00:00.000Z",
  },

  // ---- REGULAR — Electronics ----
  {
    id: "prod-002",
    storeId: "store-003",
    store: STORES[2],
    type: "REGULAR",
    name: "Samsung Galaxy A55 5G — 256GB",
    description:
      "The Samsung Galaxy A55 5G features a 6.6-inch Super AMOLED display, 50MP triple camera system and 5000mAh battery. Comes with 12 months warranty.",
    images: [
      "images/products/3-piece-cooking-set.jpg",
      "images/products/elegant-white-dinner-plate-set.jpg",
    ],
    price: 185000,
    oldPrice: 210000,
    costPrice: 155000,
    category: "Electronics",
    condition: "Brand new",
    status: "ACTIVE",
    stock: null,
    ratingStars: 4.7,
    ratingCount: 89,
    soldCount: 245,
    keywords: ["samsung", "galaxy", "phone", "android", "5g"],
    deliveryOptions: ["Nationwide delivery", "Same city delivery"],
    deliveryTime: "1-2 business days",
    deliveryFee: "Free delivery",
    hasVariants: true,
    variants: {
      Storage: ["128GB", "256GB"],
      Colours: ["Awesome Navy", "Awesome Lilac", "Awesome Iceblue"],
    },
    productVariants: [
      {
        combination: { Storage: "128GB", Colours: "Awesome Navy" },
        price: 165000,
        stock: 20,
        sku: "SA55-128-NVY",
      },
      {
        combination: { Storage: "256GB", Colours: "Awesome Navy" },
        price: 185000,
        stock: 15,
        sku: "SA55-256-NVY",
      },
      {
        combination: { Storage: "128GB", Colours: "Awesome Lilac" },
        price: 165000,
        stock: 12,
        sku: "SA55-128-LIL",
      },
      {
        combination: { Storage: "256GB", Colours: "Awesome Lilac" },
        price: 185000,
        stock: 8,
        sku: "SA55-256-LIL",
      },
      {
        combination: { Storage: "256GB", Colours: "Awesome Iceblue" },
        price: 185000,
        stock: 10,
        sku: "SA55-256-ICE",
      },
    ],
    listingMeta: null,
    createdAt: "2026-07-10T09:00:00.000Z",
  },

  // ---- REGULAR — Sports ----
  {
    id: "prod-003",
    storeId: "store-001",
    store: STORES[0],
    type: "REGULAR",
    name: "Nike Strike Football — Size 5",
    description:
      "The Nike Strike Football is built for training and recreational play. Machine-stitched construction for durability.",
    images: [
      "images/products/women-plain-cotton-oversized-sweater-gray.jpg",
      "images/products/luxury-towel-set.jpg",
    ],
    price: 12000,
    oldPrice: 14500,
    costPrice: 7000,
    category: "Sports",
    condition: "Brand new",
    status: "ACTIVE",
    stock: 50,
    ratingStars: 4.6,
    ratingCount: 67,
    soldCount: 312,
    keywords: ["nike", "football", "soccer", "ball"],
    deliveryOptions: ["Nationwide delivery"],
    deliveryTime: "2-3 business days",
    deliveryFee: "Buyer pays fee",
    hasVariants: false,
    variants: {},
    productVariants: [],
    listingMeta: null,
    createdAt: "2026-06-20T14:00:00.000Z",
  },

  // ---- REGULAR — Agriculture ----
  {
    id: "prod-004",
    storeId: "store-001",
    store: STORES[0],
    type: "REGULAR",
    name: "Premium Ofada Rice — Direct From Ogun Farmers",
    description:
      "Authentic Ofada rice sourced directly from verified Ogun State farmers. Parboiled and properly sorted. Rich aroma and nutritious.",
    images: [
      "images/products/facial-tissue-2-ply-8-boxes.jpg",
      "images/products/women-plain-cotton-oversized-sweater-gray.jpg",
    ],
    price: 3500,
    oldPrice: null,
    costPrice: 2000,
    category: "Agriculture",
    condition: "Brand new",
    status: "ACTIVE",
    stock: null,
    ratingStars: 4.9,
    ratingCount: 156,
    soldCount: 890,
    keywords: ["ofada", "rice", "organic", "ogun"],
    deliveryOptions: ["Nationwide delivery", "Same city delivery"],
    deliveryTime: "2-3 business days",
    deliveryFee: "Buyer pays fee",
    hasVariants: true,
    variants: {
      Weight: ["1kg", "2.5kg", "5kg", "10kg", "25kg"],
      Type: ["Standard", "Organic"],
    },
    productVariants: [
      {
        combination: { Weight: "1kg", Type: "Standard" },
        price: 3500,
        stock: 100,
        sku: "OFD-1K-STD",
      },
      {
        combination: { Weight: "2.5kg", Type: "Standard" },
        price: 8000,
        stock: 80,
        sku: "OFD-25K-STD",
      },
      {
        combination: { Weight: "5kg", Type: "Standard" },
        price: 15000,
        stock: 60,
        sku: "OFD-5K-STD",
      },
      {
        combination: { Weight: "10kg", Type: "Standard" },
        price: 28000,
        stock: 40,
        sku: "OFD-10K-STD",
      },
      {
        combination: { Weight: "1kg", Type: "Organic" },
        price: 4500,
        stock: 50,
        sku: "OFD-1K-ORG",
      },
      {
        combination: { Weight: "5kg", Type: "Organic" },
        price: 20000,
        stock: 30,
        sku: "OFD-5K-ORG",
      },
    ],
    listingMeta: null,
    createdAt: "2026-07-01T08:00:00.000Z",
  },

  // ---- REGULAR — Out of stock ----
  {
    id: "prod-005",
    storeId: "store-001",
    store: STORES[0],
    type: "REGULAR",
    name: "Adidas Running Shoes Pro — Men",
    description:
      "Professional running shoes with cushioned sole and breathable upper. Suitable for road and track.",
    images: ["images/products/luxury-towel-set.jpg"],
    price: 35000,
    oldPrice: null,
    costPrice: 22000,
    category: "Shoes",
    condition: "Brand new",
    status: "OUT_OF_STOCK",
    stock: 0,
    ratingStars: 4.8,
    ratingCount: 203,
    soldCount: 567,
    keywords: ["adidas", "shoes", "running", "sports"],
    deliveryOptions: ["Nationwide delivery"],
    deliveryTime: "2-3 business days",
    deliveryFee: "Free delivery",
    hasVariants: true,
    variants: {
      Sizes: ["40", "41", "42", "43", "44", "45"],
      Colours: ["Black", "White", "Grey"],
    },
    productVariants: [
      {
        combination: { Sizes: "42", Colours: "Black" },
        price: 35000,
        stock: 0,
        sku: "ADI-42-BLK",
      },
      {
        combination: { Sizes: "43", Colours: "Black" },
        price: 35000,
        stock: 0,
        sku: "ADI-43-BLK",
      },
    ],
    listingMeta: null,
    createdAt: "2026-05-10T11:00:00.000Z",
  },

  // ---- CAR LISTING ----

  {
    id: "prod-006",
    storeId: "store-001",
    store: STORES[0],
    type: "CAR",
    name: "2019 Toyota Camry LE Sedan",
    description:
      "Well maintained 2019 Toyota Camry LE in excellent condition. Originally purchased from a Toyota dealership in the US. Full service history available. No accidents. First owner in Nigeria.",
    images: [
      "images/products/facial-tissue-2-ply-8-boxes.jpg",
      "images/products/women-striped-beach-dress.jpg",
    ],
    price: 8500000,
    oldPrice: null,
    costPrice: null,
    category: "Cars",
    condition: "Foreign used (Tokunbo)",
    status: "ACTIVE",
    stock: null,
    ratingStars: 0,
    ratingCount: 0,
    soldCount: 0,
    keywords: ["toyota", "camry", "sedan", "tokunbo"],
    priceDisplay: "exact",
    listingMeta: {
      make: "Toyota",
      model: "Camry LE",
      year: 2019,
      mileage: 45000,
      transmission: "Automatic",
      fuel: "Petrol",
      color: "Black",
      bodyType: "Sedan",
      features: [
        "Air conditioning",
        "Leather seats",
        "Reverse camera",
        "Navigation/GPS",
        "Alloy wheels",
      ],
      location: "Lagos Island, Lagos",
      negotiable: true,
      contactMethod: ["WhatsApp", "Phone call"],
    },
    createdAt: "2026-07-20T10:00:00.000Z",
  },

  // ---- REAL ESTATE ----
  {
    id: "prod-007",
    storeId: "store-002",
    store: STORES[1],
    type: "REAL_ESTATE",
    name: "3 Bedroom Furnished Flat — Lekki Phase 1",
    description:
      "Fully furnished 3 bedroom flat in a secured estate on Admiralty Way, Lekki Phase 1. The apartment comes with quality furnishings, modern kitchen fittings and 24hr power supply.",
    images: [
      "images/products/women-sandal-heels-white-pink.jpg",
      "images/products/women-summer-jean-shorts.jpg",
    ],
    price: 2500000,
    oldPrice: null,
    costPrice: null,
    category: "Real estate",
    condition: "New build",
    status: "ACTIVE",
    stock: null,
    ratingStars: 0,
    ratingCount: 0,
    soldCount: 0,
    keywords: ["flat", "lekki", "furnished", "apartment", "rent"],
    priceDisplay: "exact",
    listingMeta: {
      listingType: "For rent",
      propertyType: "Flat / Apartment",
      bedrooms: "3 bedrooms",
      bathrooms: 2,
      toilets: 3,
      furnished: "Fully furnished",
      floor: "3rd floor",
      sizeInSqm: 120,
      amenities: [
        "24hr security",
        "Generator",
        "Borehole water",
        "Swimming pool",
        "Gym",
        "CCTV",
        "Parking space",
      ],
      address: "Admiralty Way, Lekki Phase 1, Lagos",
      hideExactAddress: false,
      agencyFee: "Not included",
      cautionFee: "Required",
      location: "Lekki Phase 1, Lagos",
    },
    createdAt: "2026-07-18T09:00:00.000Z",
  },
  ,
];

// ============================================================
// ORDERS
// ============================================================
export const ORDERS = [
  {
    id: "order-001",
    orderNumber: "ROA-4821",
    userId: "user-001",
    storeId: "store-002",
    buyer: {
      id: "user-001",
      name: "Samuel Adeolu",
      email: "samuel@gmail.com",
      avatar: null,
    },
    store: STORES[1],
    items: [
      {
        id: "item-001",
        productId: "prod-001",
        product: PRODUCTS[0],
        quantity: 1,
        price: 28000,
        variant: { Sizes: "M", Colours: "Beige" },
      },
    ],
    subtotal: 28000,
    deliveryFee: 1500,
    discount: 0,
    total: 29500,
    status: "IN_DELIVERY",
    paymentStatus: "PAID",
    paymentMethod: "r.o.a. Wallet",
    deliveryAddress: {
      street: "15 Bode Thomas Street",
      city: "Surulere",
      state: "Lagos",
      country: "Nigeria",
    },
    deliveryNote: "Please call before delivery",
    estimatedAt: "2026-08-27T17:00:00.000Z",
    deliveredAt: null,
    hasReviewed: false,
    cancellationReason: null,
    timestamps: {
      PENDING: "2026-08-24T09:41:00.000Z",
      CONFIRMED: "2026-08-24T10:15:00.000Z",
      PROCESSING: "2026-08-24T14:30:00.000Z",
      IN_TRANSIT: "2026-08-25T08:00:00.000Z",
    },
    createdAt: "2026-08-24T09:41:00.000Z",
  },
  {
    id: "order-002",
    orderNumber: "ROA-4799",
    userId: "user-001",
    storeId: "store-003",
    buyer: {
      id: "user-001",
      name: "Samuel Adeolu",
      email: "samuel@gmail.com",
      avatar: null,
    },
    store: STORES[2],
    items: [
      {
        id: "item-002",
        productId: "prod-002",
        product: PRODUCTS[1],
        quantity: 1,
        price: 185000,
        variant: { Storage: "256GB", Colours: "Awesome Navy" },
      },
    ],
    subtotal: 185000,
    deliveryFee: 0,
    discount: 0,
    total: 185000,
    status: "CANCELLED",
    paymentStatus: "REFUNDED",
    paymentMethod: "r.o.a. Wallet",
    deliveryAddress: {
      street: "15 Bode Thomas Street",
      city: "Surulere",
      state: "Lagos",
      country: "Nigeria",
    },
    deliveryNote: null,
    estimatedAt: null,
    deliveredAt: null,
    hasReviewed: false,
    cancellationReason: "Item out of stock at time of processing",
    timestamps: {
      PENDING: "2026-08-20T15:22:00.000Z",
      CONFIRMED: "2026-08-20T16:00:00.000Z",
      CANCELLED: "2026-08-21T09:00:00.000Z",
    },
    createdAt: "2026-08-20T15:22:00.000Z",
  },
  {
    id: "order-003",
    orderNumber: "ROA-4790",
    userId: "user-001",
    storeId: "store-001",
    buyer: {
      id: "user-001",
      name: "Samuel Adeolu",
      email: "samuel@gmail.com",
      avatar: null,
    },
    store: STORES[0],
    items: [
      {
        id: "item-003",
        productId: "prod-003",
        product: PRODUCTS[2],
        quantity: 2,
        price: 12000,
        variant: null,
      },
      {
        id: "item-004",
        productId: "prod-004",
        product: PRODUCTS[3],
        quantity: 1,
        price: 8000,
        variant: { Weight: "2.5kg", Type: "Standard" },
      },
    ],
    subtotal: 32000,
    deliveryFee: 2000,
    discount: 3000,
    total: 31000,
    status: "DELIVERED",
    paymentStatus: "PAID",
    paymentMethod: "Card",
    deliveryAddress: {
      street: "15 Bode Thomas Street",
      city: "Surulere",
      state: "Lagos",
      country: "Nigeria",
    },
    deliveryNote: null,
    estimatedAt: "2026-08-18T17:00:00.000Z",
    deliveredAt: "2026-08-18T15:30:00.000Z",
    hasReviewed: false,
    cancellationReason: null,
    timestamps: {
      PENDING: "2026-08-15T11:05:00.000Z",
      CONFIRMED: "2026-08-15T11:45:00.000Z",
      PROCESSING: "2026-08-15T14:00:00.000Z",
      IN_TRANSIT: "2026-08-17T08:00:00.000Z",
      DELIVERED: "2026-08-18T15:30:00.000Z",
    },
    createdAt: "2026-08-15T11:05:00.000Z",
  },
  {
    id: "order-004",
    orderNumber: "ROA-4822",
    userId: "user-002",
    storeId: "store-001",
    buyer: {
      id: "user-002",
      name: "Chioma Okafor",
      email: "chioma@gmail.com",
      avatar: null,
    },
    store: STORES[0],
    items: [
      {
        id: "item-005",
        productId: "prod-003",
        product: PRODUCTS[2],
        quantity: 1,
        price: 12000,
        variant: null,
      },
    ],
    subtotal: 12000,
    deliveryFee: 1500,
    discount: 0,
    total: 13500,
    status: "PENDING",
    paymentStatus: "PAID",
    paymentMethod: "r.o.a. Wallet",
    deliveryAddress: {
      street: "22 Ozumba Mbadiwe Avenue",
      city: "Victoria Island",
      state: "Lagos",
      country: "Nigeria",
    },
    deliveryNote: "Leave with security if I am not around",
    estimatedAt: null,
    deliveredAt: null,
    hasReviewed: false,
    cancellationReason: null,
    timestamps: {
      PENDING: "2026-08-26T07:30:00.000Z",
    },
    createdAt: "2026-08-26T07:30:00.000Z",
  },
];

// ============================================================
// NOTIFICATIONS
// ============================================================
export const NOTIFICATIONS = [
  {
    id: "notif-001",
    userId: "user-001",
    type: "ORDER_IN_DELIVERY",
    title: "Your order is <strong>on the way</strong> 🚚",
    description:
      "Order ROA-4821 from Zara NG has been picked up and is heading your way. Estimated arrival: today by 5 PM.",
    read: false,
    requiresAction: true,
    metadata: {
      orderId: "order-001",
      route: "/orders/order-001",
    },
    createdAt: "2026-08-26T08:00:00.000Z",
  },
  {
    id: "notif-002",
    userId: "user-001",
    type: "WALLET",
    title: "Wallet funded successfully 💰",
    description:
      "₦20,000 has been added to your r.o.a. wallet. Your new balance is ₦32,400.",
    read: false,
    requiresAction: false,
    metadata: {
      transactionId: "txn-002",
      route: "/wallet/transactions",
    },
    createdAt: "2026-08-26T07:00:00.000Z",
  },
  {
    id: "notif-003",
    userId: "user-001",
    type: "STORE_NEW_PRODUCT",
    title: "<strong>SportZone Official</strong> added new products",
    description:
      "A store you follow just listed 5 new items including Ankara dress sets and linen blazers.",
    read: false,
    requiresAction: false,
    metadata: {
      storeId: "store-001",
      route: "/store/store-001",
    },
    createdAt: "2026-08-26T06:00:00.000Z",
  },
  {
    id: "notif-004",
    userId: "user-001",
    type: "STORE_SALE",
    title: "⚡ Flash sale — <strong>40% off</strong> today only",
    description:
      "Zara NG is running a flash sale on selected items. Sale ends in 3 hours — do not miss out.",
    read: false,
    requiresAction: false,
    metadata: {
      storeId: "store-002",
      route: "/store/store-002",
    },
    createdAt: "2026-08-25T20:00:00.000Z",
  },
  {
    id: "notif-005",
    userId: "user-001",
    type: "WISHLIST_RESTOCK",
    title: "Wishlist item <strong>back in stock</strong> 🎉",
    description:
      "Adidas Running Shoes Pro from SportZone is available again. Only 5 units left.",
    read: true,
    requiresAction: true,
    metadata: {
      productId: "prod-005",
      route: "/product/prod-005",
    },
    createdAt: "2026-08-25T15:00:00.000Z",
  },
  {
    id: "notif-006",
    userId: "user-001",
    type: "ORDER_DELIVERED",
    title: "Order <strong>delivered</strong> successfully ✓",
    description:
      "Order ROA-4790 has been marked as delivered. How was your experience? Leave a review for SportZone.",
    read: true,
    requiresAction: true,
    metadata: {
      orderId: "order-003",
      route: "/orders/order-003",
    },
    createdAt: "2026-08-18T16:00:00.000Z",
  },
  {
    id: "notif-007",
    userId: "user-001",
    type: "ORDER_CANCELLED",
    title: "Order <strong>cancelled</strong> — refund processed",
    description:
      "Your order ROA-4799 was cancelled. ₦185,000 has been refunded to your r.o.a. wallet.",
    read: true,
    requiresAction: false,
    metadata: {
      orderId: "order-002",
      route: "/orders/order-002",
    },
    createdAt: "2026-08-21T09:30:00.000Z",
  },
  {
    id: "notif-008",
    userId: "user-001",
    type: "PROMO",
    title: "🎁 Special offer just for you",
    description:
      "Get 15% off your next purchase with code ROA15. Valid for 48 hours only.",
    read: true,
    requiresAction: false,
    metadata: {
      route: "/shop",
    },
    createdAt: "2026-08-20T10:00:00.000Z",
  },
];

// ============================================================
// TRANSACTIONS (WALLET)
// ============================================================
export const TRANSACTIONS = [
  {
    id: "txn-001",
    userId: "user-001",
    type: "PURCHASE",
    title: "Order payment",
    description: "Payment for order ROA-4821 from Zara NG",
    amount: 29500,
    status: "COMPLETED",
    reference: "ORD-ROA4821-001",
    metadata: {
      orderId: "order-001",
      route: "/orders/order-001",
    },
    createdAt: "2026-08-24T09:42:00.000Z",
  },
  {
    id: "txn-002",
    userId: "user-001",
    type: "TOPUP",
    title: "Wallet top up",
    description: "Funded via Paystack debit card",
    amount: 20000,
    status: "COMPLETED",
    reference: "TXN-PAY-20240826-002",
    metadata: {},
    createdAt: "2026-08-26T07:00:00.000Z",
  },
  {
    id: "txn-003",
    userId: "user-001",
    type: "REFUND",
    title: "Refund received",
    description: "Refund for cancelled order ROA-4799",
    amount: 185000,
    status: "COMPLETED",
    reference: "REF-ROA4799-003",
    metadata: {
      orderId: "order-002",
      route: "/orders/order-002",
    },
    createdAt: "2026-08-21T09:35:00.000Z",
  },
  {
    id: "txn-004",
    userId: "user-001",
    type: "WITHDRAWAL",
    title: "Withdrawal",
    description: "Sent to GTBank ****1234",
    amount: 10000,
    status: "COMPLETED",
    reference: "WDR-GTB-20240820-004",
    metadata: {},
    createdAt: "2026-08-20T11:05:00.000Z",
  },
  {
    id: "txn-005",
    userId: "user-001",
    type: "PURCHASE",
    title: "Order payment",
    description: "Payment for order ROA-4790 from SportZone Official",
    amount: 31000,
    status: "COMPLETED",
    reference: "ORD-ROA4790-005",
    metadata: {
      orderId: "order-003",
      route: "/orders/order-003",
    },
    createdAt: "2026-08-15T11:06:00.000Z",
  },
  {
    id: "txn-006",
    userId: "user-001",
    type: "TOPUP",
    title: "Wallet top up",
    description: "Funded via bank transfer",
    amount: 50000,
    status: "COMPLETED",
    reference: "TXN-TRF-20240810-006",
    metadata: {},
    createdAt: "2026-08-10T14:22:00.000Z",
  },
  {
    id: "txn-007",
    userId: "user-001",
    type: "TOPUP",
    title: "Top up failed",
    description: "Card payment failed — not debited",
    amount: 5000,
    status: "FAILED",
    reference: "TXN-PAY-20240808-007",
    metadata: {},
    createdAt: "2026-08-08T16:10:00.000Z",
  },
  {
    id: "txn-008",
    userId: "user-001",
    type: "SALE",
    title: "Sale received",
    description: "Payment for Nike Football sold — SportZone Official",
    amount: 6200,
    status: "COMPLETED",
    reference: "SAL-ROA4788-008",
    metadata: {
      storeId: "store-001",
      orderId: "order-003",
    },
    createdAt: "2026-08-05T09:30:00.000Z",
  },
];

// ============================================================
// SELLER EARNINGS (for seller dashboard)
// ============================================================
export const SELLER_EARNINGS = {
  storeId: "store-001",
  walletBalance: 284500,
  thisMonth: 284500,
  lastMonth: 229000,
  totalEarned: 1240000,
  pendingClearance: 45000,
  monthlyData: [
    { month: "Jan", revenue: 85000 },
    { month: "Feb", revenue: 120000 },
    { month: "Mar", revenue: 95000 },
    { month: "Apr", revenue: 145000 },
    { month: "May", revenue: 178000 },
    { month: "Jun", revenue: 210000 },
    { month: "Jul", revenue: 229000 },
    { month: "Aug", revenue: 284500 },
  ],
  topProducts: [
    {
      productId: "prod-003",
      name: "Nike Strike Football",
      unitsSold: 24,
      revenue: 288000,
    },
    {
      productId: "prod-005",
      name: "Adidas Running Shoes",
      unitsSold: 18,
      revenue: 630000,
    },
    {
      productId: "prod-004",
      name: "Premium Ofada Rice",
      unitsSold: 35,
      revenue: 297500,
    },
  ],
  transactions: [
    {
      id: "stxn-001",
      type: "SALE",
      title: "Sale received",
      description: "Order ROA-4790 — Samuel Adeolu",
      amount: 29450,
      status: "COMPLETED",
      reference: "SAL-ROA4790-001",
      createdAt: "2026-08-15T11:07:00.000Z",
    },
    {
      id: "stxn-002",
      type: "WITHDRAWAL",
      title: "Withdrawal",
      description: "Sent to GTBank ****1234",
      amount: 50000,
      status: "COMPLETED",
      reference: "WDR-GTB-20240813-002",
      createdAt: "2026-08-13T10:00:00.000Z",
    },
    {
      id: "stxn-003",
      type: "REFUND",
      title: "Refund issued",
      description: "Refund for cancelled order ROA-4799",
      amount: 185000,
      status: "COMPLETED",
      reference: "REF-ROA4799-003",
      createdAt: "2026-08-21T09:36:00.000Z",
    },
  ],
};

// ============================================================
// BANNERS (for shop page and homepage)
// ============================================================
export const BANNERS = [
  {
    id: "banner-001",
    tag: "Flash sale",
    headline: "Up to 40% off Fashion",
    sub: "Limited time — ends tonight at midnight",
    cta: "Shop now",
    bg: "linear-gradient(135deg,#1a1a3e,#2d1b69)",
    route: "/shop?category=Fashion",
  },
  {
    id: "banner-002",
    tag: "New on r.o.a.",
    headline: "Fresh Farm Produce",
    sub: "Direct from Benue and Ogun farmers",
    cta: "Browse agriculture",
    bg: "linear-gradient(135deg,#1a4a1a,#2d7a0a)",
    route: "/shop?category=Agriculture",
  },
  {
    id: "banner-003",
    tag: "Open your store",
    headline: "Sell on r.o.a. Free",
    sub: "Join 10,000+ sellers earning every day",
    cta: "Get started",
    bg: "linear-gradient(135deg,#1a1a0a,#3a2a00)",
    route: "/createstore",
  },
];

// ============================================================
// WISHLIST
// ============================================================
export const WISHLIST = [
  {
    userId: "user-001",
    productId: "prod-005",
    product: PRODUCTS[4],
    addedAt: "2026-08-10T14:00:00.000Z",
  },
  {
    userId: "user-001",
    productId: "prod-002",
    product: PRODUCTS[1],
    addedAt: "2026-08-05T11:00:00.000Z",
  },
];

// ============================================================
// WALLET SUMMARY (computed from transactions)
// ============================================================
export const WALLET_SUMMARY = {
  userId: "user-001",
  balance: 12400,
  moneyIn: 255000,
  moneyOut: 40500,
  inCount: 3,
  outCount: 2,
};

// ============================================================
// STORE FOLLOWS
// ============================================================
export const STORE_FOLLOWS = [
  {
    userId: "user-001",
    storeId: "store-001",
    followedAt: "2024-02-01T00:00:00.000Z",
  },
  {
    userId: "user-001",
    storeId: "store-002",
    followedAt: "2024-03-15T00:00:00.000Z",
  },
  {
    userId: "user-002",
    storeId: "store-001",
    followedAt: "2024-04-10T00:00:00.000Z",
  },
];

// ============================================================
// REVIEWS
// ============================================================
export const REVIEWS = [
  {
    id: "rev-001",
    storeId: "store-001",
    userId: "user-001",
    orderId: "order-003",
    rating: 5,
    comment:
      "Excellent store! Products arrived in perfect condition and exactly as described. Will definitely order again.",
    createdAt: "2026-08-19T10:00:00.000Z",
    user: { name: "Samuel A.", avatar: null },
  },
  {
    id: "rev-002",
    storeId: "store-001",
    userId: "user-002",
    orderId: "order-004",
    rating: 4,
    comment:
      "Good products and fast delivery. Only thing is packaging could be better.",
    createdAt: "2026-08-22T09:00:00.000Z",
    user: { name: "Chioma O.", avatar: null },
  },
];

// ============================================================
// HELPER — get by ID functions
// ============================================================
export const getStoreById = (id) => STORES.find((s) => s.id === id) || null;
export const getProductById = (id) => PRODUCTS.find((p) => p.id === id) || null;
export const getOrderById = (id) => ORDERS.find((o) => o.id === id) || null;

export const getOrdersByBuyer = (userId) =>
  ORDERS.filter((o) => o.userId === userId);
export const getOrdersBySeller = (storeId) =>
  ORDERS.filter((o) => o.storeId === storeId);

export const getNotificationsByUser = (userId) =>
  NOTIFICATIONS.filter((n) => n.userId === userId);
export const getTransactionsByUser = (userId) =>
  TRANSACTIONS.filter((t) => t.userId === userId);
export const getProductsByStore = (storeId) =>
  PRODUCTS.filter((p) => p.storeId === storeId);
export const getReviewsByStore = (storeId) =>
  REVIEWS.filter((r) => r.storeId === storeId);
export const getWishlistByUser = (userId) =>
  WISHLIST.filter((w) => w.userId === userId);
