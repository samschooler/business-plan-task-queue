const formData = require("form-data");
const Mailgun = require("mailgun.js");
const { createClient } = require("@supabase/supabase-js");
const { getICS } = require("../functions/ics");
const { makeStream } = require("../functions/stream");
const { getICSDatumFromSurveyResult } = require("../functions/invite");

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
    .select(
      "id, short_code, title, description, start_time, end_time, location_description, timezone, updated_at"
    )
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

  const icsDatum = getICSDatumFromSurveyResult(data);

  if (!icsDatum.email) {
    helpers.logger.info(`No email found in survey results with id ${id}`);
    return;
  }

  helpers.logger.info(
    `New survey result created with id ${id} notifying ${icsDatum.email}!`
  );

  try {
    helpers.logger.info(
      `requesting invite w data: ${JSON.stringify(inviteData)}`
    );

    helpers.logger.info(
      `requesting invite w datum: ${JSON.stringify(icsDatum)}`
    );
    const inviteFile = await getICS(inviteData, icsDatum);
    helpers.logger.info(`inviteFile: ${inviteFile}`);
    const inviteStream = await makeStream(inviteFile);

    helpers.logger.info(
      `Sending email to ${icsDatum.email} with rsvp ${icsDatum.rsvp}`
    );

    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({
      username: "api",
      key: process.env.MAILGUN_API_KEY,
    });

    const res = await mg.messages.create("mail.littleinvite.com", {
      from: "Little Invite <sam@mail.littleinvite.com>",
      to: [icsDatum.email],
      subject:
        icsDatum.rsvp === "yes"
          ? `Invite to ${inviteData.title} has been RSVP'd!`
          : icsDatum.rsvp === "maybe"
          ? `INVITATION: Invite to ${inviteData.title}`
          : `DECLINED: Invite to ${inviteData.title}`,
      text: `You RSVP'd to an invite! Go check it out at https://littleinvite.com/e/${inviteData.short_code}`,
      attachment: {
        data: inviteStream,
        filename: "invite.ics",
        contentType: "application/ics",
      },
    });

    helpers.logger.info(`Email sent to ${icsDatum.email}`, res);
  } catch (e) {
    // how to handle this error?
    helpers.logger.error(JSON.stringify(e));

    throw e;
  }
};
