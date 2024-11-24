// src/aws-exports.js
const awsconfig = {
  API: {
    GraphQL: {
      endpoint:
        process.env.REACT_APP_AWS_APPSYNC_URL,
      region: "us-east-1",
      defaultAuthMode: "apiKey",
      apiKey: process.env.REACT_APP_AWS_APPSYNC_KEY,
    },
  },
};

export default awsconfig;
