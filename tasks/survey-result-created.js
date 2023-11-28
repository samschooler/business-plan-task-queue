const formData = require("form-data");
const Mailgun = require("mailgun.js");
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

    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({
      username: "api",
      key: process.env.MAILGUN_API_KEY,
    });
    await mg.messages.create(
      "sandbox4086e07217e54325b32803b5e115670c.mailgun.org",
      {
        from: "Little Invite <postmaster@sandbox4086e07217e54325b32803b5e115670c.mailgun.org>",
        to: [email],
        subject: `New RSVP to your invite!`,
        text: "Looks like someone RSVP'd to your invite! Go check it out at https://littleinvite.com/dashboard",
      }
    );
  }
};
