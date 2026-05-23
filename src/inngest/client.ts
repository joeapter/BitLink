import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'bitlink',
  eventKey: process.env.INNGEST_EVENT_KEY,
});
