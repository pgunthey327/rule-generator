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
    ruleParsed: any, serviceParsed: any, context: any 
  ): Promise<AIResponse> {
    try {
      const response = await axios.post(
        `${this.serverUrl}/api/genai/generate-code`,
        {
          ruleParsed,
          serviceParsed,
          context,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating code:', error);
      throw new Error('Failed to generate code');
    }
  }

  async  getOIDAndRuleId(spydrRule: any) {
      try {
      const response = await axios.post(`${this.serverUrl}/api/genai/extract-oids-ugc`, {
        spydrRule
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw new Error('Failed to fetch branches from GitHub');
    }
  }
}
