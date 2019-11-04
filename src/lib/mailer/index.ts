export interface IOAuthMailer {
  sendOneTimeSignIn(email: string, templateData: Record<'url', string>): Promise<void>
}
