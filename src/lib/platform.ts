export enum Platform {
  MACOS = "darwin",
  LINUX = "linux",
  WINDOWS = "win32",
  UNKNOWN = "unknown",
}

export class PlatformDetector {
  private static instance: PlatformDetector;
  private currentPlatform: Platform;

  private constructor() {
    this.currentPlatform = this.detectPlatform();
  }

  public static getInstance(): PlatformDetector {
    if (!PlatformDetector.instance) {
      PlatformDetector.instance = new PlatformDetector();
    }
    return PlatformDetector.instance;
  }

  private detectPlatform(): Platform {
    const platform = process.platform;

    switch (platform) {
      case "darwin":
        return Platform.MACOS;
      case "linux":
        return Platform.LINUX;
      case "win32":
        return Platform.WINDOWS;
      default:
        return Platform.UNKNOWN;
    }
  }

  public getPlatform(): Platform {
    return this.currentPlatform;
  }

  public isMacOS(): boolean {
    return this.currentPlatform === Platform.MACOS;
  }

  public isLinux(): boolean {
    return this.currentPlatform === Platform.LINUX;
  }

  public isWindows(): boolean {
    return this.currentPlatform === Platform.WINDOWS;
  }

  public isSupported(): boolean {
    return this.isMacOS() || this.isLinux();
  }

  public getPlatformName(): string {
    switch (this.currentPlatform) {
      case Platform.MACOS:
        return "macOS";
      case Platform.LINUX:
        return "Linux";
      case Platform.WINDOWS:
        return "Windows";
      default:
        return "Unknown";
    }
  }

  public getBrowserCommand(): string | null {
    switch (this.currentPlatform) {
      case Platform.MACOS:
        return "open";
      case Platform.LINUX:
        return "xdg-open";
      case Platform.WINDOWS:
        return "start";
      default:
        return null;
    }
  }
}

export const platformDetector = PlatformDetector.getInstance();
