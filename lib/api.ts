/** Base of the TPHL REST API, without a trailing slash. */
export const API_BASE = (
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api.dpremiumhomes.com/api"
).replace(/\/+$/, "");

/** Base of the TPHL ERP API, without a trailing slash. */
export const ERP_BASE_URL = (
  process.env.NEXT_PUBLIC_ERP_API_BASE_URL ||
  "https://thepremiumhomesltd.com/TPHL-ERP"
).replace(/\/+$/, "");
