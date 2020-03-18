import sinon from 'sinon';
import { asyncWrapHandler } from './async-wrap-handler';

describe('async-wrap-handler', () => {
  let nextSpy;
  beforeEach(() => {
    nextSpy = sinon.spy();
  });
  it('should call the handler that resolves with the 3 params', async () => {
    const handler = sinon.stub().resolves(true);
    await asyncWrapHandler(handler)('req' as any, 'res' as any, nextSpy);

    sinon.assert.calledOnce(handler);
    sinon.assert.calledWithExactly(handler, 'req', 'res', nextSpy);
    sinon.assert.notCalled(nextSpy);
  });

  it('should call next with the error if the handler rejects', async () => {
    const testError = new Error('oops');
    const handler = sinon.stub().rejects(testError);
    await asyncWrapHandler(handler)('req' as any, 'res' as any, nextSpy);

    sinon.assert.calledOnce(handler);
    sinon.assert.calledWithExactly(handler, 'req', 'res', nextSpy);
    sinon.assert.calledOnce(nextSpy);
    sinon.assert.calledWithExactly(nextSpy, testError);
  });
});
