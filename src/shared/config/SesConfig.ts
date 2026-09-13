

export class SesConfig {

  readonly sesEmailAddress: string;

  constructor() {
    // Storage
    this.sesEmailAddress = process.env.SES_EMAIL_ADDRESS!;
  }
}
