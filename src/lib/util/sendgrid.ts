import sgMail from '@sendgrid/mail';

export class SendgridMailService extends sgMail.MailService {
  constructor(apiKey: string) {
    super();
    this.setApiKey(apiKey);
  }
}
