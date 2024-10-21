import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServerResources } from '../resources/ServerResources';
import { VPCResources } from '../resources/VpcResources';
import { envValidator } from '../resources/envValidator';
import { ACMResources } from '../resources/AcmResources';
import { ParameterStoreStack } from '../resources/ParameterStoreResources';
import { NextjsALBResources } from '../resources/NextjsALBResources';

export interface EC2Props extends StackProps {
  logLevel: string;
  sshPubKey: string;
  cpuType: string;
  instanceSize: string;
  vpc: VPCResources;
  acm: ACMResources;
}

export class NextJsAppStack extends Stack {
  public readonly albWeb: NextjsALBResources;

  constructor(scope: Construct, id: string, props: EC2Props) {
    super(scope, id, props);

    const { logLevel, sshPubKey, cpuType, instanceSize, vpc, acm } = props;

    // Validação das variáveis de ambiente
    envValidator(props);

    // Criação do servidor EC2
    const serverResources = new ServerResources(this, 'EC2-Web-App', {
      vpc: vpc.vpc,
      sshSecurityGroup: vpc.sshSecurityGroup,
      logLevel,
      sshPubKey,
      cpuType,
      instanceSize: instanceSize.toLowerCase(),
      language: 'nodejs',
    });

    // Criação do ALB para o Next.js
    this.albWeb = new NextjsALBResources(this, 'NextJsALBResources', {
      vpc: vpc.vpc,
      instance: serverResources.instance,
      certificate: acm.webAppCertificate,
    });

    // Parâmetro de saída: Comandos SSM e SSH
    new CfnOutput(this, 'ssmCommand', {
      value: `aws ssm start-session --target ${serverResources.instance.instanceId}`,
    });

    new CfnOutput(this, 'sshCommand', {
      value: `ssh ec2-user@${serverResources.instance.instancePublicDnsName}`,
    });
  }
}
