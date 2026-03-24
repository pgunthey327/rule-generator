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
  private serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

  constructor() {
    // No need to store API key - server handles it
  }

  /**
   * Extract OIDs from Excel data using Gen AI
   */
  async extractOIDsFromExcel(excelJson: Record<string, any>[]): Promise<OIDExtractResponse> {
    try {
      const response = await axios.post(
        `${this.serverUrl}/api/genai/extract-oids`,
        {
          excelJson,
        }
      );
      return response.data;
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
  ): Promise<AIResponse> {
    try {
      const response = await axios.post(
        `${this.serverUrl}/api/genai/generate-code`,
        {
          excelData1,
          filteredExcelData2,
          oids,
          lob,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating code:', error);
      throw new Error('Failed to generate code');
    }
  }
}
