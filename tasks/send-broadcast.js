const { createClient } = require("@supabase/supabase-js");
const { getTextDatumFromSurveyResult } = require("../functions/invite");

module.exports = async function async(payload, helpers) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
  );

  // grab the broadcast id from the payload
  const { id: broadcastId } = payload;
  helpers.logger.info(`requesting broadcast w id: ${broadcastId}`);
  const { data: broadcastData, error: broadcastError } = await supabase
    .from("broadcast")
    .select(
      "id,payload,type,invite(id, short_code, survey, timezone, updated_at, canceled_at)"
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

  const { payload: broadcastPayload, type, invite } = broadcastData;

  if (!invite) {
    helpers.logger.error(`No invite found on broadcast ${broadcastId}`);
    return;
  }

  helpers.logger.info(
    `requesting survey_results w survey id: ${invite.survey}`
  );
  // get survey results
  const { data: surveyResults, error: surveyResultsError } = await supabase
    .from("survey_results")
    .select("survey(id,screens),results,complete,short_code")
    .eq("survey", invite.survey)
    .filter("complete", "eq", true);

  if (surveyResultsError) {
    helpers.logger.error(
      `Error on supabase survey_results request ${JSON.stringify(
        surveyResultsError
      )}`
    );
    throw surveyResultsError;
  }

  if (type === "sms") {
    const textData = surveyResults
      .map(getTextDatumFromSurveyResult)
      .filter((d) => d.phone);

    helpers.logger.info(`textData: ${JSON.stringify(textData)}`);
    for (const textDatum of textData) {
      await helpers.addJob(
        `send-sms`,
        {
          broadcastId,
          textDatum,
        },
        {
          queueName: "send-sms",
        }
      );
      helpers.logger.info({
        name: `send-sms-${broadcastId}-${textDatum.rsvpShortCode}`,
        body: {
          payload: broadcastPayload,
          textDatum,
        },
        queue: {
          jobKey: `send-sms-${broadcastId}-${textDatum.rsvpShortCode}`,
        },
      });
    }
  } else {
    helpers.logger.error(`Unknown broadcast type ${type}`);
    return;
  }
};
