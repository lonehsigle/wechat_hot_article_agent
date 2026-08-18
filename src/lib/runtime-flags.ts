export function isDemoDataAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEMO_DATA === 'true';
}

export function demoDataDisabledMessage(feature: string): string {
  return `${feature}需要真实数据源。当前已禁用演示数据，开发演示可设置 ALLOW_DEMO_DATA=true。`;
}
