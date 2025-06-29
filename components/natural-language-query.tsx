'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Brain, Loader2 } from 'lucide-react';
import { useData } from '@/lib/data-context';
import { getGeminiInstance } from '@/lib/gemini-ai';
import { toast } from 'sonner';

export function NaturalLanguageQuery() {
  const { state } = useData();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [lastQuery, setLastQuery] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    if (!state.geminiApiKey) {
      toast.error('AI features not enabled', {
        description: 'Please provide a Gemini API key to use natural language queries'
      });
      return;
    }

    setIsLoading(true);
    try {
      const gemini = getGeminiInstance(state.geminiApiKey);
      
      // Create data structure for AI
      const dataStructure = {
        clients: state.clients.slice(0, 3), // Sample data for AI to understand structure
        workers: state.workers.slice(0, 3),
        tasks: state.tasks.slice(0, 3)
      };

      const parsedQuery = await gemini.parseNaturalLanguageQuery(query, dataStructure);
      
      // Apply filters based on parsed query
      let filteredResults: any[] = [];
      
      if (parsedQuery.entity === 'clients') {
        filteredResults = filterData(state.clients, parsedQuery.filters);
      } else if (parsedQuery.entity === 'workers') {
        filteredResults = filterData(state.workers, parsedQuery.filters);
      } else if (parsedQuery.entity === 'tasks') {
        filteredResults = filterData(state.tasks, parsedQuery.filters);
      }

      setResults(filteredResults);
      setLastQuery(query);
      
      toast.success(`Found ${filteredResults.length} results`, {
        description: `Searched ${parsedQuery.entity} with ${parsedQuery.filters.length} filter(s)`
      });
      
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed', {
        description: error instanceof Error ? error.message : 'Failed to process natural language query'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterData = (data: any[], filters: any[]) => {
    return data.filter(item => {
      return filters.every(filter => {
        const value = item[filter.field];
        
        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'contains':
            if (Array.isArray(value)) {
              return value.some(v => String(v).toLowerCase().includes(String(filter.value).toLowerCase()));
            }
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'greaterThan':
            return Number(value) > Number(filter.value);
          case 'lessThan':
            return Number(value) < Number(filter.value);
          case 'in':
            return Array.isArray(filter.value) ? filter.value.includes(value) : value === filter.value;
          default:
            return true;
        }
      });
    });
  };

  const exampleQueries = [
    "Show me all high priority clients",
    "Find workers with AI skills available in phase 2",
    "Tasks with duration more than 2 phases",
    "Workers in the development group",
    "Clients requesting task T001",
    "Tasks requiring Python and SQL skills"
  ];

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Ask anything about your data in plain English..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="text-base"
          />
        </div>
        <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Search
        </Button>
      </div>

      {/* Example Queries */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Try these examples:</h3>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => setQuery(example)}
              className="text-xs"
            >
              {example}
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Results for "{lastQuery}"
            </h3>
            <Badge variant="secondary">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          
          <div className="grid gap-4">
            {results.map((item, index) => (
              <Card key={index} className="border border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">
                      {item.ClientName || item.WorkerName || item.TaskName}
                    </h4>
                    <Badge variant="outline">
                      {item.ClientID && 'Client'}
                      {item.WorkerID && 'Worker'}
                      {item.TaskID && 'Task'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                    {Object.entries(item)
                      .filter(([key]) => !key.startsWith('_') && key !== 'AttributesJSON')
                      .slice(0, 6)
                      .map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium">{key}:</span>{' '}
                          <span>
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {lastQuery && results.length === 0 && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-gray-500">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No results found for "{lastQuery}"</p>
            <p className="text-sm mt-1">Try rephrasing your query or use one of the examples above</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}