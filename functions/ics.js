const ics = require("ics");
const { convertTZ } = require("./dates");

exports.getICS = async (invite, icsDatum, canceled) => {
  const email = icsDatum.email;
  const rsvp = icsDatum.rsvp;
  const startTime = convertTZ(invite.start_time, invite.timezone);
  const modifiedTime = new Date(invite.updated_at);

  const event = {
    uid: `${invite.short_code}@littleinvite`,
    method: "REQUEST",
    lastModified: [
      modifiedTime.getFullYear(),
      modifiedTime.getMonth() + 1,
      modifiedTime.getDate(),
      modifiedTime.getHours(),
      modifiedTime.getMinutes(),
      modifiedTime.getSeconds(),
    ],
    start: [
      startTime.getFullYear(),
      startTime.getMonth() + 1,
      startTime.getDate(),
      startTime.getHours(),
      startTime.getMinutes(),
    ],
    startInputType: "utc",
    duration: { hours: 1, minutes: 0 },
    title: invite.title,
    description: `${invite.description} || More Info: https://littleinvite.com/e/${invite.short_code}`,
    location: invite.location_description,
    url: `https://littleinvite.com/e/${invite.short_code}`,
    status: canceled ? "CANCELLED" : "CONFIRMED",
    busyStatus: "BUSY",
    organizer: { name: "Little Invite", email: "sam@mail.littleinvite.com" },

    productId: "littleinvite/ics",
  };

  if (email) {
    event.attendees =
      rsvp === "yes"
        ? [
            {
              email,
              name: "You",
              rsvp: false,
              partstat: "ACCEPTED",
              role: "REQ-PARTICIPANT",
            },
          ]
        : rsvp === "maybe"
        ? [
            {
              email,
              name: "You",
              rsvp: false,
              partstat: "TENTATIVE",
              role: "REQ-PARTICIPANT",
            },
          ]
        : [
            {
              email,
              name: "You",
              rsvp: false,
              partstat: "DECLINED",
              role: "REQ-PARTICIPANT",
            },
          ];
  }

  return await new Promise((resolve, reject) => {
    ics.createEvent(event, (error, rvalue) => {
      if (error) {
        reject(error);
      }

      let value = rvalue;
      // On the line starting with DTSTART: and ending with "Z\n", remove the Z, and keep everything before it.
      value = value.replace(/DTSTART:.*Z/g, (match) => match.replace("Z", ""));
      value = value.replace(/DTEND:.*Z/g, (match) => match.replace("Z", ""));
      value = value.replace("DTSTART", `DTSTART;TZID=${invite.timezone}`);
      value = value.replace("DTEND", `DTEND;TZID=${invite.timezone}`);

      resolve(value);
    });
  });
};
