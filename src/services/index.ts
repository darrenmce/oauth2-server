import { IOAuthMailer } from '../lib/mailer';
import { SendGrid } from '../lib/mailer/SendGrid';
import { ServicesConfig } from '../config/types';

export type Services = {
  mailer: IOAuthMailer
}

export function createServices(serviceConfig: ServicesConfig): Services {
  return {
    mailer: new SendGrid(serviceConfig.mailer)
  }
}
