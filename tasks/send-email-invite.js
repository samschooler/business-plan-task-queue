const formData = require("form-data");
const Mailgun = require("mailgun.js");
const { createClient } = require("@supabase/supabase-js");

module.exports = async function async(payload, helpers) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
  );

  const { id } = payload;

  const { data: inviteData, error: inviteError } = await supabase
    .from("invite")
    .select("title,short_code")
    .eq("survey", id)
    .single();

  if (inviteError) {
    throw inviteError;
  }

  const { data, error } = await supabase
    .from("survey_results")
    .select("survey(screens),results")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  if (data) {
    const filledScreenKeys = Object.keys(data.results);
    const emailScreenId = filledScreenKeys.filter(
      (screenId) => data.survey.screens[screenId].type === "email"
    );
    const email = data.results[emailScreenId];

    if (!email) {
      return;
    }

    helpers.logger.info(
      `New survey result created with id ${id} notifying ${email}!`
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
      });
    } catch (e) {
      helpers.logger.error(e);

      throw e;
    }
  }
};
