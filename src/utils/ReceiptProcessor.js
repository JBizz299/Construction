// src/utils/ReceiptProcessor.js
import Tesseract from 'tesseract.js';

export class ReceiptProcessor {
    constructor() {
        this.categories = {
            'materials': ['lumber', 'concrete', 'steel', 'pipe', 'wire', 'paint', 'tile', 'drywall', 'insulation', 'roofing'],
            'tools': ['drill', 'saw', 'hammer', 'tool', 'equipment', 'ladder', 'wrench', 'screwdriver'],
            'labor': ['hourly', 'wage', 'contractor', 'worker', 'service', 'installation'],
            'permits': ['permit', 'license', 'inspection', 'fee', 'approval'],
            'utilities': ['electric', 'gas', 'water', 'sewer', 'power', 'utility'],
            'transport': ['fuel', 'gas', 'mileage', 'truck', 'delivery', 'shipping']
        };
    }

    async processReceipt(imageFile) {
        try {
            console.log('Starting OCR processing...');

            // Step 1: OCR Processing
            const { data: { text } } = await Tesseract.recognize(imageFile, 'eng', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            });

            console.log('OCR completed, extracting data...');

            // Step 2: Extract structured data
            const extractedData = this.extractReceiptData(text);

            // Step 3: Categorize expenses
            const categorizedData = this.categorizeExpenses(extractedData);

            console.log('Receipt processing completed successfully');

            return {
                ...extractedData,
                categories: categorizedData,
                rawText: text,
                processedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Receipt processing failed:', error);
            throw new Error('Failed to process receipt: ' + error.message);
        }
    }

    extractReceiptData(text) {
        // Enhanced extraction patterns
        const patterns = {
            vendor: /(?:vendor|store|sold by|from)[\s:]*([A-Za-z0-9\s&]+)/i,
            date: /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
            total: /(?:total|amount due|balance)[\s:]*\$?([\d,]+\.\d{2})/i,
            tax: /(?:tax|hst|gst|pst)[\s:]*\$?([\d,]+\.\d{2})/i,
            subtotal: /(?:subtotal|sub total)[\s:]*\$?([\d,]+\.\d{2})/i,
            items: /^(.+?)\s+\$?([\d,]+\.\d{2})$/gm
        };

        // Try to get vendor from first few lines if pattern doesn't match
        const lines = text.split('\n').filter(line => line.trim());
        let vendor = text.match(patterns.vendor)?.[1]?.trim();

        if (!vendor && lines.length > 0) {
            // Take first non-empty line as vendor
            vendor = lines[0].trim();
        }

        vendor = vendor || 'Unknown Vendor';

        const date = text.match(patterns.date)?.[0] || null;
        const total = parseFloat(text.match(patterns.total)?.[1]?.replace(',', '') || 0);
        const tax = parseFloat(text.match(patterns.tax)?.[1]?.replace(',', '') || 0);
        const subtotal = parseFloat(text.match(patterns.subtotal)?.[1]?.replace(',', '') || 0);

        // Extract line items
        const lineItems = [];
        let match;
        const itemPattern = /^(.+?)\s+\$?([\d,]+\.\d{2})$/gm;

        while ((match = itemPattern.exec(text)) !== null) {
            const description = match[1].trim();
            const amount = parseFloat(match[2].replace(',', ''));

            if (description.length > 0 && amount > 0) {
                lineItems.push({
                    description,
                    amount
                });
            }
        }

        return {
            vendor,
            date,
            total,
            tax,
            subtotal,
            lineItems
        };
    }

    categorizeExpenses(extractedData) {
        const categorized = {
            materials: [],
            tools: [],
            labor: [],
            permits: [],
            utilities: [],
            transport: [],
            other: []
        };

        // Create a searchable text from vendor and line items
        const vendorLower = extractedData.vendor.toLowerCase();
        const lineItemsText = extractedData.lineItems.map(item => item.description).join(' ').toLowerCase();
        const allText = `${vendorLower} ${lineItemsText}`;

        // Check each category for keyword matches
        let foundMatch = false;

        for (const [category, keywords] of Object.entries(this.categories)) {
            const matchedKeywords = keywords.filter(keyword => allText.includes(keyword));

            if (matchedKeywords.length > 0) {
                categorized[category].push({
                    amount: extractedData.total,
                    confidence: Math.min(0.9, 0.5 + (matchedKeywords.length * 0.1)),
                    reason: `Matched keywords: ${matchedKeywords.join(', ')}`
                });
                foundMatch = true;
            }
        }

        // If no category matched, put in 'other'
        if (!foundMatch) {
            categorized.other.push({
                amount: extractedData.total,
                confidence: 0.5,
                reason: 'No specific category matched'
            });
        }

        return categorized;
    }

    // Calculate budget impact
    calculateBudgetImpact(categorizedData, currentBudget) {
        const impact = {};

        for (const [category, expenses] of Object.entries(categorizedData)) {
            const categoryTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);

            if (categoryTotal > 0) {
                const budgetCategory = currentBudget[category] || { allocated: 0, spent: 0 };

                impact[category] = {
                    previousSpent: budgetCategory.spent,
                    newExpense: categoryTotal,
                    newTotal: budgetCategory.spent + categoryTotal,
                    allocated: budgetCategory.allocated,
                    remaining: budgetCategory.allocated - (budgetCategory.spent + categoryTotal),
                    percentUsed: budgetCategory.allocated > 0
                        ? ((budgetCategory.spent + categoryTotal) / budgetCategory.allocated) * 100
                        : 0
                };
            }
        }

        return impact;
    }
}

// Hook for easy integration with React components
export const useReceiptProcessing = () => {
    const processor = new ReceiptProcessor();

    const processReceipt = async (receiptFile) => {
        try {
            const processedData = await processor.processReceipt(receiptFile);
            return processedData;
        } catch (error) {
            console.error('Processing failed:', error);
            throw error;
        }
    };

    return { processReceipt };
};