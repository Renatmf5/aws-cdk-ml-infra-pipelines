#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies */
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { config } from 'dotenv';
import { S3BucketStack } from '../lib/s3-data-lake-stack';
import { RedshiftStack } from '../lib/redshift-stack';

config();

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1',
};

const app = new App();

const redshiftApp = new RedshiftStack(app, 'RedshiftStack', {
  env: devEnv,
});

const s3BucketApp = new S3BucketStack(app, 'S3BucketStack', {
  env: devEnv,
});

// Adicionar dependência explícita
s3BucketApp.addDependency(redshiftApp);

app.synth();