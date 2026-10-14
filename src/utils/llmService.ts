import axios from 'axios';

export interface LLMSuggestion {
  id: string;
  type: 'connection' | 'node' | 'datasource' | 'insight';
  title: string;
  description: string;
  confidence: number; // 0-1
  action?: {
    type: 'add_edge' | 'add_node' | 'load_datasource' | 'update_value';
    payload: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  };
}

export interface GraphAnalysis {
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    value?: number;
    unit?: string;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
  }>;
  domain: string;
}

export interface SuggestionRequest {
  analysis: GraphAnalysis;
  prompt?: string;
  context?: {
    selectedNodeIds?: string[];
    focusArea?: string;
  };
  availableDataSources?: Array<{
    id: string;
    name: string;
    description: string;
    type: string;
  }>;
}

interface LLMResponse {
  suggestions?: SuggestionItem[];
}

interface SuggestionItem {
  id?: string;
  type: string;
  title?: string;
  description?: string;
  confidence?: number;
  action?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export class LLMService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.deepseek.com/v1';
  private model = 'deepseek-chat';

  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getSuggestions(request: SuggestionRequest): Promise<LLMSuggestion[]> {
    if (!this.apiKey) {
      throw new Error('API key not set. Please configure your Deepseek API key.');
    }

    try {
      const prompt = this.buildPrompt(request);
      
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are a systems thinking expert and game development analyst. Analyze the provided system graph and provide actionable suggestions to improve it. Focus on:
1. Identifying missing connections between existing nodes
2. Suggesting relevant new nodes to complete the system
3. Recommending data sources or APIs that could provide real data
4. Offering insights about the system dynamics
5. Domain-specific suggestions for ${request.analysis.domain}

Return your suggestions in JSON format with the structure specified.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      const parsed = JSON.parse(content);
      
      return this.parseSuggestions(parsed, request);
    } catch (error) {
      console.error('LLM API error:', error);
      throw new Error(`Failed to get LLM suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPrompt(request: SuggestionRequest): string {
    const { analysis, prompt: userPrompt, context, availableDataSources } = request;
    
    // Build nodes section
    const nodesText = analysis.nodes.map(node => 
      `- ${node.label} (${node.type})${node.value !== undefined ? `: ${node.value}${node.unit ? ` ${node.unit}` : ''}` : ''}`
    ).join('\n');
    
    // Build edges section
    const edgesText = analysis.edges.map(edge => 
      `- ${edge.source} → ${edge.target}${edge.label ? ` (${edge.label})` : ''}`
    ).join('\n');
    
    // Build context section
    const contextText = [
      context?.selectedNodeIds?.length ? `Selected nodes: ${context.selectedNodeIds.join(', ')}` : 'No specific nodes selected',
      context?.focusArea ? `Focus area: ${context.focusArea}` : ''
    ].filter(Boolean).join('\n');
    
    // Build request section
    let requestSection;
    if (userPrompt) {
      requestSection = `## User Request:\n${userPrompt}`;
    } else {
      requestSection = `## Task:\nProvide suggestions to improve this system graph. Focus on making it more complete, connected, and actionable.`;
    }
    
    // Build available data sources section
    let dataSourcesSection = '';
    if (availableDataSources && availableDataSources.length > 0) {
      const dataSourcesText = availableDataSources.map(ds => 
        `- ${ds.name} (${ds.type}): ${ds.description}`
      ).join('\n');
      dataSourcesSection = `\n\n## Available Data Sources for ${analysis.domain}:\n${dataSourcesText}`;
    }

    const prompt = `Analyze this ${analysis.domain} system graph:

## Current Graph:
Nodes (${analysis.nodes.length}):
${nodesText}

Edges (${analysis.edges.length}):
${edgesText}

## Context:
${contextText}
${dataSourcesSection}

${requestSection}

## Response Format:
Return a JSON object with a "suggestions" array. Each suggestion should have:
- id: unique identifier
- type: "connection", "node", "datasource", or "insight"
- title: short descriptive title
- description: detailed explanation
- confidence: number between 0 and 1
- action: optional object with "type" and "payload" for executable suggestions

For "connection" type, action.payload should have { sourceNodeId, targetNodeId, label }
For "node" type, action.payload should have { type, label, value?, unit? }
For "datasource" type, action.payload should have { name, description, type, config? }
For "insight" type, no action needed

## Important:
1. Be practical and specific
2. Consider the domain context: ${analysis.domain}
3. When suggesting data sources, use the exact names from the "Available Data Sources" list above
4. Suggest 3-5 most impactful suggestions
5. Include confidence scores based on how certain you are`;

    return prompt;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private parseSuggestions(response: LLMResponse, _request: SuggestionRequest): LLMSuggestion[] {
    if (!response.suggestions || !Array.isArray(response.suggestions)) {
      return [];
    }

    return response.suggestions.map((suggestion: SuggestionItem, index: number) => ({
      id: suggestion.id || `suggestion_${Date.now()}_${index}`,
      type: suggestion.type as LLMSuggestion['type'],
      title: suggestion.title || 'Untitled Suggestion',
      description: suggestion.description || '',
      confidence: suggestion.confidence || 0.5,
      action: suggestion.action
    }));
  }

  // Mock implementation for testing
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getMockSuggestions(_request: SuggestionRequest): Promise<LLMSuggestion[]> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    
    const suggestions: LLMSuggestion[] = [
      {
        id: 'mock_1',
        type: 'connection',
        title: 'Connect Player Base to Revenue',
        description: 'The player base node should connect to revenue streams to show how user growth drives income.',
        confidence: 0.9,
        action: {
          type: 'add_edge',
          payload: {
            sourceNodeId: 'player_base',
            targetNodeId: 'revenue_streams',
            label: 'generates'
          }
        }
      },
      {
        id: 'mock_2',
        type: 'node',
        title: 'Add Marketing Budget Node',
        description: 'Consider adding a marketing budget node to model how advertising spend affects player acquisition.',
        confidence: 0.8,
        action: {
          type: 'add_node',
          payload: {
            type: 'stock',
            label: 'Marketing Budget',
            value: 10000,
            unit: 'USD'
          }
        }
      },
      {
        id: 'mock_3',
        type: 'datasource',
        title: 'Steam API Integration',
        description: 'Integrate with Steam API to get real player count and revenue data for your game.',
        confidence: 0.7,
        action: {
          type: 'load_datasource',
           payload: {
             name: 'Steam API',
             description: 'Real-time Steam player and revenue data',
             type: 'api',
             config: { endpoint: 'https://api.steampowered.com' }
           }
        }
      },
      {
        id: 'mock_4',
        type: 'insight',
        title: 'Player Retention Affects Revenue',
        description: 'Your model shows player base but not retention rate. Consider adding retention metrics to better predict long-term revenue.',
        confidence: 0.6
      }
    ];

    return suggestions;
  }
}