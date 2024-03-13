const formData = require("form-data");
const Mailgun = require("mailgun.js");
const { createClient } = require("@supabase/supabase-js");
const request = require("request");

module.exports = async function async(payload, helpers) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
  );

  const { id } = payload;
  const { data, error } = await supabase
    .from("survey_results")
    .select("survey(id,screens),results")
    .eq("id", id)
    .single();

  if (error) {
    helpers.logger.error(`Error on supabase survey_results request ${error}`);
    throw error;
  }

  if (!data) {
    helpers.logger.error(`No survey result found with id ${id}`);
    return;
  }

  const { data: inviteData, error: inviteError } = await supabase
    .from("invite")
    .select("id,title,short_code")
    .eq("survey", data.survey.id)
    .single();

  if (inviteError) {
    helpers.logger.error(`Error on supabase invite request ${inviteError}`);
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

  const icsRes = request(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/event-ics/${inviteData.short_code}`
  );

  const mailgun = new Mailgun(formData);
  const mg = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_API_KEY,
  });
  try {
    await mg.messages.create("mail.littleinvite.com", {
      from: "Little Invite <sam@mail.littleinvite.com>",
      to: [email],
      subject: `Invite to ${inviteData.title} has been RSVP'd!`,
      text: `You RSVP'd to an invite! Go check it out at https://littleinvite.com/e/${inviteData.short_code}`,
      attachment: {
        filename: "invite.ics",
        data: icsRes.data,
        contentType: "text/calendar",
      },
    });
  } catch (e) {
    helpers.logger.error(e);

    throw e;
  }
};
