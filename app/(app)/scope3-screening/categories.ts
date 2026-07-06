export const SCOPE3_CATEGORIES = [
  { number: 1,  name: "Purchased goods and services",              example: "Raw materials, packaging, components" },
  { number: 2,  name: "Capital goods",                             example: "Equipment, machinery, buildings" },
  { number: 3,  name: "Fuel- and energy-related activities",       example: "Upstream emissions from grid electricity" },
  { number: 4,  name: "Upstream transportation and distribution",  example: "Freight to your facilities" },
  { number: 5,  name: "Waste generated in operations",             example: "Landfill, recycling, composting" },
  { number: 6,  name: "Business travel",                           example: "Flights, hotels, rental cars" },
  { number: 7,  name: "Employee commuting",                        example: "Daily travel to work" },
  { number: 8,  name: "Upstream leased assets",                    example: "Leased equipment or vehicles you operate" },
  { number: 9,  name: "Downstream transportation",                 example: "Shipping to customers" },
  { number: 10, name: "Processing of sold products",               example: "Customer processing of your intermediate goods" },
  { number: 11, name: "Use of sold products",                      example: "Emissions from using what you sell" },
  { number: 12, name: "End-of-life treatment of sold products",    example: "Disposal of your products by customers" },
  { number: 13, name: "Downstream leased assets",                  example: "Assets you own and lease to others" },
  { number: 14, name: "Franchises",                                example: "Emissions from franchisee operations" },
  { number: 15, name: "Investments",                               example: "Portfolio company emissions" },
] as const;

export type Scope3Category = typeof SCOPE3_CATEGORIES[number];
