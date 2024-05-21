const { Readable } = require("stream");

exports.makeStream = async (data) => {
  const stream = new Readable();
  stream.push(data);
  stream.push(null);
  return stream;
};
