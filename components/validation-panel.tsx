'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  RefreshCw, 
  Brain,
  Lightbulb,
  Loader2
} from 'lucide-react';
import { useData } from '@/lib/data-context';
import { ValidationEngine } from '@/lib/validation-engine';
import { getGeminiInstance } from '@/lib/gemini-ai';
import { toast } from 'sonner';

export function ValidationPanel() {
  const { state, dispatch } = useData();
  const [isValidating, setIsValidating] = useState(false);
  const [aiValidating, setAiValidating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [validationProgress, setValidationProgress] = useState(0);

  useEffect(() => {
    if (state.clients.length > 0 || state.workers.length > 0 || state.tasks.length > 0) {
      runValidation();
    }
  }, [state.clients, state.workers, state.tasks]);

  const runValidation = async () => {
    setIsValidating(true);
    setValidationProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setValidationProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const engine = new ValidationEngine();
      engine.setData(state.clients, state.workers, state.tasks);
      
      const errors = engine.validateAll();
      dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors });
      
      clearInterval(progressInterval);
      setValidationProgress(100);
      
      setTimeout(() => setValidationProgress(0), 1000);
      
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Validation failed', {
        description: 'An error occurred during validation'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const runAiValidation = async () => {
    if (!state.geminiApiKey) {
      toast.error('AI features not enabled', {
        description: 'Please provide a Gemini API key to use AI validation'
      });
      return;
    }

    setAiValidating(true);
    try {
      const gemini = getGeminiInstance(state.geminiApiKey);
      
      const dataForAI = {
        clients: state.clients,
        workers: state.workers,
        tasks: state.tasks
      };

      const aiErrors = await gemini.enhancedDataValidation(dataForAI, state.validationErrors);
      
      // Merge AI errors with existing errors
      const allErrors = [...state.validationErrors, ...aiErrors];
      dispatch({ type: 'SET_VALIDATION_ERRORS', payload: allErrors });
      
      toast.success('AI validation completed', {
        description: `Found ${aiErrors.length} additional insights`
      });
      
    } catch (error) {
      console.error('AI validation error:', error);
      toast.error('AI validation failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setAiValidating(false);
    }
  };

  const generateCorrections = async () => {
    if (!state.geminiApiKey) {
      toast.error('AI features not enabled');
      return;
    }

    try {
      const gemini = getGeminiInstance(state.geminiApiKey);
      const suggestions = await gemini.suggestDataCorrections(
        { clients: state.clients, workers: state.workers, tasks: state.tasks },
        state.validationErrors
      );
      
      setAiSuggestions(suggestions);
      toast.success('AI suggestions generated', {
        description: `${suggestions.length} correction suggestions available`
      });
      
    } catch (error) {
      toast.error('Failed to generate corrections');
    }
  };

  const applySuggestion = (suggestion: any) => {
    // This would apply the AI suggestion to the data
    toast.success('Suggestion applied', {
      description: suggestion.suggestion
    });
  };

  const errorsByType = state.validationErrors.reduce((acc, error) => {
    acc[error.severity] = (acc[error.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalErrors = state.validationErrors.length;
  const criticalErrors = errorsByType.error || 0;
  const warnings = errorsByType.warning || 0;
  const infos = errorsByType.info || 0;

  return (
    <div className="space-y-6">
      {/* Validation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{totalErrors}</div>
            <div className="text-sm text-gray-600">Total Issues</div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{criticalErrors}</div>
            <div className="text-sm text-red-700">Errors</div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{warnings}</div>
            <div className="text-sm text-orange-700">Warnings</div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{infos}</div>
            <div className="text-sm text-blue-700">Info</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={runValidation} 
          disabled={isValidating}
          className="flex items-center gap-2"
        >
          {isValidating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Run Validation
        </Button>
        
        <Button 
          onClick={runAiValidation} 
          disabled={aiValidating || !state.geminiApiKey}
          variant="outline"
          className="flex items-center gap-2"
        >
          {aiValidating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Brain className="w-4 h-4" />
          )}
          AI Enhanced Validation
        </Button>
        
        <Button 
          onClick={generateCorrections}
          disabled={!state.geminiApiKey || totalErrors === 0}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Lightbulb className="w-4 h-4" />
          Generate Corrections
        </Button>
      </div>

      {/* Progress Bar */}
      {validationProgress > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Validation Progress</span>
            <span>{validationProgress}%</span>
          </div>
          <Progress value={validationProgress} className="h-2" />
        </div>
      )}

      {/* Overall Status */}
      {totalErrors === 0 && !isValidating && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All validations passed! Your data is ready for rule configuration and export.
          </AlertDescription>
        </Alert>
      )}

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI Correction Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiSuggestions.map((suggestion, index) => (
              <div key={index} className="p-4 border rounded-lg bg-purple-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{suggestion.suggestion}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Suggested value: <code className="bg-white px-1 rounded">{suggestion.newValue}</code>
                    </p>
                    <Badge variant="outline" className="mt-2">
                      Confidence: {Math.round(suggestion.confidence * 100)}%
                    </Badge>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => applySuggestion(suggestion)}
                    disabled={suggestion.confidence < 0.7}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Validation Errors List */}
      {state.validationErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {state.validationErrors.map((error) => (
                <div
                  key={error.id}
                  className={`
                    p-4 rounded-lg border-l-4 ${
                      error.severity === 'error'
                        ? 'border-red-500 bg-red-50'
                        : error.severity === 'warning'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-blue-500 bg-blue-50'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {error.severity === 'error' && <XCircle className="w-5 h-5 text-red-500 mt-0.5" />}
                    {error.severity === 'warning' && <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />}
                    {error.severity === 'info' && <Info className="w-5 h-5 text-blue-500 mt-0.5" />}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {error.entity}
                        </Badge>
                        <span className="text-sm font-medium">{error.entityId}</span>
                        <span className="text-xs text-gray-500">({error.field})</span>
                      </div>
                      <p className="text-sm">{error.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}