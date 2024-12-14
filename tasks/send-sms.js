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

  const {
    broadcast: { payload: broadcastPayload, invite: inviteShortCode },
    textDatum,
  } = payload;

  let preppedBody = broadcastPayload.body;
  // check if has template strings
  if (preppedBody && preppedBody.includes("{{")) {
    const { data: inviteDataArr, error: inviteError } = await supabase
      .from("invite")
      .select(
        "id, short_code, title, description, start_time, end_time, location_description, timezone, updated_at, canceled_at"
      )
      .eq("short_code", inviteShortCode);

    if (inviteError) {
      helpers.logger.error(
        `Error on supabase invite request ${JSON.stringify(inviteError)}`
      );
      throw inviteError;
    }

    if (!inviteDataArr.length === 0) {
      helpers.logger.error(`No invite found with id ${inviteShortCode}`);
      return;
    }

    const inviteData = inviteDataArr[0];

    helpers.logger.info(
      JSON.stringify(inviteData),
      new Date(inviteData.start_time)
    );

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
        inviteData.start_time
          ? new Date(inviteData.start_time).toLocaleString(
              "en-US",
              {
                timeZone: inviteData.timezone,
                timeZoneName: "short",
              },
              {
                timeZone: inviteData.timezone,
              }
            )
          : "<no start time>"
      )
      .replaceAll(
        "{{end}}",
        inviteData.end_time
          ? new Date(inviteData.end_time).toLocaleString(
              "en-US",
              {
                timeZone: inviteData.timezone,
                timeZoneName: "short",
              },
              {
                timeZone: inviteData.timezone,
              }
            )
          : "<no end time>"
      )
      // replace with just the time
      .replaceAll(
        "{{start_time}}",
        inviteData.start_time
          ? new Date(inviteData.start_time).toLocaleTimeString("en-US", {
              timeZone: inviteData.timezone,
              timeZoneName: "short",
            })
          : "<no start time>"
      )
      .replaceAll(
        "{{end_time}}",
        inviteData.end_time
          ? new Date(inviteData.end_time).toLocaleTimeString("en-US", {
              timeZone: inviteData.timezone,
              timeZoneName: "short",
            })
          : "<no end time>"
      )
      .replaceAll(
        "{{relative_start}}",
        inviteData.start_time
          ? formatDistanceToNow(new Date(inviteData.start_time), {
              addSuffix: true,
              includeSeconds: false,
            })
          : "<no start time>"
      );
  }

  helpers.logger.info(`preppedBody: ${preppedBody}`);
  helpers.logger.info(`body: ${broadcastPayload.body}`);

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
