import { NextRequest, NextResponse } from 'next/server';

function getBaseUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost || request.headers.get('host') || 'localhost:3000';
  const cleanHost = host.replace('0.0.0.0', 'localhost');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  return `${protocol}://${cleanHost}`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const baseUrl = getBaseUrl(request);

  if (error) {
    return NextResponse.redirect(`${baseUrl}/?error=oauth_${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?error=no_code`);
  }

  try {   
    const isDocker = process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV === 'true';
    const apiUrl = isDocker 
      ? (process.env.BACKEND_URL || 'http://backend:5223/api')
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5223/api');
    const response = await fetch(`${apiUrl}/auth/google/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const text = await response.text();
    
    if (!response.ok) {
      console.error('Backend error:', response.status, text);
      throw new Error(`Backend error: ${response.status}. Endpoint /auth/google/callback может не существовать. ${text || 'Пустой ответ'}`);
    }

    if (!text || text.trim() === '') {
      throw new Error('Empty response from backend. Endpoint /auth/google/callback не реализован на backend.');
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse response:', text);
      throw new Error(`Invalid JSON response from backend: ${text.substring(0, 100)}`);
    }

    if (!data.success || !data.data) {
      throw new Error(data.message || 'Ошибка OAuth');
    }

    const { token } = data.data;

    const redirectUrl = new URL('/hotels', baseUrl);
    redirectUrl.searchParams.set('oauth', 'success');
    redirectUrl.searchParams.set('token', token);

    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(`${baseUrl}/?error=oauth_error&message=${encodeURIComponent(error.message)}`);
  }
}

