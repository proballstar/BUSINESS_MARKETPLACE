import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slug(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

const HOURS_WEEKDAYS = {
  monday: { open: "09:00", close: "18:00", closed: false },
  tuesday: { open: "09:00", close: "18:00", closed: false },
  wednesday: { open: "09:00", close: "18:00", closed: false },
  thursday: { open: "09:00", close: "20:00", closed: false },
  friday: { open: "09:00", close: "20:00", closed: false },
  saturday: { open: "10:00", close: "17:00", closed: false },
  sunday: { open: "11:00", close: "16:00", closed: false },
};

const HOURS_RESTAURANT = {
  monday: { open: "11:00", close: "22:00", closed: false },
  tuesday: { open: "11:00", close: "22:00", closed: false },
  wednesday: { open: "11:00", close: "22:00", closed: false },
  thursday: { open: "11:00", close: "23:00", closed: false },
  friday: { open: "11:00", close: "23:30", closed: false },
  saturday: { open: "10:00", close: "23:30", closed: false },
  sunday: { open: "10:00", close: "21:00", closed: false },
};

const HOURS_SALON = {
  monday: { open: "10:00", close: "19:00", closed: false },
  tuesday: { open: "10:00", close: "19:00", closed: false },
  wednesday: { open: "10:00", close: "19:00", closed: false },
  thursday: { open: "10:00", close: "20:00", closed: false },
  friday: { open: "10:00", close: "20:00", closed: false },
  saturday: { open: "09:00", close: "18:00", closed: false },
  sunday: { open: "00:00", close: "00:00", closed: true },
};

async function main() {
  console.log("🌱 Seeding database...");

  // Hash password
  const password = await bcrypt.hash("password123", 12);

  // Create demo owner
  const owner = await prisma.user.upsert({
    where: { email: "owner@demo.com" },
    update: {},
    create: { name: "Alex Rivera", email: "owner@demo.com", password, role: "BUSINESS_OWNER" },
  });

  // Create second owner
  const owner2 = await prisma.user.upsert({
    where: { email: "sarah@demo.com" },
    update: {},
    create: { name: "Sarah Chen", email: "sarah@demo.com", password, role: "BUSINESS_OWNER" },
  });

  // Create demo customer
  const customer = await prisma.user.upsert({
    where: { email: "user@demo.com" },
    update: {},
    create: { name: "Jordan Lee", email: "user@demo.com", password, role: "CUSTOMER" },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: "mike@demo.com" },
    update: {},
    create: { name: "Mike Torres", email: "mike@demo.com", password, role: "CUSTOMER" },
  });

  const businesses = [
    {
      name: "The Golden Spoon Bistro",
      tagline: "Farm-to-table dining in the heart of the city",
      description: `The Golden Spoon Bistro is a beloved neighborhood restaurant that champions local farmers and sustainable ingredients. Since opening in 2018, we've been committed to creating dishes that celebrate the seasons and support our regional food community.\n\nOur open kitchen concept lets diners watch their meals being crafted, while our rotating seasonal menu ensures there's always something exciting to discover. From our signature truffle risotto to our famous weekend brunch spread, every dish is made with love and intention.\n\nWe offer vegetarian, vegan, and gluten-free options, and our sommelier-curated wine list pairs perfectly with any selection.`,
      category: "restaurant",
      subcategory: "Fine Dining",
      tags: ["farm-to-table", "organic", "seasonal-menu", "vegetarian-friendly", "wine-bar", "brunch"],
      address: "142 Oak Street",
      city: "Portland",
      state: "OR",
      zip: "97201",
      phone: "5034521890",
      email: "hello@goldenspoonbistro.com",
      website: "https://goldenspoonbistro.com",
      images: [
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
        "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
      ],
      hoursJson: HOURS_RESTAURANT,
      socialLinks: { facebook: "https://facebook.com/goldenspoon", instagram: "https://instagram.com/goldenspoonbistro", twitter: "", linkedin: "" },
      priceRange: "$$$",
      yearFounded: 2018,
      employeeCount: "11-25",
      featured: true,
      verified: true,
      premium: true,
      ownerId: owner.id,
    },
    {
      name: "Bloom & Glow Wellness Spa",
      tagline: "Your urban sanctuary for mind, body, and soul",
      description: `Bloom & Glow is Portland's premier wellness destination, offering a holistic approach to beauty and relaxation. Our team of certified therapists and estheticians are dedicated to creating personalized experiences that leave you feeling renewed and radiant.\n\nFrom Swedish massage and hot stone therapy to our signature facial treatments using organic skincare lines, we offer over 30 services tailored to your needs. Our couples suites are perfect for a romantic escape, and our membership program rewards regulars with exclusive discounts.\n\nWe believe wellness should be accessible, which is why we offer a sliding scale for first-time visitors and community days twice a month.`,
      category: "beauty",
      subcategory: "Day Spa",
      tags: ["massage", "facials", "organic-skincare", "couples-spa", "relaxation", "holistic"],
      address: "89 Lavender Lane",
      city: "Portland",
      state: "OR",
      zip: "97205",
      phone: "5039876543",
      email: "book@bloomandglow.com",
      website: "https://bloomandglow.com",
      images: [
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80",
        "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80",
      ],
      hoursJson: HOURS_SALON,
      socialLinks: { facebook: "", instagram: "https://instagram.com/bloomandglow", twitter: "", linkedin: "" },
      priceRange: "$$$",
      yearFounded: 2016,
      employeeCount: "6-10",
      featured: true,
      verified: true,
      premium: false,
      ownerId: owner2.id,
    },
    {
      name: "Pedal & Spoke Bike Shop",
      tagline: "Everything bikes — sales, service, community",
      description: `Pedal & Spoke has been Portland's go-to independent bike shop since 2012. We're a community hub as much as a shop — hosting group rides every Saturday, maintenance workshops on the first Sunday of every month, and an annual charity ride that's raised over $40,000 for local trail preservation.\n\nOur expert mechanics handle everything from basic tune-ups to custom builds and vintage restorations. We stock an extensive selection of city bikes, mountain bikes, e-bikes, and kids bikes from trusted brands, and our trade-in program makes upgrading affordable.\n\nBrought to you by cyclists, for cyclists.`,
      category: "retail",
      subcategory: "Sporting Goods",
      tags: ["bikes", "cycling", "repairs", "e-bikes", "community", "accessories"],
      address: "55 Cycle Way",
      city: "Portland",
      state: "OR",
      zip: "97214",
      phone: "5031234567",
      email: "ride@pedalandspoke.com",
      website: "https://pedalandspoke.com",
      images: [
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
        "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80",
      ],
      hoursJson: HOURS_WEEKDAYS,
      socialLinks: { facebook: "https://facebook.com/pedalandspoke", instagram: "https://instagram.com/pedalandspoke", twitter: "https://twitter.com/pedalandspoke", linkedin: "" },
      priceRange: "$$",
      yearFounded: 2012,
      employeeCount: "6-10",
      featured: true,
      verified: true,
      premium: false,
      ownerId: owner.id,
    },
    {
      name: "TechFix Pro",
      tagline: "Fast, affordable repair for all your devices",
      description: `TechFix Pro specializes in same-day repairs for smartphones, laptops, tablets, and gaming consoles. Our certified technicians handle everything from cracked screens and water damage to battery replacements and software issues.\n\nWe offer a 90-day warranty on all repairs and use only high-quality parts. Walk-ins are always welcome, and most phone repairs are done in under an hour. We also offer free diagnostics, data recovery services, and a mail-in repair option for customers outside the area.\n\nFamily-owned since 2015, we pride ourselves on honest pricing and no-surprise billing.`,
      category: "technology",
      subcategory: "Device Repair",
      tags: ["phone-repair", "laptop-repair", "screen-replacement", "data-recovery", "same-day", "warranty"],
      address: "301 Tech Blvd",
      city: "Portland",
      state: "OR",
      zip: "97209",
      phone: "5035559876",
      email: "support@techfixpro.com",
      website: "https://techfixpro.com",
      images: [
        "https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=800&q=80",
      ],
      hoursJson: {
        ...HOURS_WEEKDAYS,
        sunday: { open: "12:00", close: "17:00", closed: false },
      },
      socialLinks: { facebook: "https://facebook.com/techfixpro", instagram: "", twitter: "", linkedin: "" },
      priceRange: "$$",
      yearFounded: 2015,
      employeeCount: "6-10",
      featured: false,
      verified: true,
      premium: false,
      ownerId: owner2.id,
    },
    {
      name: "Little Scholars Tutoring Center",
      tagline: "Personalized learning for every child",
      description: `Little Scholars is a warm, supportive tutoring center serving students from kindergarten through 12th grade. Our certified teachers and subject-matter experts offer one-on-one and small group tutoring in math, reading, science, writing, and test prep.\n\nWe begin with a complimentary assessment to understand each student's learning style and goals. Our structured programs track progress monthly and include regular parent updates so families stay engaged in their child's growth.\n\nWe also offer SAT/ACT prep courses, college application essay coaching, and summer enrichment programs.`,
      category: "education",
      subcategory: "Tutoring",
      tags: ["tutoring", "kids", "math", "reading", "SAT-prep", "after-school"],
      address: "78 Scholars Way",
      city: "Beaverton",
      state: "OR",
      zip: "97005",
      phone: "5034441234",
      email: "learn@littlescholars.com",
      website: "https://littlescholars.com",
      images: [
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80",
      ],
      hoursJson: {
        monday: { open: "13:00", close: "20:00", closed: false },
        tuesday: { open: "13:00", close: "20:00", closed: false },
        wednesday: { open: "13:00", close: "20:00", closed: false },
        thursday: { open: "13:00", close: "20:00", closed: false },
        friday: { open: "13:00", close: "18:00", closed: false },
        saturday: { open: "09:00", close: "15:00", closed: false },
        sunday: { open: "00:00", close: "00:00", closed: true },
      },
      socialLinks: { facebook: "https://facebook.com/littlescholars", instagram: "", twitter: "", linkedin: "" },
      priceRange: "$$",
      yearFounded: 2019,
      employeeCount: "6-10",
      featured: false,
      verified: false,
      premium: false,
      ownerId: owner.id,
    },
    {
      name: "Bark & Wag Pet Grooming",
      tagline: "Where pets get pampered",
      description: `At Bark & Wag, we treat every pet like our own. Our experienced groomers specialize in all breeds and sizes, offering everything from basic baths and nail trims to full grooms, breed-specific styling, and spa packages with de-shedding treatments and blueberry facials.\n\nWe use only natural, hypoallergenic shampoos and conditioners safe for sensitive skin. Our salon is cage-free — your pup is free to roam our play area between grooming steps. We also offer a puppy's first groom package to make new dogs comfortable with the grooming experience.\n\nOnline booking available 24/7.`,
      category: "pet",
      subcategory: "Pet Grooming",
      tags: ["dog-grooming", "cat-grooming", "spa", "natural-products", "cage-free", "all-breeds"],
      address: "22 Paw Print Drive",
      city: "Lake Oswego",
      state: "OR",
      zip: "97034",
      phone: "5037778888",
      email: "wags@barkandwag.com",
      website: "https://barkandwag.com",
      images: [
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80",
      ],
      hoursJson: {
        ...HOURS_SALON,
        tuesday: { open: "09:00", close: "18:00", closed: false },
      },
      socialLinks: { facebook: "", instagram: "https://instagram.com/barkandwag", twitter: "", linkedin: "" },
      priceRange: "$$",
      yearFounded: 2020,
      employeeCount: "1-5",
      featured: false,
      verified: false,
      premium: false,
      ownerId: owner2.id,
    },
    {
      name: "Handy Home Services",
      tagline: "Trusted home repairs and improvements, done right",
      description: `Handy Home Services is your reliable partner for home maintenance and improvement projects. From small repairs like fixing leaky faucets and patching drywall, to larger projects like kitchen renovations and deck building, our licensed and insured team delivers quality craftsmanship at fair prices.\n\nWe offer free estimates on all projects over $500, and our transparent pricing means no hidden costs. Our technicians arrive on time, respect your home, and clean up thoroughly when finished. We're bonded, insured, and background-checked for your peace of mind.\n\nAvailable for emergency repairs with 24-hour response time.`,
      category: "home",
      subcategory: "General Contracting",
      tags: ["repairs", "renovation", "plumbing", "electrical", "handyman", "licensed"],
      address: "567 Builder Blvd",
      city: "Portland",
      state: "OR",
      zip: "97203",
      phone: "5036667777",
      email: "jobs@handyhomeservices.com",
      website: "https://handyhomeservices.com",
      images: [
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
      ],
      hoursJson: HOURS_WEEKDAYS,
      socialLinks: { facebook: "https://facebook.com/handyhomeservices", instagram: "", twitter: "", linkedin: "" },
      priceRange: "$$",
      yearFounded: 2017,
      employeeCount: "6-10",
      featured: false,
      verified: true,
      premium: false,
      ownerId: owner.id,
    },
    {
      name: "FitLife Gym & Training",
      tagline: "Achieve your best self — we'll coach you there",
      description: `FitLife is a community-focused gym offering state-of-the-art equipment and expert personal training in a welcoming environment. Whether you're just starting your fitness journey or you're a seasoned athlete, our certified trainers will design a program tailored to your goals.\n\nWe offer group classes in HIIT, yoga, spin, and strength training, as well as 1-on-1 personal training packages. Our nutrition coaching program pairs perfectly with any fitness plan. The gym is open 24/7 for members, and we offer a free 7-day trial pass for new visitors.\n\nNo intimidating atmosphere — just a supportive community working toward their goals.`,
      category: "fitness",
      subcategory: "Gym",
      tags: ["gym", "personal-training", "HIIT", "yoga", "spin", "nutrition", "24-hour"],
      address: "180 Fitness Plaza",
      city: "Portland",
      state: "OR",
      zip: "97201",
      phone: "5031112222",
      email: "train@fitlifegym.com",
      website: "https://fitlifegym.com",
      images: [
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
      ],
      hoursJson: {
        monday: { open: "00:00", close: "23:59", closed: false },
        tuesday: { open: "00:00", close: "23:59", closed: false },
        wednesday: { open: "00:00", close: "23:59", closed: false },
        thursday: { open: "00:00", close: "23:59", closed: false },
        friday: { open: "00:00", close: "23:59", closed: false },
        saturday: { open: "00:00", close: "23:59", closed: false },
        sunday: { open: "00:00", close: "23:59", closed: false },
      },
      socialLinks: { facebook: "https://facebook.com/fitlifegym", instagram: "https://instagram.com/fitlifegym", twitter: "", linkedin: "" },
      priceRange: "$$",
      yearFounded: 2014,
      employeeCount: "11-25",
      featured: true,
      verified: true,
      premium: false,
      ownerId: owner2.id,
    },
  ];

  const createdBusinesses: { id: string; name: string }[] = [];

  for (const biz of businesses) {
    const { tags, images, hoursJson, socialLinks, ownerId, ...rest } = biz;
    const s = slug(biz.name);
    const created = await prisma.business.upsert({
      where: { slug: s },
      update: {},
      create: {
        ...rest,
        slug: s,
        tags: JSON.stringify(tags),
        images: JSON.stringify(images),
        hoursJson: JSON.stringify(hoursJson),
        socialLinks: JSON.stringify(socialLinks),
        ownerId,
      },
    });
    createdBusinesses.push({ id: created.id, name: created.name });
    console.log(`  ✅ ${created.name}`);
  }

  // Seed reviews
  const reviewData = [
    {
      businessIdx: 0,
      userId: customer.id,
      rating: 5,
      title: "Absolutely exceptional dining experience",
      comment: "We celebrated our anniversary here and it exceeded every expectation. The truffle risotto was divine, and our server was incredibly knowledgeable about the wine pairings. The atmosphere is warm and intimate without feeling pretentious. We'll be back for every special occasion.",
      ownerReply: "Thank you so much for choosing us for your anniversary — that means the world to us! We look forward to celebrating many more milestones with you.",
    },
    {
      businessIdx: 0,
      userId: customer2.id,
      rating: 4,
      title: "Great food, slight wait time",
      comment: "The seasonal menu is fantastic and the ingredients are clearly top-quality. We had to wait about 25 minutes past our reservation time, but the host was apologetic and offered complimentary bread to make up for it. Would definitely return.",
    },
    {
      businessIdx: 1,
      userId: customer.id,
      rating: 5,
      title: "Best spa in Portland, hands down",
      comment: "I've tried half a dozen spas in this city and Bloom & Glow is on another level. The hot stone massage left me completely relaxed for days. The staff genuinely care about your wellbeing and take time to understand exactly what you need. The organic products smell amazing too.",
    },
    {
      businessIdx: 2,
      userId: customer2.id,
      rating: 5,
      title: "The only bike shop I'll ever use",
      comment: "Brought in my vintage road bike for a full restoration and the team was fantastic. They explained everything they were going to do, gave me an accurate estimate, and delivered on time. The Saturday group rides are a bonus — great way to meet other cyclists!",
      ownerReply: "So glad we could bring that beauty back to life! See you on the Saturday ride 🚴",
    },
    {
      businessIdx: 3,
      userId: customer.id,
      rating: 5,
      title: "Fastest phone fix ever",
      comment: "Shattered my screen at 10am and had it fixed by noon. Price was totally fair and they even replaced my worn-out battery at a discount while they had it open. The technician showed me exactly what parts they used. Refreshingly honest business.",
    },
    {
      businessIdx: 7,
      userId: customer.id,
      rating: 4,
      title: "Great gym, friendly community",
      comment: "Been a member for 6 months now. The equipment is well-maintained, the group classes are excellent (especially the Thursday HIIT with Coach Maria), and the 24/7 access is a game-changer for my schedule. Could use a few more squat racks but overall highly recommend.",
    },
  ];

  for (const review of reviewData) {
    const business = createdBusinesses[review.businessIdx];
    if (!business) continue;

    const existing = await prisma.review.findFirst({ where: { businessId: business.id, userId: review.userId } });
    if (!existing) {
      await prisma.review.create({
        data: {
          businessId: business.id,
          userId: review.userId,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          ownerReply: review.ownerReply || null,
          verified: true,
        },
      });
    }

    const { _avg, _count } = await prisma.review.aggregate({
      where: { businessId: business.id },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.business.update({
      where: { id: business.id },
      data: { rating: _avg.rating || 0, reviewCount: _count.rating, viewCount: Math.floor(Math.random() * 500) + 50 },
    });
  }

  console.log("\n✨ Seed complete!");
  console.log("\nDemo accounts:");
  console.log("  Business Owner: owner@demo.com / password123");
  console.log("  Customer: user@demo.com / password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
