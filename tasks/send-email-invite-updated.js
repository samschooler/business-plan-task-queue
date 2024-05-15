const formData = require("form-data");
const Mailgun = require("mailgun.js");
const { createClient } = require("@supabase/supabase-js");
const _importDynamic = new Function("modulePath", "return import(modulePath)");

const fetch = async function (...args) {
  const { default: fetch } = await _importDynamic("node-fetch");
  return fetch(...args);
};

const getEmailsFromSurveyResults = (surveyResults) => {
  return surveyResults
    .map((result) => {
      const filledScreenKeys = Object.keys(result.results);
      const emailScreenId = filledScreenKeys.filter(
        (screenId) => result.survey.screens[screenId].type === "email"
      );
      return result.results[emailScreenId];
    })
    .filter((email) => email);
};

module.exports = async function async(payload, helpers) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
  );

  // this is the id of the invite itself
  const { id } = payload;
  const { data: inviteData, error: inviteError } = await supabase
    .from("invite")
    .select("id,title,short_code,survey(id,screens)")
    .eq("id", id)
    .single();

  helpers.logger.info(`requesting invite w id: ${id}`);

  if (inviteError) {
    helpers.logger.error(
      `Error on supabase invite request ${JSON.stringify(inviteError)}`
    );
    throw inviteError;
  }

  if (!inviteData) {
    helpers.logger.error(`No invite found with survey id ${id}`);
    return;
  }

  const surveyId = inviteData.survey.id;

  const { data, error } = await supabase
    .from("survey_results")
    .select("survey(id,screens),results,complete")
    .eq("survey", surveyId)
    .filter("complete", "eq", true);

  if (error) {
    helpers.logger.error(`Error on supabase survey_results request ${error}`);
    throw error;
  }

  if (!data) {
    helpers.logger.error(`No survey found with id ${id}`);
    return;
  }

  if (!data.length === 0) {
    helpers.logger.warn(`No survey result found with id ${id}`);
    return;
  }

  const emails = getEmailsFromSurveyResults(data);

  helpers.logger.info(
    `New survey result created with id ${id} notifying ${emails}!`
  );

  const icsResponse = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/event-ics/${inviteData.short_code}`
  );

  // Ensure the fetch was successful
  if (!icsResponse.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  // Get ReadableStream from the response body
  const webStream = icsResponse.body;

  const mailgun = new Mailgun(formData);
  const mg = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_API_KEY,
  });

  const emailObj = emails.reduce((acc, email) => {
    acc[email] = {
      email,
      name: "Friend",
    };
    return acc;
  }, {});

  console.log(emailObj);

  try {
    await mg.messages.create("mail.littleinvite.com", {
      from: "Little Invite <sam@mail.littleinvite.com>",
      to: emails,
      subject: `${inviteData.title} has been updated!`,
      text: `The new invite is attached, or can be viewed here: https://littleinvite.com/e/${inviteData.short_code}`,
      attachment: {
        data: webStream,
        filename: "invite.ics",
        contentType: "application/ics",
      },
      "recipient-variables": JSON.stringify(emailObj),
    });
  } catch (e) {
    // how to handle this error?
    helpers.logger.error(e);

    throw e;
  }
};
