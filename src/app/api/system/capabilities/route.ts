import { NextResponse } from 'next/server';
import { getSystemCapabilities, summarizeCapabilities } from '@/lib/system/capabilities';
import { getDataSourceContracts, summarizeDataSources } from '@/lib/system/data-sources';

export async function GET() {
  return NextResponse.json({
    success: true,
    capabilities: getSystemCapabilities(),
    summary: summarizeCapabilities(),
    dataSources: getDataSourceContracts(),
    dataSourceSummary: summarizeDataSources(),
  });
}
