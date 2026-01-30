import { Platform } from 'react-native';
import { createWorker } from 'tesseract.js';

export interface ExtractedDeviceInfo {
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    rawText?: string;
}

/**
 * Common device brands to look for
 */
const KNOWN_BRANDS = [
    'LG', 'SAMSUNG', 'SONY', 'PANASONIC', 'TCL', 'HISENSE', 'PHILIPS',
    'TOSHIBA', 'SHARP', 'VIZIO', 'HAIER', 'HITACHI', 'JVC', 'SANYO',
    'WHIRLPOOL', 'ELECTROLUX', 'BOSCH', 'SIEMENS', 'MABE', 'INDURAMA'
];

/**
 * Extract brand from OCR text
 */
function extractBrand(text: string): string | null {
    const upperText = text.toUpperCase();
    for (const brand of KNOWN_BRANDS) {
        if (upperText.includes(brand)) {
            return brand;
        }
    }
    return null;
}

/**
 * Extract model number from OCR text
 */
function extractModel(text: string): string | null {
    // Look for patterns like "Model: XXX" or "Modelo: XXX"
    const modelPatterns = [
        /MODEL[O]?\s*[:.\-]?\s*([A-Z0-9\-]+)/i,
        /TYPE\s*NO[.]?\s*[:.\-]?\s*([A-Z0-9\-]+)/i,
        /MOD[.]?\s*[:.\-]?\s*([A-Z0-9\-]+)/i,
    ];

    for (const pattern of modelPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }

    return null;
}

/**
 * Extract serial number from OCR text
 */
function extractSerialNumber(text: string): string | null {
    // Look for patterns like "S/N: XXX" or "Serial No: XXX"
    const serialPatterns = [
        /S[\/]?N\s*[:.\-]?\s*([A-Z0-9]+)/i,
        /SERIAL\s*NO[.]?\s*[:.\-]?\s*([A-Z0-9]+)/i,
        /SERIE\s*[:.\-]?\s*([A-Z0-9]+)/i,
    ];

    for (const pattern of serialPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }

    return null;
}

/**
 * Extracts device information from a label image using Tesseract.js OCR
 * @param imageUri - Local file URI from camera/gallery
 * @returns Extracted device info (brand, model, serialNumber)
 */
export async function extractDeviceInfoFromImage(imageUri: string): Promise<ExtractedDeviceInfo> {
    try {
        // Create Tesseract worker
        const worker = await createWorker('eng+spa', 1, {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                }
            },
        });

        // Perform OCR
        const { data } = await worker.recognize(imageUri);
        const rawText = data.text;

        console.log('OCR Raw Text:', rawText);

        // Extract information using pattern matching
        const brand = extractBrand(rawText);
        const model = extractModel(rawText);
        const serialNumber = extractSerialNumber(rawText);

        // Terminate worker
        await worker.terminate();

        return {
            brand,
            model,
            serialNumber,
            rawText,
        };
    } catch (error) {
        console.error('OCR extraction error:', error);
        throw new Error('Failed to extract device information from image');
    }
}
