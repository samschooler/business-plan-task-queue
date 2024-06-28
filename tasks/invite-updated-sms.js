const { createClient } = require("@supabase/supabase-js");

// send SMS, process.env.TWILIO_API_KEY
const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

module.exports = async function async(payload, helpers) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
  );

  const { inviteId, textDatum } = payload;

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

  try {
    const res = await client.messages.create({
      body: `Hey! ${inviteData.title} has been updated. Check it out at ${process.env.NEXT_PUBLIC_SITE_URL}/i/${inviteData.short_code}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: textDatum.phone,
    });

    if (res.errorCode) {
      helpers.logger.error(res);
      throw new Error(res.errorMessage);
    }

    helpers.logger.info(`SMS sent to ${textDatum.phone}`, res);
  } catch (e) {
    // how to handle this error?
    helpers.logger.error(e);

    // throw e;
  }
};
