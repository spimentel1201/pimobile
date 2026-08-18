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
    // Look for patterns like "Model Code: XXX" or "Type No: XXX"
    // Enhanced to capture longer model numbers (minimum 5 chars)
    const modelPatterns = [
        /MODEL[O]?\s*CODE\s*[:.\-]?\s*([A-Z0-9\-]{5,})/i,
        /TYPE\s*NO[.]?\s*[:.\-]?\s*([A-Z0-9\-]{5,})/i,
        /MODEL[O]?\s*[:.\-]?\s*([A-Z0-9\-]{5,})/i,
        /MOD[.]?\s*[:.\-]?\s*([A-Z0-9\-]{5,})/i,
    ];

    for (const pattern of modelPatterns) {
        const match = text.match(pattern);
        if (match && match[1] && match[1].length >= 5) {
            // Clean up the model number
            let model = match[1].trim();
            // Remove trailing non-alphanumeric chars
            model = model.replace(/[^A-Z0-9\-]+$/i, '');
            return model;
        }
    }

    return null;
}

/**
 * Extract serial number from OCR text
 */
function extractSerialNumber(text: string): string | null {
    // Look for patterns like "S/N: XXX" or "Serial No: XXX"
    // Require minimum 8 characters for serial numbers
    const serialPatterns = [
        /S\s*[\/]?\s*N\s*[:.\-]?\s*([A-Z0-9]{8,})/i,
        /SERIAL\s*NO[.]?\s*[:.\-]?\s*([A-Z0-9]{8,})/i,
        /SERIE\s*[:.\-]?\s*([A-Z0-9]{8,})/i,
        // Standalone long alphanumeric (likely serial)
        /\b([A-Z0-9]{10,})\b/i,
    ];

    for (const pattern of serialPatterns) {
        const match = text.match(pattern);
        if (match && match[1] && match[1].length >= 8) {
            return match[1].trim();
        }
    }

    return null;
}

/**
 * Process OCR text and extract device information
 */
function processOCRText(rawText: string): ExtractedDeviceInfo {
    console.log('OCR Raw Text:', rawText);

    // Post-process OCR text to fix common errors
    const processedText = rawText
        .replace(/[O0]/g, (match, offset, string) => {
            const before = string[offset - 1];
            const after = string[offset + 1];

            // Special case: "2O" or "3O" followed by letter likely means "2D" or "3D"
            // Example: "Z2OQ" should be "Z2DQ"
            if (/[23]/.test(before) && /[A-Z]/i.test(after)) {
                return 'D';
            }

            // If surrounded by letters, likely 'O'
            if (/[A-Z]/i.test(before) || /[A-Z]/i.test(after)) {
                return 'O';
            }

            // Otherwise it's '0'
            return '0';
        })
        .replace(/[l1I]/g, (match, offset, string) => {
            const before = string[offset - 1];
            const after = string[offset + 1];

            // If surrounded by letters, likely 'I'
            if (/[A-Z]/i.test(before) || /[A-Z]/i.test(after)) {
                return 'I';
            }
            // Otherwise it's '1'
            return '1';
        })
        // Fix 9/0 confusion in model numbers
        // Example: "LN3209" should likely be "LN3200"
        .replace(/(\d)9(\d)/g, '$10$2')
        // Fix 8/3 confusion after letters
        // Example: "LN820539" should be "LN320539"
        .replace(/([A-Z])8(\d{2,})/gi, '$13$2');

    // Extract information using pattern matching
    const brand = extractBrand(processedText);
    const model = extractModel(processedText);
    const serialNumber = extractSerialNumber(processedText);

    return {
        brand: brand ? brand.toUpperCase() : null,
        model: model ? model.toUpperCase() : null,
        serialNumber: serialNumber ? serialNumber.toUpperCase() : null,
        rawText,
    };
}

/**
 * Extract device info using Vision Camera OCR Plus (native only)
 */
async function extractWithVisionCameraOCR(imageUri: string): Promise<ExtractedDeviceInfo> {
    try {
        // Import the OCR plugin
        const { OCR } = require('react-native-vision-camera-ocr-plus');

        // Process image with Vision Camera OCR Plus
        const result = await OCR.recognize(imageUri, {
            language: 'latin', // or 'english'
        });

        // Combine all text blocks
        const rawText = result.blocks
            .map((block: any) => block.text)
            .join('\n');

        console.log('Vision Camera OCR Plus result:', rawText);
        return processOCRText(rawText);
    } catch (error) {
        console.error('Vision Camera OCR Plus error:', error);
        throw error;
    }
}

/**
 * Extract device info using Tesseract.js (web fallback)
 */
async function extractWithTesseract(imageUri: string): Promise<ExtractedDeviceInfo> {
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
            tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
            preserve_interword_spaces: '1',
        });

        // Perform OCR
        const { data } = await worker.recognize(imageUri);

        // Terminate worker
        await worker.terminate();

        console.log('Tesseract OCR result:', data.text);
        return processOCRText(data.text);
    } catch (error) {
        console.error('Tesseract OCR error:', error);
        throw error;
    }
}

/**
 * Extracts device information from a label image
 * Uses Vision Camera OCR Plus for native platforms (more accurate)
 * Falls back to Tesseract.js for web or if Vision Camera fails
 * @param imageUri - Local file URI from camera/gallery
 * @returns Extracted device info (brand, model, serialNumber)
 */
export async function extractDeviceInfoFromImage(imageUri: string): Promise<ExtractedDeviceInfo> {
    try {
        if (Platform.OS === 'web') {
            // Use Tesseract for web
            console.log('Using Tesseract.js for web OCR');
            return await extractWithTesseract(imageUri);
        } else {
            // Try Vision Camera OCR Plus for native (more accurate)
            console.log('Attempting Vision Camera OCR Plus for native');
            try {
                return await extractWithVisionCameraOCR(imageUri);
            } catch (visionError) {
                // Fallback to Tesseract if Vision Camera fails
                console.warn('Vision Camera OCR Plus failed, falling back to Tesseract:', visionError);
                return await extractWithTesseract(imageUri);
            }
        }
    } catch (error) {
        console.error('OCR extraction error:', error);
        throw new Error('Failed to extract device information from image');
    }
}
