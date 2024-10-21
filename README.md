# Infraestrutura de Deploy na AWS com CDK

Este repositório contém a definição e o deploy de infraestrutura utilizando o **AWS Cloud Development Kit (CDK)**. O projeto configura recursos da AWS como EC2, Load Balancer, VPC, Route53 e outros, de maneira escalável e automatizada.

## Descrição

Este projeto utiliza o AWS CDK para provisionar e gerenciar recursos de infraestrutura na Amazon Web Services (AWS). Ele foi projetado para automatizar a criação de ambientes de produção e desenvolvimento com segurança e eficiência.

A infraestrutura inclui:
- **EC2**: Instâncias de máquinas virtuais para rodar aplicações.
- **VPC**: Rede privada para isolar a infraestrutura.
- **Application Load Balancer (ALB)**: Balanceamento de carga para distribuir o tráfego.
- **Route53**: Configuração de DNS para gerenciamento de domínios.
- **Certification manager**: Configuração de DNS para gerenciamento de domínios.

## Arquitetura

A arquitetura proposta é composta pelos seguintes componentes:

- **VPC**: Uma rede privada virtual isolada para garantir a segurança.
- **Sub-redes públicas e privadas**: As instâncias EC2 serão distribuídas nessas sub-redes.
- **ALB (Application Load Balancer)**: Para balanceamento de carga e garantir alta disponibilidade.
- **EC2 Instances**: Para hospedar a aplicação backend.
- **Route53**: Para gerenciamento de DNS e configurar os domínios da aplicação.
  
## Pré-requisitos

- **Node.js** versão 14.x ou superior
- **AWS CLI** configurado com as credenciais apropriadas
- **AWS CDK** instalado globalmente:  
  ```bash
  npm install -g aws-cdk

## Instalação

1. Clone o repositório:
-  git clone https://github.com/Renatmf5/aws-cdk-ml-infra-pipelines.git
-  cd aws-cdk-ml-infra-pipelines

2. Instale as dependências:
- npm install

## Estrutura do Projeto

```plaintext
aws-cdk-ml-infra-pipelines/
├── README.md
├── bin/
│   └── aws-cdk-InfraPipelinesStack.ts
├── lib/
│   ├── resources/
│   │   ├── AcmResources.ts
│   │   ├── CodePipelineFastApiResources.ts
│   │   ├── CodePipelineNextJsResources.ts
│   │   ├── envValidator.ts
│   │   ├── FastApiALBResources.ts
│   │   ├── NextjsALBResources.ts
│   │   ├── ParameterStoreResources.ts
│   │   ├── S3BucketResources.ts
│   │   ├── ServerResources.ts
│   │   └── VpcResources.ts
│   ├── stacks/
│   │   ├── FastApiAppStack.ts
│   │   ├── NextJsAppStack.ts
│   │   └── Route53Stack.ts
├── node_modules/
├── package-lock.json
├── package.json
├── src/
│   └── resources/
│       └── server/
│           ├── assets/
│           └── config/
├── test/
│   └── aws-cdk-ml-infra-pipelines.test.ts
└── tsconfig.json