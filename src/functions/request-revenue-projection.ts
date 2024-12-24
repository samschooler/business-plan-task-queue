import { RevenueStream } from "../types";
import { openai } from "../utils/openai";

function createProjectionPrompt(revenueStreams: RevenueStream[]): string {
  // Build the prompt by summarizing the revenue streams
  const revenueStreamDescriptions = revenueStreams
    .map(
      (stream) =>
        `${stream.streamType}: Estimated revenue = $${stream.estimatedRevenue}\nDescription: ${stream.description}\nPricing Details: ${stream.pricingDetails}\nOther Details: ${stream.otherDetails}`
    )
    .join("\n\n");

  return `
      You are tasked with projecting the total revenue for the next three years based on the following revenue streams:
  
      ${revenueStreamDescriptions}
  
      Project the revenue for the next 3 years and provide reasoning for the projection in a markdown format. Assume the company does not exist yet. 0 customers, 0 revenue, and 0 growth rate. Year 1 is after 1 year of the business. Please give detailed explanations, such as expected growth rates, customer behavior, and any assumptions made for the calculations.
      
      Output the result as a JSON object with the following structure:
  
      {
        "years": {
          "projection": <revenue_value>,
          "reasoning": "<detailed_markdown_explanation>"
        }[]
      }
    `;
}

export const requestRevenueProjection = async (coreRevenueModel: {
  revenueStreams: RevenueStream[];
}) => {
  const revProjectionExec = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert in finance and revenue projection.`,
      },
      {
        role: "user",
        content: createProjectionPrompt(coreRevenueModel.revenueStreams),
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
    response_format: { type: "json_object" },
  });

  return JSON.parse(revProjectionExec.choices[0].message.content ?? "{}") as {
    years: {
      projection: number;
      reasoning: string;
    }[];
  };
};
