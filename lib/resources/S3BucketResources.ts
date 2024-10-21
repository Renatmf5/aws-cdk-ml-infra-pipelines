import {
  Stack, Duration, RemovalPolicy, StackProps,
  CfnOutput, Aws, aws_iam as iam, aws_s3 as s3
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { config } from 'dotenv';

config();


export class S3BucketResources extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const bucketName = process.env.BUCKETNAME_S3;

    // Criando um bucket S3 com finalidade de Data Lake para armazenar os dados extraídos de APIs, tambem tera 2 folders (Bronze e Silver)
    const bucket = new s3.Bucket(this, 'DataLakeBucket', {
      versioned: false,
      bucketName: bucketName,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Adiciona as pastas Bronze e Silver
    bucket.addLifecycleRule({
      prefix: 'Lake/',
      enabled: true,
      expiration: Duration.days(365), // Expiração em 365 dias
    });

    // Permissões para upload de arquivos
    const bucketPolicy = new iam.PolicyStatement({
      actions: ['s3:PutObject'],
      resources: [`${bucket.bucketArn}/Lake/*`],
      principals: [new iam.AccountPrincipal(Aws.ACCOUNT_ID)],
    });

    bucket.addToResourcePolicy(bucketPolicy);

    new CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
    });
  }
}