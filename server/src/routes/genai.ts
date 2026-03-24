import axios from 'axios';
import { Router, Request, Response } from 'express';

interface AIResponse {
  code: string;
  explanation: string;
}

interface OIDExtractResponse {
  oids: string[];
  explanation: string;
}

const router = Router();

/**
 * POST /api/genai/extract-oids
 * Extract OIDs from Excel data using Gen AI
 */
router.post('/extract-oids', async (req: Request, res: Response) => {
  try {
    const { excelJson } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!excelJson) {
      return res.status(400).json({ error: 'Missing excelJson' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'Server missing OpenAI API key' });
    }

    const prompt = `
      Analyze the following Excel data and extract all unique OID (Object Identifier) values.
      Return them as a JSON array with "oids" key.
      
      Data:
      ${JSON.stringify(excelJson, null, 2)}
      
      Response format:
      {
        "oids": ["OID1", "OID2", ...],
        "explanation": "Brief explanation of OIDs found"
      }
    `;

    const response = await callAI(prompt, apiKey);
    const result = JSON.parse(response) as OIDExtractResponse;
    
    return res.json(result);
  } catch (error) {
    console.error('Error extracting OIDs:', error);
    return res.status(500).json({ error: 'Failed to extract OIDs from Excel' });
  }
});

/**
 * POST /api/genai/generate-code
 * Generate code based on template and rules
 */
router.post('/generate-code', async (req: Request, res: Response) => {
  try {
    const { excelData1, filteredExcelData2, oids, lob } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!excelData1 || !filteredExcelData2 || !oids || !lob) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'Server missing OpenAI API key' });
    }

    const prompt = `
      Generate a business rule code based on the following data:
      
      Configuration (Excel 1):
      ${JSON.stringify(excelData1, null, 2)}
      
      Filtered Rules (Excel 2 - matching OIDs, LOB: ${lob}):
      ${JSON.stringify(filteredExcelData2, null, 2)}
      
      OIDs to Match: ${JSON.stringify(oids)}
      
      Generate JavaScript code that implements these rules.
      Return as JSON with "code" and "explanation" keys.
      
      Response format:
      {
        "code": "// Generated code here",
        "explanation": "What this code does"
      }
    `;

    const response = await callAI(prompt, apiKey);
    const result = JSON.parse(response) as AIResponse;
    
    return res.json(result);
  } catch (error) {
    console.error('Error generating code:', error);
    return res.status(500).json({ error: 'Failed to generate code' });
  }
});

/**
 * Internal method to call AI API
 */
async function callAI(prompt: string, apiKey: string): Promise<string> {
  try {
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    
    const response = await axios.post(
      apiUrl,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert business rules engine developer.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    }
    throw new Error('No response from AI service');
  } catch (error) {
    console.error('Error calling AI service:', error);
    throw error;
  }
}

export default router;
