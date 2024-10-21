import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServerResources } from '../resources/ServerResources';
import { VPCResources } from '../resources/VpcResources';
import { envValidator } from '../resources/envValidator';
import { ACMResources } from '../resources/AcmResources';
import { FastApiALBResources } from '../resources/FastApiALBResources';
import { ParameterStoreStack } from '../resources/ParameterStoreResources';

export interface EC2Props extends StackProps {
  logLevel: string;
  sshPubKey: string;
  cpuType: string;
  instanceSize: string;
}

export class FastApiAppStack extends Stack {
  public readonly albApi: FastApiALBResources;
  public readonly vpc: VPCResources;
  public readonly acm: ACMResources;

  constructor(scope: Construct, id: string, props: EC2Props) {
    super(scope, id, props);

    const { logLevel, sshPubKey, cpuType, instanceSize } = props;

    // Validação das variáveis de ambiente
    envValidator(props);

    // Criação da VPC e Security Groups
    this.vpc = new VPCResources(this, 'VPC');

    // Criação do certificado ACM para o ALB
    this.acm = new ACMResources(this, 'ACM');

    // Criação do servidor EC2
    const serverResources = new ServerResources(this, 'EC2-Api-App', {
      vpc: this.vpc.vpc,
      sshSecurityGroup: this.vpc.sshSecurityGroup,
      logLevel,
      sshPubKey,
      cpuType,
      instanceSize: instanceSize.toLowerCase(),
      language: 'python',
    });

    // Criação do ALB para o FastAPI
    this.albApi = new FastApiALBResources(this, 'ALBResources', {
      vpc: this.vpc.vpc,
      instance: serverResources.instance,
      certificate: this.acm.apiCertificate,
    });

    // Parâmetro de saída: Comandos SSM e SSH
    new CfnOutput(this, 'ssmCommand', {
      value: `aws ssm start-session --target ${serverResources.instance.instanceId}`,
    });

    new CfnOutput(this, 'sshCommand', {
      value: `ssh ec2-user@${serverResources.instance.instancePublicDnsName}`,
    });

    // Armazenamento de parâmetros no Parameter Store
    new ParameterStoreStack(this, 'ParameterStack', {
      env: props.env,
    });
  }
}
