import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { Client } from "../types";

const getGenAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable not set");
  }
  return new GoogleGenAI({ apiKey });
};

const languageMap: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    pt: 'Portuguese',
    it: 'Italian',
    de: 'German',
    fr: 'French'
};

export const addContactFunctionDeclaration: FunctionDeclaration = {
    name: 'addContact',
    description: 'Adds a new contact to the CRM system.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            companyName: {
                type: Type.STRING,
                description: 'The name of the company.'
            },
            countryCode: {
                type: Type.STRING,
                description: 'The international country code for the phone number, e.g., "+54".'
            },
            phoneNumber: {
                type: Type.STRING,
                description: 'The contact\'s phone number.'
            },
            industry: {
                type: Type.STRING,
                description: 'The industry or activity of the company.'
            }
        },
        required: ['companyName', 'phoneNumber']
    }
};

export const getChatbotResponse = async (
    query: string,
    clients: Client[],
    language: string,
    fileParts: { inlineData: { data: string; mimeType: string; } }[] = []
) => {
  const ai = getGenAI();
  const model = 'gemini-2.5-pro';
  const fullLanguageName = languageMap[language] || 'English';

  const systemInstruction = `You are a helpful CRM assistant. You have tools to manage contacts. You will be given a user's question and a JSON object containing current CRM data. Answer the user's question based ONLY on the provided JSON data. Be concise, professional, and accurate. If you use a tool, confirm the action. If analyzing a file, provide a summary. If the information is not in the data, state that you cannot find it. Do not invent information. IMPORTANT: You must respond in ${fullLanguageName}.`;

  const contents = [
      ...fileParts,
      { text: `User Question: "${query}"\n\nCRM Data:\n${JSON.stringify(clients, null, 2)}` }
  ];

  try {
    const response = await ai.models.generateContent({
        model,
        contents: { parts: contents },
        config: {
            systemInstruction,
            tools: [{ functionDeclarations: [addContactFunctionDeclaration] }],
        }
    });
    return response;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return { text: "Sorry, I encountered an error trying to process your request.", functionCalls: [] };
  }
};


export const extractContactFromImage = async (base64Image: string, mimeType: string): Promise<Partial<Client>> => {
    const ai = getGenAI();
    const model = 'gemini-2.5-flash';
    const prompt = "Extract the contact information from this image of a business card. Identify the company name, phone number (including country code if available), and industry or a brief description of what the company does.";

    try {
        const imagePart = { inlineData: { data: base64Image, mimeType } };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model,
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        companyName: { type: Type.STRING },
                        countryCode: { type: Type.STRING },
                        phoneNumber: { type: Type.STRING },
                        industry: { type: Type.STRING },
                    }
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error extracting contact from image:", error);
        throw new Error("Failed to analyze image for contact information.");
    }
};

export const getGroundedResponse = async (query: string, latitude: number, longitude: number) => {
    const ai = getGenAI();
    const model = 'gemini-2.5-flash';
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: query,
            config: {
                tools: [{googleMaps: {}}],
            },
            toolConfig: {
                retrievalConfig: {
                    latLng: {
                        latitude,
                        longitude,
                    },
                },
            },
        });
        
        const text = response.text;
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        return { text, groundingChunks };
    } catch (error) {
        console.error("Error with Maps Grounding:", error);
        return { text: "Sorry, I couldn't fetch location information at this time.", groundingChunks: [] };
    }
};

export const correctGrammar = async (text: string, language: string): Promise<string> => {
    const ai = getGenAI();
    const model = 'gemini-2.5-flash';
    const fullLanguageName = languageMap[language] || 'English';

    const systemInstruction = `You are a grammar and spelling correction tool. Correct the following text. Respond ONLY with the corrected text, without any introductory phrases, explanations, or markdown formatting. The response must be in ${fullLanguageName}.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: text,
            config: {
                systemInstruction,
                temperature: 0.2
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error correcting grammar:", error);
        throw new Error("Failed to correct grammar.");
    }
};

export const translateText = async (text: string, targetLanguage: string, sourceLanguage?: string): Promise<string> => {
    const ai = getGenAI();
    const model = 'gemini-2.5-flash';
    const languageName = languageMap[targetLanguage] || targetLanguage;

    const sourceInstruction = sourceLanguage ? ` from ${languageMap[sourceLanguage] || sourceLanguage}` : '';

    const systemInstruction = `You are a translation tool. Translate the following text${sourceInstruction} to ${languageName}. Respond ONLY with the translated text, without any introductory phrases, explanations, markdown formatting, or quotation marks.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: text,
            config: {
                systemInstruction,
                temperature: 0.1
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error translating text:", error);
        throw new Error("Failed to translate text.");
    }
};

export const detectLanguage = async (text: string): Promise<string> => {
    const ai = getGenAI();
    const model = 'gemini-2.5-flash';

    const systemInstruction = `Detect the language of the following text. Respond ONLY with the two-letter ISO 639-1 language code (e.g., 'en', 'es', 'fr'). If you cannot determine the language, respond with 'unknown'.`;
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: text,
            config: {
                systemInstruction,
                temperature: 0
            }
        });
        const langCode = response.text.trim().toLowerCase();
        // Simple validation
        if (langCode.length === 2 && languageMap[langCode]) {
            return langCode;
        }
        return 'unknown';
    } catch (error) {
        console.error("Error detecting language:", error);
        return 'unknown';
    }
};


export const analyzeImageWithGemini = async (base64Image: string, mimeType: string): Promise<string> => {
    const ai = getGenAI();
    const model = 'gemini-2.5-flash';
    const prompt = "Analyze this image and provide a brief, one-sentence summary of its content. If it is a document like an invoice or quote, summarize key details such as total amount, items, or dates if they are visible.";

    try {
        const imagePart = { inlineData: { data: base64Image, mimeType } };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model,
            contents: { parts: [imagePart, textPart] },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error analyzing image:", error);
        throw new Error("Failed to analyze image.");
    }
};