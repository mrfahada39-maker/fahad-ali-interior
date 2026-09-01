import { SalesAgent } from './sales-agent';
import { InteriorAgent } from './interior-agent';
import { SupportAgent } from './support-agent';
import { QuoteAgent } from './quote-agent';
import { RecommendationAgent } from './recommendation-agent';
import { AnalyticsAgent } from './analytics-agent';

export type AgentRole = 'sales' | 'interior' | 'support' | 'quote' | 'recommendation' | 'analytics';

export class AgentRouter {
  static routeIntent(query: string, requestedAgent?: string): AgentRole {
    if (requestedAgent && ['sales', 'interior', 'support', 'quote', 'recommendation', 'analytics'].includes(requestedAgent)) {
      return requestedAgent as AgentRole;
    }

    const q = query.toLowerCase();
    if (q.includes('room') || q.includes('color') || q.includes('layout') || q.includes('design') || q.includes('match') || q.includes('fabric')) {
      return 'interior';
    }
    if (q.includes('custom') || q.includes('size') || q.includes('quote') || q.includes('inches') || q.includes('naap')) {
      return 'quote';
    }
    if (q.includes('track') || q.includes('status') || q.includes('delivery') || q.includes('warranty') || q.includes('return')) {
      return 'support';
    }
    if (q.includes('recommend') || q.includes('budget') || q.includes('best') || q.includes('top')) {
      return 'recommendation';
    }
    if (q.includes('report') || q.includes('analytics') || q.includes('sales') || q.includes('revenue') || q.includes('predict')) {
      return 'analytics';
    }

    return 'sales';
  }

  static getSystemPromptForAgent(role: AgentRole, catalogContext: string): string {
    switch (role) {
      case 'interior':
        return InteriorAgent.getPrompt(catalogContext);
      case 'support':
        return SupportAgent.getPrompt(catalogContext);
      case 'quote':
        return QuoteAgent.getPrompt(catalogContext);
      case 'recommendation':
        return RecommendationAgent.getPrompt(catalogContext);
      case 'analytics':
        return AnalyticsAgent.getPrompt(catalogContext);
      case 'sales':
      default:
        return SalesAgent.getPrompt(catalogContext);
    }
  }
}
