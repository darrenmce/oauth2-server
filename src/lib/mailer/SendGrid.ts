import { IOAuthMailer } from './index';
import { SendgridMailService } from '../util/sendgrid';

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

export class SendGrid implements IOAuthMailer {
  private readonly mailService: SendgridMailService;
  constructor(
    private readonly sendgridConfig: SendGridConfig
  ) {
    this.mailService = new SendgridMailService(sendgridConfig.apiKey);
  }

  protected createSendEmail<TTemplateData extends Record<string, string> = Record<string, string>>
    (emailConfig: EmailDataConfig): (address: string, templateData: TTemplateData) => Promise<void> {
    return async (address: string, templateData: TTemplateData) => {
      await this.mailService.send({
        from: emailConfig.from,
        dynamicTemplateData: templateData,
        to: address,
        templateId: emailConfig.templateId,
        content: undefined
      });
    }
  }

  public sendOneTimeSignIn = this.createSendEmail<Record<'url', string>>(this.sendgridConfig.emailConfig.oneTimeSignIn);
}
