import { Platform } from 'react-native';

const DEEPSEEK_API_KEY = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export interface ExtractedDeviceInfo {
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    rawText?: string;
}

/**
 * Convert image URI to base64 string (platform-specific)
 */
async function imageUriToBase64(uri: string): Promise<string> {
    if (Platform.OS === 'web') {
        // Web: Use fetch to get blob, then convert to base64
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } else {
        // Native: Use expo-file-system
        const FileSystem = require('expo-file-system');
        return await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });
    }
}

/**
 * Extracts device information from a label image using DeepSeek Vision API
 * @param imageUri - Local file URI from camera/gallery
 * @returns Extracted device info (brand, model, serialNumber)
 */
export async function extractDeviceInfoFromImage(imageUri: string): Promise<ExtractedDeviceInfo> {
    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'your_deepseek_api_key_here') {
        throw new Error('DeepSeek API key not configured. Please add EXPO_PUBLIC_DEEPSEEK_API_KEY to .env file.');
    }

    try {
        // Read image as base64 (platform-specific)
        const base64Image = await imageUriToBase64(imageUri);

        // Determine MIME type from URI
        const mimeType = imageUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

        const prompt = `Analyze this device label image and extract the following information.
Look for:
1. Brand/Manufacturer (e.g., LG, Samsung, Sony, Panasonic, TCL, Hisense, etc.)
2. Model number (often labeled as "Model", "Model No", "Modelo", etc.)
3. Serial number (often labeled as "Serial No", "S/N", "Número de Serie", etc.)

IMPORTANT: Return ONLY a valid JSON object in this exact format, with no additional text:
{"brand": "value or null", "model": "value or null", "serialNumber": "value or null"}

If a field cannot be found, use null. Do not include any explanation or markdown.`;

        // Call DeepSeek API
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: prompt,
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Image}`,
                                },
                            },
                        ],
                    },
                ],
                temperature: 0.1,
                max_tokens: 256,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('DeepSeek API error:', errorData);
            throw new Error(`API error: ${response.status} - ${errorData?.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();

        // Extract text from DeepSeek response
        const responseText = data?.choices?.[0]?.message?.content;

        if (!responseText) {
            throw new Error('No response from DeepSeek API');
        }

        // Parse JSON from response (handle potential markdown wrapper)
        let jsonString = responseText.trim();

        // Remove markdown code blocks if present
        if (jsonString.startsWith('```')) {
            jsonString = jsonString.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        }

        const parsed = JSON.parse(jsonString);

        return {
            brand: parsed.brand || null,
            model: parsed.model || null,
            serialNumber: parsed.serialNumber || null,
            rawText: responseText,
        };
    } catch (error) {
        console.error('OCR extraction error:', error);
        throw error;
    }
}
