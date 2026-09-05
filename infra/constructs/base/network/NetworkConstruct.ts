import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class NetworkConstruct extends Construct{
    readonly vpc: ec2.Vpc;
    readonly lambdaSecurityGroup: ec2.SecurityGroup;
    readonly dbSecurityGroup: ec2.SecurityGroup;

    constructor(scope:Construct, id:string){
        super(scope, id);

        const az = ["us-east-1a", "us-east-1b"];

        this.vpc = new ec2.Vpc(this,"NovaOmsVpc",{
            // maxAzs:2,
            natGateways:1,
            availabilityZones:az,
            subnetConfiguration:[
                {name: "public", subnetType:ec2.SubnetType.PUBLIC, cidrMask:24},
                {name:"private-egress", subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask:24},
                {name: "private-isolated", subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask:24}
            ]
        });

        this.lambdaSecurityGroup = new ec2.SecurityGroup(this,"LambdaSg",{
            vpc:this.vpc,
            description:"RDS/Aurora de NovaOMS",
            allowAllOutbound: true
        });

        this.dbSecurityGroup = new ec2.SecurityGroup(this,"DBSg",{
            vpc: this.vpc,
            description: "RDS/Aurora de NovaOMS",
            allowAllOutbound: false
        });

        this.dbSecurityGroup.addIngressRule(
            this.lambdaSecurityGroup,
            ec2.Port.tcp(5432),
            "Solo lambdas del stack pueden conectarse a la DB"
        );

    }
}