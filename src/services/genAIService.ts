import axios from 'axios';

export interface AIResponse {
  code: string;
  explanation: string;
}

export interface OIDExtractResponse {
  oids: string[];
  explanation: string;
}

export class GenAIService {
  private apiKey: string;
  private apiUrl = 'https://api.openai.com/v1/chat/completions'; // Change to your AI service endpoint

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Extract OIDs from Excel data using Gen AI
   */
  async extractOIDsFromExcel(excelJson: Record<string, any>[]): Promise<OIDExtractResponse> {
    try {
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

      const response = await this.callAI(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error extracting OIDs:', error);
      throw new Error('Failed to extract OIDs from Excel');
    }
  }

  /**
   * Generate code based on template and rules
   */
  async generateRuleCode(
    excelData1: Record<string, any>[],
    filteredExcelData2: Record<string, any>[],
    oids: string[],
    lob: string,
    helpersContent: string
  ): Promise<AIResponse> {
    try {
      const prompt = `
        Generate a business rule code based on the following data:
        
        Configuration (Excel 1):
        ${JSON.stringify(excelData1, null, 2)}
        
        Filtered Rules (Excel 2 - matching OIDs, LOB: ${lob}):
        ${JSON.stringify(filteredExcelData2, null, 2)}
        
        OIDs to Match: ${JSON.stringify(oids)}
        
        Available Helper Functions:
        ${helpersContent}
        
        Generate JavaScript code that implements these rules.
        Return as JSON with "code" and "explanation" keys.
        
        Response format:
        {
          "code": "// Generated code here",
          "explanation": "What this code does"
        }
      `;

      const response = await this.callAI(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating code:', error);
      throw new Error('Failed to generate code');
    }
  }

  /**
   * Internal method to call AI API
   */
  private async callAI(prompt: string): Promise<string> {
    try {
      // This is a mock implementation. Replace with actual AI service API call
      // For OpenAI:
      const response = await axios.post(
        this.apiUrl,
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
            Authorization: `Bearer ${this.apiKey}`,
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
}
