import { Construct } from 'constructs';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

export class ACMResources extends Construct {
  public certificate: Certificate;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: process.env.DOMINIO || 'default_domain',
    });

    this.certificate = new Certificate(this, 'Certificate', {
      domainName: process.env.SUBDOMINIO || 'default_subdomain',
      validation: CertificateValidation.fromDns(hostedZone), // Validação por DNS
    });
  }
}