import { RevenueStream } from "../types";
import { openai } from "../utils/openai";

export const requestCoreRevenueModel = async (overview: string) => {
  const coreRevenueModelExec = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `I need you to analyze the following company overview and extract key information regarding the **revenue streams** for the business. The company could have a variety of revenue models, such as subscription, one-time payments, consulting, or service-based pricing.
    
    Please break down the company's revenue streams into a single array of objects, each representing a revenue stream. Each object should include the following attributes:
    
    - **streamType**: The type of revenue stream (e.g., "One-Time Payment", "Hourly/Project-Based Fees", "Subscription", "Affiliate Program", "Consulting", etc.).
    - **description**: A short description of the revenue stream.
    - **pricingDetails**: Pricing information relevant to the revenue stream, such as rates, fees, or pricing models.
    - **otherDetails**: Any other relevant details (e.g., partnerships, usage-based pricing models, custom services, or affiliate commission).
    
    Please format your response as a JSON object in the following structure:
    
    {
    "revenueStreams": [
      {
        "streamType": "One-Time Payment",
        "description": "Single-time purchase of product or service.",
        "pricingDetails": "Price for initial product purchase",
        "otherDetails": "Details about the product covered by the price."
      },
      {
        "streamType": "Hourly/Project-Based Fees",
        "description": "Revenue generated from hourly rates or project fees.",
        "pricingDetails": "Hourly rate of $X or project cost of $Y",
        "otherDetails": "Scope of services provided under these fees."
      },
      {
        "streamType": "Retainer Agreement",
        "description": "Long-term agreements for regular service or support.",
        "pricingDetails": "Monthly fee of $Z for ongoing support.",
        "otherDetails": "Details of ongoing services provided."
      },
      {
        "streamType": "Subscription",
        "description": "Revenue from recurring monthly/annual subscriptions.",
        "pricingDetails": "Subscription model with pricing tier details",
        "otherDetails": "Estimated number of subscribers and average subscription value."
      },
      {
        "streamType": "Usage-Based Pricing",
        "description": "Revenue based on usage or consumption of the service.",
        "pricingDetails": "Charges based on usage, e.g., $X per 1000 API calls.",
        "otherDetails": "Expected usage rates or common customer usage behavior."
      },
      {
        "streamType": "Affiliate Program",
        "description": "Revenue from affiliate commissions or referral programs.",
        "pricingDetails": "Affiliate commissions of Y% per sale.",
        "otherDetails": "Details of affiliate network or partner agreements."
      },
      {
        "streamType": "Consulting",
        "description": "Revenue from providing consulting services.",
        "pricingDetails": "Hourly rate or per-project fee of $X.",
        "otherDetails": "Typical number of clients per year and deal sizes."
      },
      {
        "streamType": "Add-On Products/Services",
        "description": "Revenue from additional premium services or features.",
        "pricingDetails": "Additional features priced at $X each.",
        "otherDetails": "Sales volume or typical customer purchases."
      },
      {
        "streamType": "Partnerships & Collaborations",
        "description": "Revenue from partnerships or co-branded efforts.",
        "pricingDetails": "Revenue-sharing agreements or joint marketing revenues.",
        "otherDetails": "Brief details about the partnership and scope of collaboration."
      },
      {
        "streamType": "Other Revenue Streams",
        "description": "Any other forms of revenue generation.",
        "pricingDetails": "Details about non-standard revenue models.",
        "otherDetails": "Additional insights into unconventional revenue sources."
      }
    ]
    }`,
      },
      {
        role: "user",
        content: `company overview: ${overview}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
    response_format: { type: "json_object" },
  });

  return JSON.parse(
    coreRevenueModelExec.choices[0].message.content ?? "{}"
  ) as {
    revenueStreams: RevenueStream[];
  };
};
