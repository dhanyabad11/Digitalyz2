import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiAI {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.initialize(apiKey);
    }
  }

  initialize(apiKey: string) {
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
      throw new Error('Invalid API key or initialization failed');
    }
  }

  async generateContent(prompt: string): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini AI not initialized. Please provide a valid API key.');
    }

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error('Failed to generate content. Please check your API key and try again.');
    }
  }

  async parseNaturalLanguageQuery(query: string, dataStructure: any): Promise<any> {
    const prompt = `
You are a data query assistant. Given this natural language query: "${query}"

And this data structure:
${JSON.stringify(dataStructure, null, 2)}

Convert the query into a structured filter object that can be used to filter the data.
Return only a JSON object with the following structure:
{
  "entity": "clients|workers|tasks",
  "filters": [
    {
      "field": "fieldName",
      "operator": "equals|contains|greaterThan|lessThan|in",
      "value": "filterValue"
    }
  ]
}

Examples:
- "high priority clients" -> {"entity": "clients", "filters": [{"field": "PriorityLevel", "operator": "greaterThan", "value": 3}]}
- "workers with AI skills" -> {"entity": "workers", "filters": [{"field": "Skills", "operator": "contains", "value": "AI"}]}
- "tasks with duration more than 2" -> {"entity": "tasks", "filters": [{"field": "Duration", "operator": "greaterThan", "value": 2}]}
`;

    const response = await this.generateContent(prompt);
    try {
      return JSON.parse(response.trim());
    } catch {
      throw new Error('Failed to parse natural language query');
    }
  }

  async convertNaturalLanguageToRule(description: string, dataContext: any): Promise<any> {
    const prompt = `
You are a business rule conversion assistant. Convert this natural language rule description into a structured rule object:

Rule Description: "${description}"

Data Context:
${JSON.stringify(dataContext, null, 2)}

Convert this into a rule object with the following structure:
{
  "type": "coRun|slotRestriction|loadLimit|phaseWindow|patternMatch|precedence",
  "description": "clear description of the rule",
  "config": {
    // rule-specific configuration based on type
  }
}

Rule Types:
- coRun: {tasks: ["T1", "T2"]} - tasks that must run together
- slotRestriction: {group: "groupName", minCommonSlots: 2} - minimum shared slots
- loadLimit: {workerGroup: "groupName", maxSlotsPerPhase: 3} - limit worker load
- phaseWindow: {taskId: "T1", allowedPhases: [1, 2, 3]} - restrict task phases
- patternMatch: {pattern: "regex", action: "description"} - pattern-based rules
- precedence: {priority: 1, conditions: ["condition"]} - priority rules
`;

    const response = await this.generateContent(prompt);
    try {
      return JSON.parse(response.trim());
    } catch {
      throw new Error('Failed to convert natural language to rule');
    }
  }

  async suggestDataCorrections(data: any, errors: any[]): Promise<any[]> {
    const prompt = `
You are a data correction assistant. Given this data with errors, suggest specific corrections:

Data:
${JSON.stringify(data, null, 2)}

Errors:
${JSON.stringify(errors, null, 2)}

For each error, suggest a specific correction with:
{
  "errorId": "error identifier",
  "suggestion": "specific correction to make",
  "newValue": "suggested new value",
  "confidence": 0.0-1.0
}

Return an array of correction suggestions.
`;

    const response = await this.generateContent(prompt);
    try {
      return JSON.parse(response.trim());
    } catch {
      return [];
    }
  }

  async recommendRules(data: any): Promise<any[]> {
    const prompt = `
You are a business rule recommendation assistant. Analyze this data and suggest useful business rules:

Data:
${JSON.stringify(data, null, 2)}

Look for patterns like:
- Tasks that often appear together (co-run rules)
- Worker groups that are consistently overloaded (load limits)
- Skills that are in high demand but low supply
- Clients with similar priority patterns

Return an array of rule recommendations:
[
  {
    "type": "ruleType",
    "description": "human readable description",
    "reasoning": "why this rule would be beneficial",
    "config": {rule configuration},
    "confidence": 0.0-1.0
  }
]
`;

    const response = await this.generateContent(prompt);
    try {
      return JSON.parse(response.trim());
    } catch {
      return [];
    }
  }

  async enhancedDataValidation(data: any, baseErrors: any[]): Promise<any[]> {
    const prompt = `
You are an advanced data validation assistant. Beyond basic validation, analyze this data for complex issues:

Data:
${JSON.stringify(data, null, 2)}

Existing Errors:
${JSON.stringify(baseErrors, null, 2)}

Look for additional issues like:
- Unrealistic data patterns
- Business logic violations
- Capacity mismatches
- Skill gap analysis
- Workload distribution issues
- Timeline conflicts

Return additional validation errors:
[
  {
    "type": "validation type",
    "entity": "entity type",
    "entityId": "specific ID",
    "field": "field name",
    "message": "detailed error message",
    "severity": "error|warning|info",
    "suggestion": "how to fix this"
  }
]
`;

    const response = await this.generateContent(prompt);
    try {
      return JSON.parse(response.trim());
    } catch {
      return [];
    }
  }
}

// Singleton instance
let geminiInstance: GeminiAI | null = null;

export function getGeminiInstance(apiKey?: string): GeminiAI {
  if (!geminiInstance) {
    geminiInstance = new GeminiAI(apiKey);
  } else if (apiKey) {
    geminiInstance.initialize(apiKey);
  }
  return geminiInstance;
}