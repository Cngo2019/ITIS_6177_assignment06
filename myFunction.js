export const handler = async (event) => {
  // Get query parameter 'keyword'
  const keyword = event.queryStringParameters && event.queryStringParameters.keyword;
  
  return {
      statusCode: 200,
      body: JSON.stringify({ message: "Hello " + keyword}),
  };
};

