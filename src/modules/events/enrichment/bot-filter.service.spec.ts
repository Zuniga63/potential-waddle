// EVENT-04: bots are flagged (is_bot=true) so dashboards can exclude them (D-10).
// The service wraps `isbot`.
import { BotFilterService } from './bot-filter.service';

const GOOGLEBOT_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

describe('BotFilterService (EVENT-04)', () => {
  let service: BotFilterService;

  beforeEach(() => {
    service = new BotFilterService();
  });

  it('flags a Googlebot user agent as a bot', () => {
    expect(service.isBot(GOOGLEBOT_UA)).toBe(true);
  });

  it('does NOT flag a normal Chrome user agent', () => {
    expect(service.isBot(CHROME_UA)).toBe(false);
  });

  it('does NOT flag an empty/undefined user agent', () => {
    expect(service.isBot('')).toBe(false);
    expect(service.isBot(undefined)).toBe(false);
    expect(service.isBot(null)).toBe(false);
  });
});
