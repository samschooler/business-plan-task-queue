const { createClient } = require("@supabase/supabase-js");

const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const { formatDistanceToNow } = require("date-fns");

module.exports = async function async(payload, helpers) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
  );

  const { broadcastId, textDatum } = payload;

  helpers.logger.info(`requesting broadcast w id: ${broadcastId}`);
  const { data: broadcastData, error: broadcastError } = await supabase
    .from("broadcast")
    .select(
      "id,payload,type,invite(id, title, start_time, end_time, short_code, timezone, updated_at, canceled_at)"
    )
    .eq("id", broadcastId)
    .single();

  helpers.logger.info(broadcastData);

  if (broadcastError) {
    helpers.logger.error(
      `Error on supabase broadcast request ${JSON.stringify(broadcastError)}`
    );
    throw broadcastError;
  }

  if (!broadcastData) {
    helpers.logger.error(`No broadcast found with id ${broadcastId}`);
    return;
  }

  let preppedBody = broadcastData.payload.body;
  // check if has template strings
  if (preppedBody && preppedBody.includes("{{")) {
    const inviteData = broadcastData.invite;

    helpers.logger.info(inviteData);

    preppedBody = preppedBody
      .replaceAll(
        "{{link}}",
        `${process.env.NEXT_PUBLIC_APP_SHORT_URL}/${inviteData.short_code}?i=${textDatum.rsvpShortCode}`
      )
      .replaceAll("{{title}}", inviteData.title)
      .replaceAll("{{description}}", inviteData.description)
      .replaceAll("{{location}}", inviteData.location_description)
      .replaceAll(
        "{{start}}",
        new Date(inviteData.start_time).toLocaleString(
          "en-US",
          {
            timeZone: inviteData.timezone,
            timeZoneName: "short",
          },
          {
            timeZone: inviteData.timezone,
          }
        )
      )
      .replaceAll(
        "{{end}}",
        new Date(inviteData.end_time).toLocaleString(
          "en-US",
          {
            timeZone: inviteData.timezone,
            timeZoneName: "short",
          },
          {
            timeZone: inviteData.timezone,
          }
        )
      )
      // replace with just the time
      .replaceAll(
        "{{start_time}}",
        new Date(inviteData.start_time).toLocaleTimeString("en-US", {
          timeZone: inviteData.timezone,
          timeZoneName: "short",
        })
      )
      .replaceAll(
        "{{end_time}}",
        new Date(inviteData.end_time).toLocaleTimeString("en-US", {
          timeZone: inviteData.timezone,
          timeZoneName: "short",
        })
      )
      .replaceAll(
        "{{relative_start}}",
        formatDistanceToNow(inviteData.start_time, {
          addSuffix: true,
          includeSeconds: false,
        })
      );
  }

  helpers.logger.info(`preppedBody: ${preppedBody}`);
  helpers.logger.info(`body: ${broadcastData.payload.body}`);

  try {
    const res = await client.messages.create({
      body: preppedBody,
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

    throw e;
  }
};
