const formData = require("form-data");
const Mailgun = require("mailgun.js");
const { createClient } = require("@supabase/supabase-js");
const _importDynamic = new Function("modulePath", "return import(modulePath)");

const fetch = async function (...args) {
  const { default: fetch } = await _importDynamic("node-fetch");
  return fetch(...args);
};

module.exports = async function async(payload, helpers) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
  );

  const { id } = payload;
  helpers.logger.info(`requesting survey_results id: ${id}`);
  const { data, error } = await supabase
    .from("survey_results")
    .select("survey(id,screens),results,complete")
    .eq("id", id)
    .single();

  if (error) {
    helpers.logger.error(
      `Error on supabase survey_results request ${JSON.stringify(error)}`
    );
    throw error;
  }

  if (!data) {
    helpers.logger.error(`No survey result found with id ${id}`);
    return;
  }

  if (!data.complete) {
    helpers.logger.error(`Survey result with id ${id} is not complete`);
    return;
  }

  helpers.logger.info(`requesting invite w survey id: ${data.survey.id}`);
  const { data: inviteData, error: inviteError } = await supabase
    .from("invite")
    .select("id,title,short_code")
    .eq("survey", data.survey.id)
    .single();

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

  const filledScreenKeys = Object.keys(data.results);
  helpers.logger.info(`filledScreenKeys: ${filledScreenKeys}`);
  helpers.logger.info(data.survey.screens);
  const emailScreenId = filledScreenKeys.filter(
    (screenId) => data.survey.screens[screenId].type === "email"
  );

  helpers.logger.info(`emailScreenId: ${emailScreenId}`);
  const email = emailScreenId[0] ? data.results[emailScreenId[0]] : null;

  if (!email) {
    helpers.logger.info(
      `No email found in survey results with id ${id} and screen id ${emailScreenId}`
    );
    return;
  }

  helpers.logger.info(
    `New survey result created with id ${id} notifying ${email}!`
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
  try {
    const res = await mg.messages.create("mail.littleinvite.com", {
      from: "Little Invite <sam@mail.littleinvite.com>",
      to: [email],
      subject: `Invite to ${inviteData.title} has been RSVP'd!`,
      text: `You RSVP'd to an invite! Go check it out at https://littleinvite.com/e/${inviteData.short_code}`,
      attachment: {
        data: webStream,
        filename: "invite.ics",
        contentType: "application/ics",
      },
    });

    helpers.logger.info(`Email sent to ${email}`, res);
  } catch (e) {
    // how to handle this error?
    helpers.logger.error(e);

    throw e;
  }
};
