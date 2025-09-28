import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read the JSON file from the backend services directory
    const jsonPath = path.join(process.cwd(), '..', '..', 'services', 'backend', 'organization_data', 'orion_10k_full_v2.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const companyData = JSON.parse(jsonData);
    
    return NextResponse.json(companyData);
  } catch (error) {
    console.error('Error reading company data:', error);
    return NextResponse.json(
      { error: 'Failed to load company data' },
      { status: 500 }
    );
  }
}
