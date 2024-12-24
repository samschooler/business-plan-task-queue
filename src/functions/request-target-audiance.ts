import { openai } from "../utils/openai";

export const requestTargetAudience = async (overview: string) => {
  const possibleTargetAudienceExec = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are a market analyst. You will be given a company overview and should produce a list of possible target audiences for a business plan. You should use clear and concise language to explain. Return a json array 'audiences' with the 'audienceName' and the 'description'. Return at most 5 audiences.",
      },
      {
        role: "user",
        content: `company details: ${overview}\n\nTarget audience:`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
    response_format: { type: "json_object" },
  });

  return JSON.parse(
    possibleTargetAudienceExec.choices[0].message.content ?? "{}"
  );
};
