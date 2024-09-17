import { Stack, StackProps, CfnOutput, aws_ssm as ssm } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as redshift from 'aws-cdk-lib/aws-redshift';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dotenv from 'dotenv';

dotenv.config();

export class RedshiftStack extends Stack {
  public readonly clusterEndpoint: string;
  public readonly clusterName: string;
  public readonly redshiftRoleArn: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Carregar variáveis de ambiente
    const masterUsername = process.env.MASTERUSERNAME_REDSHIFT!;
    const masterUserPassword = process.env.MASTERPASSWORD_REDSHIFT!;
    const dbName = process.env.DATABASENAME_REDSHIFT!;
    const nodeType = process.env.NODETYPE_REDSHIFT!;
    const clusterType = process.env.NUMBEROFNODES_REDSHIFT === 'multi-node' ? 'multi-node' : 'single-node';

    // Criar uma VPC para o Redshift com sub-redes públicas
    const vpc = new ec2.Vpc(this, 'RedshiftVPC', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
          mapPublicIpOnLaunch: true,
        },
      ],
    });

    // Criar um Security Group para o Redshift
    const securityGroup = new ec2.SecurityGroup(this, 'RedshiftSG', {
      vpc,
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(5439), 'Allow Redshift access');

    // Criar um Role IAM para o Redshift
    const redshiftRole = new iam.Role(this, 'RedshiftRole', {
      assumedBy: new iam.ServicePrincipal('redshift.amazonaws.com'),
    });
    redshiftRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'));

    // Criar o Cluster Redshift
    const cluster = new redshift.CfnCluster(this, 'RedshiftCluster', {
      masterUsername: masterUsername,
      masterUserPassword: masterUserPassword,
      nodeType: nodeType,
      clusterType: clusterType,
      dbName: dbName,
      iamRoles: [redshiftRole.roleArn],
      vpcSecurityGroupIds: [securityGroup.securityGroupId],
      clusterSubnetGroupName: new redshift.CfnClusterSubnetGroup(this, 'RedshiftSubnetGroup', {
        description: 'Subnet group for Redshift cluster',
        subnetIds: vpc.publicSubnets.map(subnet => subnet.subnetId),
      }).ref,
    });

    this.clusterEndpoint = cluster.attrEndpointAddress;
    this.clusterName = cluster.ref;
    this.redshiftRoleArn = redshiftRole.roleArn;

    new CfnOutput(this, 'RedshiftClusterEndpointOutput', {
      value: this.clusterEndpoint,
    });

    new CfnOutput(this, 'RedshiftClusterNameOutput', {
      value: this.clusterName,
    });

    new CfnOutput(this, 'RedshiftRoleArnOutput', {
      value: this.redshiftRoleArn,
    });

    // Criar parâmetros no SSM Parameter Store
    new ssm.StringParameter(this, 'RedshiftClusterEndpointParam', {
      parameterName: '/techchallenge_fase1/redshift/cluster-endpoint',
      stringValue: this.clusterEndpoint,
    });

    new ssm.StringParameter(this, 'RedshiftDatabaseParam', {
      parameterName: '/techchallenge_fase1/redshift/database',
      stringValue: dbName,
    });

    new ssm.StringParameter(this, 'RedshiftUserParam', {
      parameterName: '/techchallenge_fase1/redshift/user',
      stringValue: masterUsername,
    });

    new ssm.StringParameter(this, 'RedshiftPasswordParam', {
      parameterName: '/techchallenge_fase1/redshift/password',
      stringValue: masterUserPassword,
    });

    new ssm.StringParameter(this, 'RedshiftPortParam', {
      parameterName: '/techchallenge_fase1/redshift/port',
      stringValue: process.env.PORT_REDSHIFT!,
    });

    new ssm.StringParameter(this, 'RedshiftRoleParam', {
      parameterName: '/techchallenge_fase1/redshift/role',
      stringValue: this.redshiftRoleArn,
    });
  }
}