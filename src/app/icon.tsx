import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 18,
          background: 'linear-gradient(135deg, #2A170D 0%, #150A05 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFEAA07',
          borderRadius: 8,
          border: '1.5px solid #D4AF37',
          fontWeight: 900,
          fontFamily: 'serif',
          letterSpacing: -1,
        }}
      >
        FA
      </div>
    ),
    {
      ...size,
    }
  );
}
