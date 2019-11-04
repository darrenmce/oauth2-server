import sgMail from '@sendgrid/mail'
import { IOAuthMailer } from './index';

export type EmailDataConfig = {
  templateId: string,
  from: {
    email: string,
    name: string
  }
}

export type SendGridConfig = {
  type: 'sendgrid'
  apiKey: string,
  emailConfig: {
    oneTimeSignIn: EmailDataConfig
  }
};

export type SendGridMailService = {
  new(): typeof sgMail.MailService
}
// thanks sendgrid for not typing your stuff right
const MailService = sgMail.MailService as any as SendGridMailService;

export class SendGrid implements IOAuthMailer {
  private readonly mailService: typeof sgMail.MailService;
  constructor(
    private readonly sendgridConfig: SendGridConfig
  ) {
    this.mailService = new MailService();
    this.mailService.setApiKey(sendgridConfig.apiKey);
  }

  protected createSendEmail<TTemplateData extends Record<string, string> = Record<string, string>>
    (emailConfig: EmailDataConfig): (address: string, templateData: TTemplateData) => Promise<void> {
    return async (address: string, templateData: TTemplateData) => {
      await this.mailService.send({
        from: emailConfig.from,
        dynamicTemplateData: templateData,
        to: address,
        templateId: emailConfig.templateId
      });
    }
  }

  public sendOneTimeSignIn = this.createSendEmail<Record<'url', string>>(this.sendgridConfig.emailConfig.oneTimeSignIn);
}
