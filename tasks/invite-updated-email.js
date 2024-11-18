const formData = require("form-data");
const Mailgun = require("mailgun.js");
const { createClient } = require("@supabase/supabase-js");
const { getICS } = require("../functions/ics");
const { makeStream } = require("../functions/stream");

module.exports = async function async(payload, helpers) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
  );

  const { inviteId, icsDatum } = payload;

  helpers.logger.info(`requesting invite w id: ${inviteId}`);
  const { data: inviteData, error: inviteError } = await supabase
    .from("invite")
    .select(
      "id, short_code, title, description, start_time, end_time, location_description, survey(*), timezone, updated_at, canceled_at"
    )
    .eq("id", inviteId)
    .single();

  if (inviteError) {
    helpers.logger.error(
      `Error on supabase invite request ${JSON.stringify(inviteError)}`
    );
    throw inviteError;
  }

  if (!inviteData) {
    helpers.logger.error(`No invite found with id ${id}`);
    return;
  }

  const inviteFile = await getICS(
    inviteData,
    icsDatum,
    !!inviteData.canceled_at
  );
  const inviteStream = await makeStream(inviteFile);

  const mailgun = new Mailgun(formData);
  const mg = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_API_KEY,
  });

  try {
    const res = await mg.messages.create("mail.littleinvite.com", {
      from: "Little Invite <scheduler@mail.littleinvite.com>",
      to: [icsDatum.email],
      subject: inviteData.canceled_at
        ? `CANCELLED: ${inviteData.title}`
        : `UPDATE: ${inviteData.title}`,
      text: inviteData.canceled_at
        ? `This invite has been cancelled.`
        : `There has been a change on this invite. See change and change your RSVP here: ${process.env.NEXT_PUBLIC_APP_SHORT_URL}/${inviteData.short_code}?i=${icsDatum.rsvpShortCode}`,
      attachment: {
        data: inviteStream,
        filename: "invite.ics",
        contentType: "application/ics",
      },
    });

    helpers.logger.info(`Email sent to ${icsDatum.email}`, res);
  } catch (e) {
    // how to handle this error?
    helpers.logger.error(e);

    // throw e;
  }
};
