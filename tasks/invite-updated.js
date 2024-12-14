const { createClient } = require("@supabase/supabase-js");
const { getICSDataFromSurveyResults } = require("../functions/invite");

module.exports = async function async(payload, helpers) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
  );

  // this is the id of the invite itself
  const { id } = payload;
  const { data: inviteData, error: inviteError } = await supabase
    .from("invite")
    .select("id,title,short_code,survey(id,screens),canceled_at")
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

  const icsData = getICSDataFromSurveyResults(data);

  helpers.logger.info(
    `Invite updated with id ${id} notifying ${icsData.length} ppl!`
  );

  for (const icsDatum of icsData) {
    await helpers.addJob(
      `invite-updated-email`,
      {
        inviteId: id,
        icsDatum,
      },
      {
        jobKey: `invite-updated-email-${id}-${icsDatum.rsvpShortCode}`,
      }
    );
  }
};
