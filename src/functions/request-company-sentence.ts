import { openai } from "../utils/openai";

export const requestCompanySentence = async (prompt: string) => {
  const overviewExec = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are an executive summary writer. You will be given a company overview and should produce a brief one sentence summary of the business to use as a case name. You should use clear and concise language to explain. Your summary should be no longer than 12 words. Use title case.",
      },
      {
        role: "user",
        content: `company details: ${prompt}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  console.log(overviewExec.choices);

  return overviewExec.choices[0].message.content;
};
