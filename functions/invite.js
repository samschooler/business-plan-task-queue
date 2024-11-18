exports.getICSDataFromSurveyResults = (surveyResults) => {
  return surveyResults
    .map(exports.getICSDatumFromSurveyResult)
    .filter((res) => res.email && (res.rsvp === "yes" || res.rsvp === "maybe"));
};

exports.getTextDataFromSurveyResults = (surveyResults) => {
  return surveyResults
    .map(exports.getTextDatumFromSurveyResult)
    .filter((res) => res.phone && (res.rsvp === "yes" || res.rsvp === "maybe"));
};

exports.getICSDatumFromSurveyResult = (surveyResult) => ({
  email: exports.getEmailFromSurveyResult(surveyResult),
  rsvp: exports.getRSVPFromSurveyResult(surveyResult),
  rsvpShortCode: surveyResult.short_code,
});

exports.getTextDatumFromSurveyResult = (surveyResult) => ({
  rsvp: exports.getRSVPFromSurveyResult(surveyResult),
  phone: exports.getPhoneFromSurveyResult(surveyResult),
  rsvpShortCode: surveyResult.short_code,
});

exports.getEmailFromSurveyResult = (surveyResult) => {
  const filledScreenKeys = Object.keys(surveyResult.results);
  const emailScreenId = filledScreenKeys.filter(
    (screenId) => surveyResult.survey.screens[screenId].type === "email"
  );
  return surveyResult.results[emailScreenId];
};

exports.getPhoneFromSurveyResult = (surveyResult) => {
  const filledScreenKeys = Object.keys(surveyResult.results);
  const phoneScreenId = filledScreenKeys.filter(
    (screenId) =>
      surveyResult.survey.screens[screenId].type === "phone" &&
      surveyResult.survey.screens[screenId].verify === true
  );
  return surveyResult.results[phoneScreenId];
};

exports.getRSVPFromSurveyResult = (surveyResult) => {
  const filledScreenKeys = Object.keys(surveyResult.results);
  const rsvpScreenId = filledScreenKeys.filter(
    (screenId) => surveyResult.survey.screens[screenId].type === "rsvp"
  );
  return surveyResult.results[rsvpScreenId];
};
