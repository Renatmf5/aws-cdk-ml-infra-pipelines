import { Construct } from 'constructs';
import { Vpc, Instance, SecurityGroup, Peer, Port } from 'aws-cdk-lib/aws-ec2';
import { ApplicationLoadBalancer, ApplicationProtocol, ApplicationTargetGroup, ListenerAction, TargetType } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { InstanceTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';

interface ALBProps {
  vpc: Vpc;
  instance: Instance;
  certificate: Certificate;
}

export class ALBResources extends Construct {
  public readonly alb: ApplicationLoadBalancer;  // Expondo o ALB publicamente

  constructor(scope: Construct, id: string, props: ALBProps) {
    super(scope, id);

    const albSecurityGroup = new SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: props.vpc,
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80), 'Allow HTTP traffic');
    albSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(443), 'Allow HTTPS traffic');

    this.alb = new ApplicationLoadBalancer(this, 'ALB', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
    });

    const targetGroup = new ApplicationTargetGroup(this, 'TargetGroup', {
      vpc: props.vpc,
      protocol: ApplicationProtocol.HTTP,
      port: 80,
      targetType: TargetType.INSTANCE,
    });

    targetGroup.addTarget(new InstanceTarget(props.instance));

    const listener = this.alb.addListener('Listener', {
      port: 443,
      certificates: [props.certificate],
      defaultAction: ListenerAction.forward([targetGroup]),
    });

    // Adicionar um listener HTTP para redirecionar para HTTPS
    this.alb.addListener('HTTPListener', {
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      defaultAction: ListenerAction.redirect({
        protocol: ApplicationProtocol.HTTPS,
        port: '443',
        permanent: true,
      }),
    });
  }
}
