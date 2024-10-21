#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { config } from 'dotenv';
import { FastApiAppStack } from '../lib/stacks/FastApiAppStack';
import { NextJsAppStack } from '../lib/stacks/NextJsAppStack';
import { Route53Stack } from '../lib/stacks/Route53Stack';
import { S3BucketResources } from '../lib/resources/S3BucketResources';
import { CICDFastApiStack } from '../lib/resources/CodePipelineFastApiResources';
import { CICDNextJsStack } from '../lib/resources/CodePipelineNextJsResources';

config();

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

const stackProps = {
  logLevel: process.env.LOG_LEVEL || 'INFO',
  sshPubKey: process.env.SSH_PUB_KEY || ' ',
  cpuType: process.env.CPU_TYPE || 'X86_64',
  instanceSize: process.env.INSTANCE_SIZE || 'MICRO',
};

const app = new App();

// S3 Bucket Stack
const s3BucketApp = new S3BucketResources(app, 'S3BucketStack', {
  env: devEnv,
});

// FastAPI Application Stack (VPC, EC2, ALB)
const fastapiApp = new FastApiAppStack(app, 'FastApiAppStack', {
  ...stackProps,
  env: devEnv,
});

// NextJs Application Stack (VPC, EC2, ALB)
const NextJsApp = new NextJsAppStack(app, 'NextJsAppStack', {
  ...stackProps,
  vpc: fastapiApp.vpc,
  acm: fastapiApp.acm,
  env: devEnv,
});

// Route53 Stack (Domínio e DNS)
const route53Stack = new Route53Stack(app, 'Route53Stack', {
  fastApiLoadBalancer: fastapiApp.albApi.alb,
  NextJsLoadBalancer: NextJsApp.albWeb.alb,
  env: devEnv,
});

// CI/CD para FastAPI
const cicdFastApiStack = new CICDFastApiStack(app, 'CICDFastApiStack', {
  env: devEnv,
});

// CI/CD para Next.js
const cicdNextJsStack = new CICDNextJsStack(app, 'CICDNextJsStack', {
  env: devEnv,
});


// Dependências entre stacks
//route53Stack.addDependency(ebStack);  // Garantindo que o Route53 dependa do NextJs estar pronto
fastapiApp.addDependency(s3BucketApp);  // Garantindo que o FastAPI dependa do S3 estar pronto
NextJsApp.addDependency(fastapiApp);  // Garantindo que o Next.js dependa do FastAPI estar pronto
route53Stack.addDependency(NextJsApp);  // Garantindo que o Route53 dependa do Next.js estar pronto
cicdFastApiStack.addDependency(fastapiApp);  // Garantindo que o CI/CD dependa do FastAPI estar pronto
cicdNextJsStack.addDependency(NextJsApp);  // Garantindo que o CI/CD dependa do Next.js estar pronto


app.synth();
