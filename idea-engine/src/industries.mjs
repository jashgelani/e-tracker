// One industry is the "focus" each day, rotating through this list so ideas
// cover every sector over time. Override with INDUSTRY="Dentistry" if wanted.
export const GENERAL_SUBS = ["SaaS", "microsaas", "Entrepreneur", "smallbusiness", "startups"];

export const INDUSTRIES = [
  { name: "Healthcare clinics & dentistry", terms: ["dental practice", "medical clinic"], subs: ["dentistry", "medicine", "healthcare"] },
  { name: "Real estate & property management", terms: ["property management", "real estate agent"], subs: ["realestate", "propertymanagement", "RealEstateTechnology"] },
  { name: "Accounting & bookkeeping", terms: ["bookkeeping", "accounting firm"], subs: ["accounting", "Bookkeeping", "taxpros"] },
  { name: "Legal & compliance", terms: ["law firm", "compliance"], subs: ["LegalTech", "paralegal", "lawfirm"] },
  { name: "E-commerce & Shopify", terms: ["shopify store", "ecommerce seller"], subs: ["ecommerce", "shopify", "FulfillmentByAmazon"] },
  { name: "Construction & trades", terms: ["contractor", "plumbing hvac business"], subs: ["Construction", "HVAC", "electricians"] },
  { name: "Logistics & trucking", terms: ["trucking dispatch", "freight broker"], subs: ["Truckers", "logistics", "FreightBrokers"] },
  { name: "Restaurants & hospitality", terms: ["restaurant owner", "hotel operations"], subs: ["restaurateur", "KitchenConfidential", "hotels"] },
  { name: "Education & tutoring", terms: ["tutoring business", "online course creator"], subs: ["Teachers", "OnlineEducation", "tutor"] },
  { name: "HR & recruiting", terms: ["recruiting agency", "hr small business"], subs: ["humanresources", "recruiting", "ATS"] },
  { name: "Marketing agencies", terms: ["marketing agency", "client reporting"], subs: ["agency", "marketing", "digital_marketing"] },
  { name: "Freelancers & consultants", terms: ["freelancer invoicing", "consultant"], subs: ["freelance", "consulting", "webdev"] },
  { name: "Fitness & wellness studios", terms: ["gym owner", "yoga studio"], subs: ["personaltraining", "gymowner", "yoga"] },
  { name: "Salons, spas & beauty", terms: ["salon owner", "barber shop"], subs: ["Hairdresser", "estheticians", "salonowners"] },
  { name: "Automotive & repair shops", terms: ["auto repair shop", "car dealership"], subs: ["MechanicAdvice", "AutoDetailing", "askcarsales"] },
  { name: "Agriculture & farming", terms: ["farm management", "agritech"], subs: ["farming", "agriculture", "homestead"] },
  { name: "Manufacturing & inventory", terms: ["small manufacturer", "inventory management"], subs: ["manufacturing", "supplychain", "ERP"] },
  { name: "Nonprofits & fundraising", terms: ["nonprofit", "donor management"], subs: ["nonprofit", "fundraising", "volunteer"] },
  { name: "Insurance & finance advisors", terms: ["insurance agent", "financial advisor"], subs: ["InsuranceAgent", "FinancialPlanning", "personalfinance"] },
  { name: "Event planning & weddings", terms: ["wedding planner", "event management"], subs: ["weddingplanning", "eventplanning", "EventProduction"] },
  { name: "Content creators & podcasters", terms: ["youtube creator", "podcaster"], subs: ["NewTubers", "podcasting", "SmallYoutubers"] },
  { name: "Developers & DevOps", terms: ["developer tools", "devops"], subs: ["devops", "ExperiencedDevs", "selfhosted"] },
  { name: "Cybersecurity & IT / MSPs", terms: ["msp managed service provider", "it helpdesk"], subs: ["msp", "sysadmin", "cybersecurity"] },
  { name: "Customer support & success", terms: ["customer support team", "helpdesk"], subs: ["customersuccess", "CustomerService", "supportops"] },
  { name: "Sales & B2B lead gen", terms: ["sales team crm", "cold outreach"], subs: ["sales", "b2bmarketing", "salesforce"] },
  { name: "Pet care & veterinary", terms: ["veterinary clinic", "dog grooming"], subs: ["VetTech", "dogtraining", "petsitting"] },
  { name: "Home services & cleaning", terms: ["cleaning business", "landscaping business"], subs: ["CleaningBusiness", "lawncare", "handyman"] },
  { name: "Travel & tour operators", terms: ["tour operator", "travel agent"], subs: ["travelagent", "TravelHacks", "TourGuides"] },
  { name: "Childcare & senior care", terms: ["daycare owner", "home care agency"], subs: ["daycare", "eldercare", "caregivers"] },
  { name: "Mental health & therapy practices", terms: ["therapist private practice", "counseling notes"], subs: ["therapists", "psychotherapy", "socialwork"] },
  { name: "Retail & local shops", terms: ["retail store owner", "pos system"], subs: ["retail", "smallbusiness", "POS"] },
  { name: "Energy & solar installers", terms: ["solar installer", "energy audit"], subs: ["solar", "SolarDIY", "energy"] },
  { name: "Gaming & communities", terms: ["discord community", "game studio"], subs: ["gamedev", "discordapp", "indiegaming"] },
  { name: "Procurement & vendor management", terms: ["procurement", "vendor onboarding"], subs: ["procurement", "supplychain", "purchasing"] },
  { name: "Government & public sector vendors", terms: ["government contractor", "rfp response"], subs: ["govcontracting", "grantwriting", "publicsector"] },
  { name: "Biotech & lab operations", terms: ["lab management", "clinical trial"], subs: ["labrats", "biotech", "bioinformatics"] },
  { name: "Photography & creative studios", terms: ["photographer business", "video production"], subs: ["WeddingPhotography", "videography", "photography"] },
  { name: "Franchise & multi-location ops", terms: ["franchise owner", "multi location business"], subs: ["franchising", "smallbusiness", "operations"] },
  { name: "Compliance-heavy ops (food safety, OSHA)", terms: ["food safety haccp", "osha compliance"], subs: ["foodsafety", "OSHA", "safety"] },
  { name: "Churches, clubs & membership orgs", terms: ["church management", "membership organization"], subs: ["churchtech", "ChurchMedia", "nonprofit"] },
];

export function pickIndustry(date = new Date(), override = process.env.INDUSTRY) {
  if (override) {
    const hit = INDUSTRIES.find((i) => i.name.toLowerCase().includes(override.toLowerCase()));
    return hit || { name: override, terms: [override], subs: [] };
  }
  const day = Math.floor(date.getTime() / 86400000);
  return INDUSTRIES[day % INDUSTRIES.length];
}
