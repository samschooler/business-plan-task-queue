const { createClient } = require("@supabase/supabase-js");

module.exports = async function async(payload, helpers) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
  );

  const { id } = payload;

  const { data, error } = await supabase
    .from("survey_results")
    .select("survey(profile!owner(profile_private!id(email)))")
    .eq("id", id);

  if (error) {
    throw error;
  }

  if (data && data.length > 0) {
    const email = data[0].survey.profile.profile_private.email;
    helpers.logger.info(
      `New survey result created with id ${id} notifying ${email}!`
    );
  }
};
