let totalSize = 0;

const calculateResponseSize = (req, res, next) => {
  const oldWrite = res.write;
  const oldEnd = res.end;
  const chunks = [];
  res.write = function (chunk) {
    chunks.push(chunk);
    oldWrite.apply(res, arguments);
  };
  res.end = function (chunk) {
    if (chunk) {
      chunks.push(chunk);
    }
    const responseBody = Buffer.concat(chunks).toString('utf8');
    totalSize += Buffer.byteLength(responseBody, 'utf8') / 1048576;
    console.log('Total outgoing response size:', totalSize.toFixed(5), 'MB');

    oldEnd.apply(res, arguments);
  };

  next();
};

export default calculateResponseSize;
