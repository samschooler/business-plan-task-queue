module.exports = function async(payload, helpers) {
  // send the email with mailgun
  const { email, subject, message } = payload;
  // const data = {
  //   from: "Sam at Little Invite <sam@littleinvite.com>",
  //   to: email,
  //   subject,
  //   text: message,
  // };

  helpers.logger.info(
    `Sending email to ${email} with subject ${subject} + message ${message}`
  );
  // return mailgun.messages().send(data);
};
