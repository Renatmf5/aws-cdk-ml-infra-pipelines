#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies */
import 'source-map-support/register';
import { App, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { config } from 'dotenv';
import { ServerResources, VPCResources } from '../lib';
import { envValidator } from '../lib/envValidator';
import { CICDStack } from '../lib/CodePipelineResources';
import { ParameterStoreStack } from '../lib/ParameterStoreResources';
import { S3BucketStack } from '../lib/S3DataLakeResources';
import { Route53Stack } from '../lib/Route53Resources';
import { ACMResources } from '../lib/AcmResources';
import { ALBResources } from '../lib/AlbResources';

config();

export interface EC2Props extends StackProps {
  logLevel: string;
  sshPubKey: string;
  cpuType: string;
  instanceSize: string;
}

export class FastApiApp extends Stack {
  constructor(scope: Construct, id: string, props: EC2Props) {
    super(scope, id, props);

    const { logLevel, sshPubKey, cpuType, instanceSize } = props;

    envValidator(props);

    // Create VPC and Security Group
    const vpcResources = new VPCResources(this, 'VPC');
    // Create ACM Certificate
    const acmResources = new ACMResources(this, 'ACM');

    const serverResources = new ServerResources(this, 'EC2', {
      vpc: vpcResources.vpc,
      sshSecurityGroup: vpcResources.sshSecurityGroup,
      logLevel: logLevel,
      sshPubKey: sshPubKey,
      cpuType: cpuType,
      instanceSize: instanceSize.toLowerCase(),
    });

    const albResources = new ALBResources(this, 'ALBResources', {
      vpc: vpcResources.vpc,
      instance: serverResources.instance,
      certificate: acmResources.certificate,
    });

    const route53Stack = new Route53Stack(this, 'Route53Stack', {
      loadBalancer: albResources.alb,
      env: props.env, // Adiciona o ambiente à stack do Route 53
    });


    // SSM Command to start a session
    new CfnOutput(this, 'ssmCommand', {
      value: `aws ssm start-session --target ${serverResources.instance.instanceId}`,
    });

    // SSH Command to connect to the EC2 Instance
    new CfnOutput(this, 'sshCommand', {
      value: `ssh ec2-user@${serverResources.instance.instancePublicDnsName}`,
    });

    new ParameterStoreStack(this, 'ParameterStack', {
      env: props.env,
    });
  }
}

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

const s3BucketApp = new S3BucketStack(app, 'S3BucketStack', {
  env: devEnv,
});

const ec2App = new FastApiApp(app, 'EC2App', {
  ...stackProps,
  env: devEnv,
});

const cicdStack = new CICDStack(app, 'CICDStack', {
  env: devEnv,
});

ec2App.addDependency(s3BucketApp);
// Adicione a dependência para garantir a ordem de criação
cicdStack.addDependency(ec2App);

app.synth();