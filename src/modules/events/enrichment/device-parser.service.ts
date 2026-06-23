import { Injectable } from '@nestjs/common';

/**
 * Parsed device info for the events schema: browser / os / device_type only.
 * (No version fields — the events table stores none, unlike whatsapp_click.)
 */
interface ParsedDevice {
  browser: string | null;
  os: string | null;
  deviceType: string | null;
}

interface ParsedUserAgent {
  browser: { name: string | null; version: string | null };
  os: { name: string | null; version: string | null };
  device: { type: string | null };
}

/**
 * DeviceParserService — UA → browser/os/device_type.
 *
 * The hand-rolled parser is lifted verbatim from `whatsapp-clicks.service.ts`
 * (RESEARCH "Don't Hand-Roll": reuse the existing dependency-free parser, do NOT
 * add ua-parser-js). The IP-anonymization helper from that service is deliberately
 * NOT carried over (D-06: no IP stored).
 */
@Injectable()
export class DeviceParserService {
  parse(userAgent: string | null): ParsedDevice {
    const ua = this.parseUserAgent(userAgent ?? '');
    return {
      browser: ua.browser.name,
      os: ua.os.name,
      deviceType: ua.device.type,
    };
  }

  /**
   * Simple user agent parser
   */
  private parseUserAgent(userAgent: string): ParsedUserAgent {
    const ua = userAgent.toLowerCase();

    // Browser detection
    let browserName: string | null = null;
    let browserVersion: string | null = null;

    if (ua.includes('edg/')) {
      browserName = 'Edge';
      browserVersion = this.extractVersion(ua, 'edg/');
    } else if (ua.includes('chrome/')) {
      browserName = 'Chrome';
      browserVersion = this.extractVersion(ua, 'chrome/');
    } else if (ua.includes('firefox/')) {
      browserName = 'Firefox';
      browserVersion = this.extractVersion(ua, 'firefox/');
    } else if (ua.includes('safari/') && !ua.includes('chrome')) {
      browserName = 'Safari';
      browserVersion = this.extractVersion(ua, 'version/');
    } else if (ua.includes('opera/') || ua.includes('opr/')) {
      browserName = 'Opera';
      browserVersion = this.extractVersion(ua, ua.includes('opr/') ? 'opr/' : 'opera/');
    }

    // OS detection
    let osName: string | null = null;
    let osVersion: string | null = null;

    if (ua.includes('windows')) {
      osName = 'Windows';
      if (ua.includes('windows nt 10')) osVersion = '10';
      else if (ua.includes('windows nt 6.3')) osVersion = '8.1';
      else if (ua.includes('windows nt 6.2')) osVersion = '8';
      else if (ua.includes('windows nt 6.1')) osVersion = '7';
    } else if (ua.includes('mac os x')) {
      osName = 'macOS';
      const match = ua.match(/mac os x ([\d_]+)/);
      if (match) osVersion = match[1].replace(/_/g, '.');
    } else if (ua.includes('android')) {
      osName = 'Android';
      const match = ua.match(/android ([\d.]+)/);
      if (match) osVersion = match[1];
    } else if (ua.includes('iphone') || ua.includes('ipad')) {
      osName = 'iOS';
      const match = ua.match(/os ([\d_]+)/);
      if (match) osVersion = match[1].replace(/_/g, '.');
    } else if (ua.includes('linux')) {
      osName = 'Linux';
    }

    // Device type detection
    let deviceType: string | null = 'desktop';
    if (ua.includes('mobile')) {
      deviceType = 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      deviceType = 'tablet';
    }

    return {
      browser: { name: browserName, version: browserVersion },
      os: { name: osName, version: osVersion },
      device: { type: deviceType },
    };
  }

  /**
   * Extract version from user agent string
   */
  private extractVersion(ua: string, identifier: string): string | null {
    const regex = new RegExp(`${identifier}([\\d.]+)`);
    const match = ua.match(regex);
    return match ? match[1] : null;
  }
}
