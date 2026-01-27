import type { Location } from "../types";

// Campus locations organized by category
export const campusLocations: Location[] = [
  // Hostels
  {
    id: "1",
    name: "Ad Gentes Male Hostel",
    category: "hostels",
    lat: 6.470028,
    lng: 7.527181,
    distance: "2 min",
    description: "Ad Gentes Male hostel",
    openingHours: "Everyday: 6AM-6PM"
  },
  {
    id: "2",
    name: "CVC Onaga Female Hostel",
    category: "hostels",
    lat: 6.471026,
    lng: 7.526857,
    distance: "5 min",
    description: "CVC Onaga Female Hostel",
    openingHours: "Everyday: 6AM-6PM"
  },
  {
    id: "3",
    name: "Emilia Female Hostel",
    category: "hostels",
    lat: 6.473956,
    lng: 7.530374,
    distance: "5 min",
    description: "Emilia Female Hostel",
    openingHours: "Everyday: 6AM-6PM"
  },
  {
    id: "4",
    name: "Gabriel Ozude Female Hostel",
    category: "hostels",
    lat: 6.471817,
    lng: 7.528811,
    distance: "5 min",
    description: "Gabriel Ozude Female Hostel",
    openingHours: "Everyday: 6AM-6PM"
  },
  {
    id: "5",
    name: "Our Saviour Male Hostel",
    category: "hostels",
    lat: 6.471029,
    lng: 7.526138,
    distance: "5 min",
    description: "Our Saviour Male Hostel",
    openingHours: "Everyday: 6AM-6PM"
  },
  {
    id: "6",
    name: "Sacred Heart Female Hostel",
    category: "hostels",
    lat: 6.471001,
    lng: 7.526918,
    distance: "5 min",
    description: "Sacred Heart Female Hostel",
    openingHours: "Everyday: 6AM-6PM"
  },
  {
    id: "7",
    name: "Prof. Mary Gloria Female Hostel",
    category: "hostels",
    lat: 6.470300,
    lng: 7.526934,
    distance: "5 min",
    description: "Prof. Mary Gloria Female Hostel",
    openingHours: "Everyday: 6AM-6PM"
  },
  {
    id: "8",
    name: "St. Stephen Male Hostel",
    category: "hostels",
    lat: 6.470010,
    lng: 7.526974,
    distance: "5 min",
    description: "St. Steaphen Male Hostel",
    openingHours: "Everyday: 6AM-6PM"
  },
  {
    id: "9",
    name: "Lilian Charlse Female Hostel",
    category: "hostels",
    lat: 6.471706,
    lng: 7.526146,
    distance: "5 min",
    description: "Lilian Charlse Female Hostel",
    openingHours: "Everyday: 6AM-6PM"
  },
  {
    id: "10",
    name: "St. Francis Female Hostel",
    category: "hostels",
    lat: 6.474800,
    lng: 7.528604,
    distance: "5 min",
    description: "St. Francis Female Hostel",
    openingHours: "Everyday: 6AM-6PM"
  },
  {
    id: "11",
    name: "Prof. Mariam Unachukwu Female Hostel",
    category: "hostels",
    lat: 6.475392,
    lng: 7.528120,
    distance: "5 min",
    description: "Prof. Mariam Unachukwu Female Hostel",
    openingHours: "Everyday: 6AM-6PM"
  },
  {
    id: "12",
    name: "Regina Female Hostel",
    category: "hostels",
    lat: 6.472079,
    lng: 7.527746,
    distance: "5 min",
    description: "Regina Female Hostel",
    openingHours: "Everyday: 6AM-6PM"
  },

  // Administrative Offices
  {
    id: "13",
    name: "Admin Block",
    category: "offices",
    lat: 6.4485,
    lng: 7.5141,
    distance: "4 min",
    description: "Administrative offices and student affairs."
  },

  // Academic Buildings
  {
    id: "14",
    name: "Convocation Arena",
    category: "academics",
    lat: 6.4485,
    lng: 7.5141,
    distance: "2 min",
    description: "Home to the Faculty of Sciences with modern laboratories.",
    openingHours: "Sun-Sat: 6AM-8PM"
  },
  {
    id: "15",
    name: "Engineering Block",
    category: "academics",
    lat: 6.4485,
    lng: 7.5141,
    distance: "5 min",
    description: "Faculty of Engineering with state-of-the-art facilities.",
    openingHours: "Mon-Fri: 8AM-6PM"
  },

  // Food & Cafeterias
  {
    id: "16",
    name: "Central Cafeteria",
    category: "food",
    lat: 6.4485,
    lng: 7.5141,
    distance: "3 min",
    description: "Serves breakfast, lunch and dinner. Multiple cuisine options available.",
    openingHours: "Daily: 6AM-9PM"
  },

  // Health & Safety
  {
    id: "17",
    name: "Campus Clinic",
    category: "health",
    lat: 6.4485,
    lng: 7.5141,
    distance: "6 min",
    description: "24/7 medical services for students and staff."
  },

  // Churches
  {
    id: "18",
    name: "Chapel",
    category: "churches",
    lat: 6.4485,
    lng: 7.5141,
    distance: "5 min",
    description: "Multi-denominational worship center."
  },

  // Sports & Recreation
  {
    id: "19",
    name: "Sports Complex",
    category: "sports",
    lat: 6.4485,
    lng: 7.5141,
    distance: "10 min",
    description: "Indoor and outdoor sports facilities."
  },

  // Shops & Services
  {
    id: "20",
    name: "Campus Bookshop",
    category: "shops",
    lat: 6.4485,
    lng: 7.5141,
    distance: "4 min",
    description: "Books, stationery, and campus merchandise."
  },
];

// Export as default for backward compatibility
export default campusLocations;