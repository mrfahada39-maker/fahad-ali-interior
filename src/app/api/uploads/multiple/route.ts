import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dfd8rzojj';
const API_KEY = process.env.CLOUDINARY_API_KEY || '349178888815894';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || 'ZeZe39YqYU2RgC_JBEkWC3AO_Js';

async function uploadSingleFileToCloudinary(file: File, folder = 'fahad-ali-interior/products') {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`;

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

  const cloudinaryFormData = new FormData();
  cloudinaryFormData.append('file', base64);
  cloudinaryFormData.append('api_key', API_KEY);
  cloudinaryFormData.append('timestamp', String(timestamp));
  cloudinaryFormData.append('folder', folder);
  cloudinaryFormData.append('signature', signature);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: cloudinaryFormData,
    });

    if (res.ok) {
      const data = await res.json();
      return {
        url: data.secure_url || data.url,
        secureUrl: data.secure_url || data.url,
        publicId: data.public_id,
        format: data.format || 'jpg',
        resourceType: data.resource_type || 'image',
        width: data.width,
        height: data.height,
        bytes: data.bytes || buffer.length,
      };
    }
  } catch (err) {
    console.error('[Cloudinary Upload Error]', err);
  }

  return {
    url: base64,
    secureUrl: base64,
    publicId: `local_${Date.now()}`,
    format: 'jpg',
    resourceType: 'image',
    bytes: buffer.length,
  };
}

export async function POST(req: NextRequest) {
  try {
    const folder = req.nextUrl.searchParams.get('folder') || 'fahad-ali-interior/products';
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const results = await Promise.all(
      files.map((file) => uploadSingleFileToCloudinary(file, folder))
    );

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Upload failed' }, { status: 500 });
  }
}
