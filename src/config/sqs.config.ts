export default () => ({
  sqs: {
    region: process.env.AWS_REGION,

    consumers: [
      {
        name: 'audit-consumer',
        queueUrl: process.env.SQS_AUDIT_URL,
        region: process.env.AWS_REGION,
      },
    ],

    producers: [
      {
        name: 'audit-producer',
        queueUrl: process.env.SQS_AUDIT_URL,
        region: process.env.AWS_REGION,
      },
    ],
  },
});
