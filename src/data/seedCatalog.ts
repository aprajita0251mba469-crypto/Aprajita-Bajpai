import type { Product, SustainabilityConfig, VolumeMl } from '../types.ts';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'aprajita.0251mba469@dgu.ac.in';
export const WHATSAPP_SUPPORT_NUMBER = '919876543210';
export const REUSABLE_CONTAINER_DEPOSIT_INR = 25;
export const FREE_DELIVERY_THRESHOLD_INR = 149;
export const STANDARD_DELIVERY_FEE_INR = 15;

export const HERO_IMAGE_URL = '/src/assets/images/hero_refill_station_1795192734935.jpg';

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod_handwash',
    name: 'Botanical Liquid Handwash',
    category: 'Personal Care',
    scent: 'Eucalyptus & Cedarwood',
    ingredients: 'Plant-derived coco-glucoside, organic aloe vera, eucalyptus oil, vegetable glycerin. Paraben & SLS free.',
    description: 'Gentle, pH-balanced foaming liquid handwash crafted for daily hostel and home sinks without harsh sulfates or single-use pump bottles.',
    imageUrl: '/src/assets/images/product_handwash_1795192735448.jpg',
    price250ml: 49,
    price500ml: 89,
    price1000ml: 165,
    mrpPlastic250ml: 95,
    mrpPlastic500ml: 165,
    mrpPlastic1000ml: 299,
    stockLitres: 48,
    active: true,
    featured: true,
  },
  {
    id: 'prod_dishwash',
    name: 'Citrus Dishwash Liquid',
    category: 'Kitchen',
    scent: 'Dehradun Lime & Basil',
    ingredients: 'Bio-enzymatic citrus extract, plant surfactants, natural neem hydrosol, food-safe mineral salt.',
    description: 'High-concentrate grease-cutting dishwash liquid formulated for shared hostel kitchens and tiffins. Rinses clean with minimal water.',
    imageUrl: '/src/assets/images/product_dishwash_1795192735218.jpg',
    price250ml: 45,
    price500ml: 79,
    price1000ml: 145,
    mrpPlastic250ml: 85,
    mrpPlastic500ml: 145,
    mrpPlastic1000ml: 265,
    stockLitres: 64,
    active: true,
    featured: true,
  },
  {
    id: 'prod_floor_cleaner',
    name: 'Pine & Lemongrass Floor Cleaner',
    category: 'Home Care',
    scent: 'Himalayan Pine & Lemongrass',
    ingredients: 'Steam-distilled pine oil, lemongrass essential oil, plant-based disinfectant, purified water.',
    description: 'Streak-free, non-toxic floor disinfectant safe for dorm rooms, marble, and tiles. Leaves a crisp Himalayan pine freshness.',
    imageUrl: '/src/assets/images/product_floor_cleaner_1795192735231.jpg',
    price250ml: 39,
    price500ml: 69,
    price1000ml: 125,
    mrpPlastic250ml: 75,
    mrpPlastic500ml: 130,
    mrpPlastic1000ml: 235,
    stockLitres: 85,
    active: true,
    featured: true,
  },
  {
    id: 'prod_laundry_detergent',
    name: 'Concentrated Laundry Detergent',
    category: 'Laundry',
    scent: 'Fresh Cotton & Lavender',
    ingredients: '5-enzyme stain lifter, coconut-derived soap nuts, biodegradable softening agents, lavender oil.',
    description: 'Low-foam, high-efficiency liquid detergent suitable for both bucket washes and hostel washing machines. 32 washes per 500 ml.',
    imageUrl: '/src/assets/images/product_laundry_detergent_1795192735019.jpg',
    price250ml: 59,
    price500ml: 109,
    price1000ml: 199,
    mrpPlastic250ml: 110,
    mrpPlastic500ml: 195,
    mrpPlastic1000ml: 360,
    stockLitres: 72,
    active: true,
    featured: true,
  },
];

export const SEED_SUSTAINABILITY_CONFIG: SustainabilityConfig = {
  plasticGramsPer500mlBottle: 28,
  co2GramsPerBottle: 82,
  demoBaselineRefills: 342,
  demoBaselineBottlesAvoided: 418,
  demoBaselineMoneySaved: 19650,
};

export const CAMPUS_LOCATIONS = [
  'DBS Boys Hostel — Block A',
  'DBS Boys Hostel — Block B',
  'DBS Girls Hostel — Block A',
  'DBS Girls Hostel — Block B',
  'DBS Faculty & Staff Residences',
  'Selaqui / Pondha Off-Campus PG',
  'Premnagar / Rajpur Road Household',
];

export const DELIVERY_SLOTS = [
  'Morning Campus Slot (8:30 AM – 10:30 AM)',
  'Afternoon Break (1:00 PM – 3:00 PM)',
  'Evening Hostel Run (5:30 PM – 8:00 PM)',
  'Weekend Bulk Refill (10:00 AM – 1:00 PM)',
];

export const SAMPLE_TESTIMONIALS = [
  {
    id: 't1',
    name: 'Aarav Rawat',
    role: 'MBA Semester II, Boys Hostel Block A',
    quote:
      'Before Refill+, our wing bought four separate plastic detergent and floor cleaner jugs every month. Now we refill our old 1L bottles outside Block A and save around ₹160 each month.',
    savingsMetric: '₹640 saved / semester (Sample)',
  },
  {
    id: 't2',
    name: 'Niharika Joshi',
    role: 'B.Tech CSE, Girls Hostel Block B',
    quote:
      'The 250 ml and 500 ml handwash refills fit right into my existing sink dispenser without cluttering my hostel shelf or throwing away pump heads.',
    savingsMetric: '9 bottles avoided (Sample)',
  },
  {
    id: 't3',
    name: 'Prof. Vivek Semwal',
    role: 'Faculty Quarters, DBS Global University',
    quote:
      'Ordering 1L dishwash and pine floor cleaner in returnable bottles has cut our household plastic packaging in half with reliable evening campus delivery.',
    savingsMetric: '₹1,120 saved / 6 months (Sample)',
  },
];

export const FAQ_ITEMS = [
  {
    q: 'How does bringing my own container work?',
    a: 'Simply select "Bring Own Container" at checkout, rinse your old clean bottle (250 ml, 500 ml, or 1 litre), and hand it over during your selected campus delivery slot—or swap at the hostel refill desk.',
  },
  {
    q: 'What if I do not have a bottle right now?',
    a: 'Choose "Request Reusable Container". We deliver your refill in a sanitized, heavy-duty Refill+ bottle for a ₹25 container fee (waived or refunded when returned on your next refill).',
  },
  {
    q: 'Where around DBS Global University do you deliver?',
    a: 'We deliver across all DBS Global University hostels, faculty quarters, and nearby student accommodations in Selaqui, Pondha, and Premnagar, Dehradun.',
  },
  {
    q: 'How are savings and plastic bottles avoided calculated?',
    a: 'Money saved compares each refill price against equivalent retail single-use plastic bottle MRPs. Every 500 ml equivalent refilled is estimated to avoid one 28g virgin HDPE/PET bottle and ~82g CO₂e packaging emissions.',
  },
];

export function getProductPrice(product: Product, volumeMl: VolumeMl): number {
  if (volumeMl === 250) return product.price250ml;
  if (volumeMl === 500) return product.price500ml;
  return product.price1000ml;
}

export function getProductPlasticMrp(product: Product, volumeMl: VolumeMl): number {
  if (volumeMl === 250) return product.mrpPlastic250ml;
  if (volumeMl === 500) return product.mrpPlastic500ml;
  return product.mrpPlastic1000ml;
}
