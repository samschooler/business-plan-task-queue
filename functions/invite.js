exports.getICSDataFromSurveyResults = (surveyResults) => {
  return surveyResults
    .map(exports.getICSDatumFromSurveyResult)
    .filter((res) => res.email && (res.rsvp === "yes" || res.rsvp === "maybe"));
};

exports.getICSDatumFromSurveyResult = (surveyResult) => ({
  email: exports.getEmailFromSurveyResult(surveyResult),
  rsvp: exports.getRSVPFromSurveyResult(surveyResult),
});

exports.getEmailFromSurveyResult = (surveyResult) => {
  const filledScreenKeys = Object.keys(surveyResult.results);
  const emailScreenId = filledScreenKeys.filter(
    (screenId) => surveyResult.survey.screens[screenId].type === "email"
  );
  return surveyResult.results[emailScreenId];
};

exports.getRSVPFromSurveyResult = (surveyResult) => {
  const filledScreenKeys = Object.keys(surveyResult.results);
  const rsvpScreenId = filledScreenKeys.filter(
    (screenId) => surveyResult.survey.screens[screenId].type === "rsvp"
  );
  return surveyResult.results[rsvpScreenId];
};
