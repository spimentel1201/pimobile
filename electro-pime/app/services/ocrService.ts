import { Platform } from 'react-native';
import { createWorker, PSM } from 'tesseract.js';

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
    // Enhanced to capture longer model numbers with hyphens
    const modelPatterns = [
        /MODEL[O]?\s*CODE\s*[:.\-]?\s*([A-Z0-9\-]+)/i,
        /MODEL[O]?\s*[:.\-]?\s*([A-Z0-9\-]{3,})/i,
        /TYPE\s*NO[.]?\s*[:.\-]?\s*([A-Z0-9\-]{3,})/i,
        /MOD[.]?\s*[:.\-]?\s*([A-Z0-9\-]{3,})/i,
    ];

    for (const pattern of modelPatterns) {
        const match = text.match(pattern);
        if (match && match[1] && match[1].length >= 3) {
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
        // Create Tesseract worker with optimized settings
        const worker = await createWorker('eng+spa', 1, {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                }
            },
        });

        // Configure Tesseract for better accuracy
        await worker.setParameters({
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-/:. ',
            tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // Assume uniform block of text
            preserve_interword_spaces: '1',
        });

        // Perform OCR
        const { data } = await worker.recognize(imageUri);
        let rawText = data.text;

        console.log('OCR Raw Text:', rawText);

        // Post-process OCR text to fix common errors
        rawText = rawText
            .replace(/[O0]/g, (match, offset, string) => {
                // If surrounded by letters, likely 'O', if by numbers, likely '0'
                const before = string[offset - 1];
                const after = string[offset + 1];
                if (/[A-Z]/i.test(before) || /[A-Z]/i.test(after)) {
                    return 'O';
                }
                return '0';
            })
            .replace(/[l1I]/g, (match, offset, string) => {
                // Similar logic for 1/I/l confusion
                const before = string[offset - 1];
                const after = string[offset + 1];
                if (/[A-Z]/i.test(before) || /[A-Z]/i.test(after)) {
                    return 'I';
                }
                return '1';
            });

        // Extract information using pattern matching
        const brand = extractBrand(rawText);
        const model = extractModel(rawText);
        const serialNumber = extractSerialNumber(rawText);

        // Terminate worker
        await worker.terminate();

        return {
            brand: brand ? brand.toUpperCase() : null,
            model: model ? model.toUpperCase() : null,
            serialNumber: serialNumber ? serialNumber.toUpperCase() : null,
            rawText,
        };
    } catch (error) {
        console.error('OCR extraction error:', error);
        throw new Error('Failed to extract device information from image');
    }
}
