// src/aws-exports.js
const awsconfig = {
  API: {
    GraphQL: {
      endpoint: import.meta.env.VITE_AWS_APPSYNC_URL,
      region: "us-east-1",
      defaultAuthMode: "apiKey",
      apiKey: import.meta.env.VITE_AWS_APPSYNC_KEY,
    },
  },
};

export default awsconfig;
