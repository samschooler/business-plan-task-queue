exports.convertTZ = (dateStr, tzString) => {
  return new Date(
    new Date(dateStr).toLocaleString("en-US", {
      timeZone: tzString,
    })
  );
};
