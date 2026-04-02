export type CookieEntity = Record<string, string | number>;

export class AccountCookie {
  private readonly _token: string;
  private _cookie: CookieEntity[];

  constructor(token: string, cookies: string[]) {
    this._token = token;
    this._cookie = AccountCookie.parse(cookies);
  }

  static create(token: string, cookies: CookieEntity[]): AccountCookie {
    const value = new AccountCookie(token, []);
    value._cookie = cookies;
    return value;
  }

  public toString(): string {
    return this.stringify(this._cookie);
  }

  public toJSON(): { token: string; cookies: CookieEntity[] } {
    return {
      token: this._token,
      cookies: this._cookie,
    };
  }

  public get token(): string {
    return this._token;
  }

  public static parse(cookies: string[]): CookieEntity[] {
    const cookieMap = new Map<string, CookieEntity>();

    for (const cookie of cookies) {
      const cookieObj: CookieEntity = {};
      const parts = cookie.split(';').map(str => str.trim());

      const [nameValue] = parts;
      if (nameValue) {
        const [name, ...valueParts] = nameValue.split('=');
        const cookieName = name.trim();
        cookieObj.name = cookieName;
        cookieObj.value = valueParts.join('=').trim();

        for (const part of parts.slice(1)) {
          const [key, ...valueParts] = part.split('=');
          const value = valueParts.join('=').trim();
          if (key) {
            const keyLower = key.toLowerCase();
            cookieObj[keyLower] = value || 'true';
          }
        }

        if (cookieObj.name) {
          cookieMap.set(cookieName, cookieObj);
        }
      }
    }

    return Array.from(cookieMap.values());
  }

  private stringify(parsedCookie: CookieEntity[]): string {
    return parsedCookie
      .filter(cookie => cookie.value && cookie.value !== 'EXPIRED')
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');
  }
}
