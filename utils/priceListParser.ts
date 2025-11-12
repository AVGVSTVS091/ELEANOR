import * as XLSX from 'xlsx';
import { Product } from '../types';

const PRICE_HEADERS = ['precio', 'price', 'valor', 'value'];
const NAME_HEADERS = ['nombre', 'name', 'producto', 'product', 'descripción', 'description'];
const CODE_HEADERS = ['código', 'codigo', 'code', 'sku', 'id'];

const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
    return headers.findIndex(header => possibleNames.includes(header.toLowerCase().trim()));
}

/**
 * Parses freeform text where each line is expected to be in the format:
 * [CODE] [PRODUCT NAME] ... [PRICE]
 * It ignores certain header lines and is tolerant to spacing.
 */
const parseFreeformText = (text: string): Product[] => {
    const lines = text.trim().split(/\r?\n/);
    const products: Product[] = [];
    const ignorePhrases = ["lista de precios", "super rubro general"];

    // Regex to capture:
    // 1. Code (starts with non-space, can be alphanumeric)
    // 2. Name (everything in between, trimmed)
    // 3. Price (ends the line, can have ., and $)
    const productLineRegex = /^(\S+)\s+(.*?)\s+([$]?\s*[\d.,]+)$/i;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (ignorePhrases.some(phrase => trimmedLine.toLowerCase().includes(phrase))) {
            continue;
        }

        const match = trimmedLine.match(productLineRegex);
        if (match) {
            const [, code, name, priceStr] = match;
            
            // Clean and parse the price
            let cleanedPrice = priceStr.replace(/[$\s]/g, ''); // Remove $ and spaces
            // If the last comma is after the last dot, it's a decimal comma.
            if (cleanedPrice.lastIndexOf(',') > cleanedPrice.lastIndexOf('.')) {
                cleanedPrice = cleanedPrice.replace(/\./g, '').replace(',', '.');
            } else {
            // Otherwise, it's a decimal point or no comma exists.
                cleanedPrice = cleanedPrice.replace(/,/g, '');
            }
            const price = parseFloat(cleanedPrice);

            if (code && name && !isNaN(price)) {
                products.push({
                    id: code.trim(),
                    code: code.trim(),
                    name: name.trim(),
                    price: price
                });
            }
        }
    }
    
    return products;
}

const parseExcel = (data: ArrayBuffer): Product[] => {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (!json || json.length < 2 || !json[0]) return [];

    const headers = json[0].map(h => String(h));
    const priceIndex = findColumnIndex(headers, PRICE_HEADERS);
    const nameIndex = findColumnIndex(headers, NAME_HEADERS);
    const codeIndex = findColumnIndex(headers, CODE_HEADERS);

    if (priceIndex === -1 || nameIndex === -1 || codeIndex === -1) {
        // Fallback for Excel: convert to text and try parsing it as freeform
        const text_data = XLSX.utils.sheet_to_csv(worksheet, {FS: "\t"});
        const freeformProducts = parseFreeformText(text_data);
        if (freeformProducts.length > 0) {
            return freeformProducts;
        }
        throw new Error('Could not identify required columns (code, name, price) in Excel file.');
    }

    const products: Product[] = [];
    for (let i = 1; i < json.length; i++) {
        const row = json[i];
        if (!row || row.length < Math.max(priceIndex, nameIndex, codeIndex) + 1) continue;

        const priceStr = String(row[priceIndex]);
        let cleanedPrice = priceStr.replace(/[$\s]/g, '');
        if (cleanedPrice.lastIndexOf(',') > cleanedPrice.lastIndexOf('.')) {
            cleanedPrice = cleanedPrice.replace(/\./g, '').replace(',', '.');
        } else {
            cleanedPrice = cleanedPrice.replace(/,/g, '');
        }
        const price = parseFloat(cleanedPrice);
        
        const name = String(row[nameIndex]);
        const code = String(row[codeIndex]);

        if (!isNaN(price) && name && code) {
            products.push({ id: code, code, name, price });
        }
    }
    return products;
}

const parseCSV_TXT = (text: string): Product[] => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
        // Not enough lines for headers + data, try freeform directly
        return parseFreeformText(text);
    }
    
    // Attempt structured (header-based) parsing
    const separator = [',', ';', '\t'].sort((a,b) => lines[0].split(b).length - lines[0].split(a).length)[0];
    const headers = lines[0].split(separator).map(h => h.trim());

    const priceIndex = findColumnIndex(headers, PRICE_HEADERS);
    const nameIndex = findColumnIndex(headers, NAME_HEADERS);
    const codeIndex = findColumnIndex(headers, CODE_HEADERS);

    // If we have all the headers, proceed with structured parsing
    if (priceIndex !== -1 && nameIndex !== -1 && codeIndex !== -1) {
        const products: Product[] = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(separator);
            if (values.length < Math.max(priceIndex, nameIndex, codeIndex) + 1) continue;

            const priceStr = String(values[priceIndex]);
            let cleanedPrice = priceStr.replace(/[$\s]/g, '');
            if (cleanedPrice.lastIndexOf(',') > cleanedPrice.lastIndexOf('.')) {
                cleanedPrice = cleanedPrice.replace(/\./g, '').replace(',', '.');
            } else {
                cleanedPrice = cleanedPrice.replace(/,/g, '');
            }
            const price = parseFloat(cleanedPrice);

            const name = String(values[nameIndex]);
            const code = String(values[codeIndex]);

            if (!isNaN(price) && name && code) {
                products.push({ id: code, code, name, price });
            }
        }
        
        // Only return if we found products. Otherwise, fall through to freeform.
        if (products.length > 0) {
            return products;
        }
    }
    
    // Fallback to freeform parsing if structured parsing fails or finds no products
    const freeformProducts = parseFreeformText(text);
    if (freeformProducts.length > 0) {
        return freeformProducts;
    }

    // If both methods fail, throw an error.
    throw new Error('Could not parse the price list. Please check the file format and ensure it contains code, name, and price columns, or follows the "code name... price" format.');
}


export const parsePriceListFile = (file: File): Promise<Product[]> => {
    return new Promise((resolve, reject) => {
        // More robustly check for Excel MIME types
        const isExcel = file.type.includes('sheet') || file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        // More robustly check for text-based formats
        const isText = file.type.includes('csv') || file.type.includes('text') || file.name.endsWith('.csv') || file.name.endsWith('.txt');

        if (!isExcel && !isText) {
            return reject(new Error('Unsupported file type for price list.'));
        }
        
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                if (isExcel) {
                    const products = parseExcel(event.target?.result as ArrayBuffer);
                    resolve(products);
                } else { // isText must be true here
                    const products = parseCSV_TXT(event.target?.result as string);
                    resolve(products);
                }
            } catch (e) {
                reject(e);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file.'));
        
        if (isExcel) {
            reader.readAsArrayBuffer(file);
        } else { // isText must be true
            reader.readAsText(file);
        }
    });
};