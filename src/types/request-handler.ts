import { Router } from 'express';

export interface IRequestHandler {
  getRouter(): Router
}
