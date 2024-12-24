import { openai } from "../utils/openai";

export const requestOverview = async (prompt: string) => {
  const overviewExec = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are an executive summary writer. You will be given a company description and should produce an overview of the business. You should use clear and concise language to explain. Your summary should be no longer than 100 words.",
      },
      {
        role: "user",
        content: `company details: ${prompt}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return overviewExec.choices[0].message.content;
};
