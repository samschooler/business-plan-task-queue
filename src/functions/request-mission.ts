import { openai } from "../utils/openai";

export const requestMission = async (overview: string) => {
  const missionExec = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are an executive summary writer. You will be given a company overview and should produce a mission statement for a business plan. You should use clear and concise language to explain.",
      },
      {
        role: "user",
        content: `company details: ${overview}\n\nMission statement:`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return missionExec.choices[0].message.content;
};
