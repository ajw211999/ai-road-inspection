import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

export const PLANS = {
  starter: {
    name: "Starter",
    price: 3000,
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    description: "For small towns under 10K population",
    features: [
      "Up to 50 road miles",
      "2 surveys per year",
      "PDF & CSV export",
      "Email support",
    ],
    limits: { surveysPerYear: 2, maxRoadMiles: 50, maxUsers: 3 },
  },
  standard: {
    name: "Standard",
    price: 8000,
    priceId: process.env.STRIPE_STANDARD_PRICE_ID,
    description: "For municipalities with 10K–50K population",
    features: [
      "Up to 200 road miles",
      "4 surveys per year",
      "All export formats (PDF, PPTX, Shapefile, CSV)",
      "GIS integration",
      "Priority support",
    ],
    limits: { surveysPerYear: 4, maxRoadMiles: 200, maxUsers: 10 },
  },
  professional: {
    name: "Professional",
    price: 18000,
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    description: "For cities with 50K–100K population",
    features: [
      "Up to 500 road miles",
      "Unlimited surveys",
      "All export formats (PDF, PPTX, Shapefile, CSV)",
      "GIS integration",
      "Dedicated account manager",
      "Priority support",
    ],
    limits: { surveysPerYear: Infinity, maxRoadMiles: 500, maxUsers: 25 },
  },
  enterprise: {
    name: "Enterprise",
    price: null,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    description: "For large cities and counties (500+ road miles)",
    features: [
      "Unlimited road miles",
      "Unlimited surveys",
      "Custom AI model training",
      "On-premise deployment option",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    limits: { surveysPerYear: Infinity, maxRoadMiles: Infinity, maxUsers: Infinity },
  },
} as const;

export type PlanKey = keyof typeof PLANS;
