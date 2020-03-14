import { IOAuthMailer } from '../lib/mailer';
import { SendGrid } from '../lib/mailer/SendGrid';
import { ServicesConfig } from '../config/types';
import Logger from 'bunyan';

export type Services = {
  mailer: IOAuthMailer
}

export function createServices(log: Logger, serviceConfig: ServicesConfig): Services {
  log.info('initializing services...');
  return {
    mailer: new SendGrid(serviceConfig.mailer)
  }
}
