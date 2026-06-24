import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pilotId = searchParams.get('pilotId');

  if (!pilotId) {
    return NextResponse.json({ error: 'Pilot ID is required' }, { status: 400 });
  }

  const query = `json=v2&userid=${encodeURIComponent(pilotId)}`;

  try {
    const response = await fetch(`https://www.simbrief.com/api/xml.fetcher.php?${query}`);
    if (!response.ok) {
      return NextResponse.json({ error: 'Erro ao conectar ao SimBrief' }, { status: 500 });
    }
    const rawData = await response.json();

    // Check SimBrief API fetch status
    const fetchStatus = rawData.fetch?.status;
    if (fetchStatus && fetchStatus !== 'OFP Found' && fetchStatus !== 'Success') {
      return NextResponse.json({ error: `SimBrief: ${fetchStatus}` }, { status: 400 });
    }

    return NextResponse.json(rawData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
