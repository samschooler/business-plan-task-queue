import { openai } from "../utils/openai";

export const requestMarketNeed = async (overview: string) => {
  const marketNeedExec = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are a market analyst. You will be given a company overview and should produce a market need for a business plan. You should use clear and concise language to explain.",
      },
      {
        role: "user",
        content: `company details: ${overview}\n\nMarket need:`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return marketNeedExec.choices[0].message.content;
};
