import { openai } from "../utils/openai";

function createPrioritizationPrompt(
  features: { featureName: string; description: string }[]
): string {
  // Build the prompt by summarizing the items to prioritize
  const featureDescriptions = features
    .map(
      (feature) =>
        `Feature Name: ${feature.featureName}\nDescription: ${feature.description}`
    )
    .join("\n\n");

  return `
      You are tasked with creating a prioritized plan for the following tasks or features:
  
      ${featureDescriptions}
  
      For each item, provide the following:
      1. What needs to be done to implement it (specific tasks or steps).
      2. The estimated impact of the item (on a scale of 1 to 10, where 10 is the highest impact).
      3. The estimated ease of implementation (on a scale of 1 to 10, where 10 is the easiest).
  
      Then, order the items by priority, with those having the highest combination of impact and ease of implementation listed first.
      
      Output the details as a JSON Object with the following structure:
      [
        "features": {
          "featureName": "string",
          "details": "string",
          "impact": number,
          "easeOfImplementation": number
        }
      ]
    `;
}

export const requestFeatureDetails = async (
  items: { featureName: string; description: string }[]
) => {
  const prioritizationExec = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert in prioritization and resource planning.`,
      },
      {
        role: "user",
        content: createPrioritizationPrompt(items),
      },
    ],
    temperature: 0.7,
    max_tokens: 1500,
    response_format: { type: "json_object" }, // Expect JSON array as output
  });

  // Parse and sort by impact vs ease of implementation
  const parsedResults: {
    features: {
      featureName: string;
      details: string;
      impact: number;
      easeOfImplementation: number;
    }[];
  } = prioritizationExec.choices[0].message.content
    ? JSON.parse(prioritizationExec.choices[0].message.content)
    : {};

  return parsedResults.features.sort(
    (a, b) =>
      b.impact * b.easeOfImplementation - a.impact * a.easeOfImplementation
  );
};
