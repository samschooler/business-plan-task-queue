import { openai } from "../utils/openai";

export const requestCoreProductFeatures = async (overview: string) => {
  const coreProductFeaturesExec = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are an expert in product development. You will be given a company overview and should produce a list of core product features for a business plan. You should use clear and concise language to explain. Return a json array 'features' with the 'featureName' and 'description'. Return at most 5 features.",
      },
      {
        role: "user",
        content: `company details: ${overview}\n\nCore product features:`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
    response_format: { type: "json_object" },
  });

  return JSON.parse(
    coreProductFeaturesExec.choices[0].message.content ?? "{}"
  ) as {
    features: {
      featureName: string;
      description: string;
    }[];
  };
};
