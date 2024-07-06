let GET = 0,
  POST = 0,
  PATCH = 0,
  DELETE = 0;
const totalRequests = (req, res, next) => {
  switch (req.method.toString()) {
    case 'GET':
      GET += 1;
      break;
    case 'POST':
      POST += 1;
      break;
    case 'PATCH':
      PATCH += 1;
      break;
    case 'DELETE':
      DELETE += 1;
      break;
  }
  const allrequests = { GET, POST, PATCH, DELETE };
  req.allrequests = { allrequests };
  console.log(allrequests);
  next();
};

export default totalRequests;
