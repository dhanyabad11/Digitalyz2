'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Brain, 
  Sparkles, 
  Settings, 
  Link, 
  Users, 
  Clock,
  Loader2
} from 'lucide-react';
import { useData } from '@/lib/data-context';
import { getGeminiInstance } from '@/lib/gemini-ai';
import { toast } from 'sonner';

interface RuleForm {
  type: string;
  description: string;
  config: any;
}

export function RuleBuilder() {
  const { state, dispatch } = useData();
  const [activeTab, setActiveTab] = useState('builder');
  const [ruleForm, setRuleForm] = useState<RuleForm>({
    type: '',
    description: '',
    config: {}
  });
  const [naturalLanguageRule, setNaturalLanguageRule] = useState('');
  const [isProcessingNL, setIsProcessingNL] = useState(false);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [recommendedRules, setRecommendedRules] = useState<any[]>([]);

  const ruleTypes = [
    { value: 'coRun', label: 'Co-Run Tasks', description: 'Tasks that must run together' },
    { value: 'slotRestriction', label: 'Slot Restriction', description: 'Minimum shared slots requirement' },
    { value: 'loadLimit', label: 'Load Limit', description: 'Maximum worker load per phase' },
    { value: 'phaseWindow', label: 'Phase Window', description: 'Restrict task to specific phases' },
    { value: 'patternMatch', label: 'Pattern Match', description: 'Rule based on patterns' },
    { value: 'precedence', label: 'Precedence', description: 'Priority and precedence rules' }
  ];

  const addRule = () => {
    if (!ruleForm.type || !ruleForm.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newRule = {
      id: `rule-${Date.now()}`,
      type: ruleForm.type,
      description: ruleForm.description,
      config: ruleForm.config,
      priority: state.rules.length + 1
    };

    dispatch({ type: 'ADD_RULE', payload: newRule });
    setRuleForm({ type: '', description: '', config: {} });
    
    toast.success('Rule added successfully');
  };

  const removeRule = (ruleId: string) => {
    dispatch({ type: 'REMOVE_RULE', payload: ruleId });
    toast.success('Rule removed');
  };

  const processNaturalLanguageRule = async () => {
    if (!naturalLanguageRule.trim()) return;
    
    if (!state.geminiApiKey) {
      toast.error('AI features not enabled', {
        description: 'Please provide a Gemini API key to use natural language rule conversion'
      });
      return;
    }

    setIsProcessingNL(true);
    try {
      const gemini = getGeminiInstance(state.geminiApiKey);
      
      const dataContext = {
        availableTaskIds: state.tasks.map(t => t.TaskID),
        availableWorkerGroups: [...new Set(state.workers.map(w => w.WorkerGroup))],
        availableClientGroups: [...new Set(state.clients.map(c => c.GroupTag))],
        maxPhase: Math.max(...state.workers.flatMap(w => w.AvailableSlots))
      };

      const convertedRule = await gemini.convertNaturalLanguageToRule(naturalLanguageRule, dataContext);
      
      setRuleForm({
        type: convertedRule.type,
        description: convertedRule.description,
        config: convertedRule.config
      });
      
      setActiveTab('builder');
      toast.success('Rule converted successfully', {
        description: 'Review and add the converted rule'
      });
      
    } catch (error) {
      console.error('Rule conversion error:', error);
      toast.error('Rule conversion failed', {
        description: error instanceof Error ? error.message : 'Failed to convert natural language to rule'
      });
    } finally {
      setIsProcessingNL(false);
    }
  };

  const generateRuleRecommendations = async () => {
    if (!state.geminiApiKey) {
      toast.error('AI features not enabled');
      return;
    }

    setIsGeneratingRecommendations(true);
    try {
      const gemini = getGeminiInstance(state.geminiApiKey);
      
      const dataForAnalysis = {
        clients: state.clients,
        workers: state.workers,
        tasks: state.tasks,
        existingRules: state.rules
      };

      const recommendations = await gemini.recommendRules(dataForAnalysis);
      setRecommendedRules(recommendations);
      
      toast.success('Rule recommendations generated', {
        description: `${recommendations.length} rule suggestions available`
      });
      
    } catch (error) {
      console.error('Recommendation error:', error);
      toast.error('Failed to generate recommendations');
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  const addRecommendedRule = (recommendation: any) => {
    const newRule = {
      id: `rule-${Date.now()}`,
      type: recommendation.type,
      description: recommendation.description,
      config: recommendation.config,
      priority: state.rules.length + 1
    };

    dispatch({ type: 'ADD_RULE', payload: newRule });
    toast.success('Recommended rule added');
  };

  const renderRuleConfig = () => {
    switch (ruleForm.type) {
      case 'coRun':
        return (
          <div className="space-y-4">
            <div>
              <Label>Task IDs (comma-separated)</Label>
              <Input
                value={ruleForm.config.tasks?.join(', ') || ''}
                onChange={(e) => setRuleForm({
                  ...ruleForm,
                  config: { ...ruleForm.config, tasks: e.target.value.split(',').map(s => s.trim()) }
                })}
                placeholder="T001, T002, T003"
              />
            </div>
          </div>
        );

      case 'slotRestriction':
        return (
          <div className="space-y-4">
            <div>
              <Label>Group Name</Label>
              <Input
                value={ruleForm.config.group || ''}
                onChange={(e) => setRuleForm({
                  ...ruleForm,
                  config: { ...ruleForm.config, group: e.target.value }
                })}
                placeholder="Enter group name"
              />
            </div>
            <div>
              <Label>Minimum Common Slots</Label>
              <Input
                type="number"
                value={ruleForm.config.minCommonSlots || ''}
                onChange={(e) => setRuleForm({
                  ...ruleForm,
                  config: { ...ruleForm.config, minCommonSlots: parseInt(e.target.value) }
                })}
                placeholder="2"
              />
            </div>
          </div>
        );

      case 'loadLimit':
        return (
          <div className="space-y-4">
            <div>
              <Label>Worker Group</Label>
              <Select
                value={ruleForm.config.workerGroup || ''}
                onValueChange={(value) => setRuleForm({
                  ...ruleForm,
                  config: { ...ruleForm.config, workerGroup: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select worker group" />
                </SelectTrigger>
                <SelectContent>
                  {[...new Set(state.workers.map(w => w.WorkerGroup))].map(group => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Max Slots Per Phase</Label>
              <Input
                type="number"
                value={ruleForm.config.maxSlotsPerPhase || ''}
                onChange={(e) => setRuleForm({
                  ...ruleForm,
                  config: { ...ruleForm.config, maxSlotsPerPhase: parseInt(e.target.value) }
                })}
                placeholder="3"
              />
            </div>
          </div>
        );

      case 'phaseWindow':
        return (
          <div className="space-y-4">
            <div>
              <Label>Task ID</Label>
              <Select
                value={ruleForm.config.taskId || ''}
                onValueChange={(value) => setRuleForm({
                  ...ruleForm,
                  config: { ...ruleForm.config, taskId: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {state.tasks.map(task => (
                    <SelectItem key={task.TaskID} value={task.TaskID}>
                      {task.TaskID} - {task.TaskName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Allowed Phases (comma-separated)</Label>
              <Input
                value={ruleForm.config.allowedPhases?.join(', ') || ''}
                onChange={(e) => setRuleForm({
                  ...ruleForm,
                  config: { 
                    ...ruleForm.config, 
                    allowedPhases: e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
                  }
                })}
                placeholder="1, 2, 3"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
            Select a rule type to configure parameters
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Rule Builder
          </TabsTrigger>
          <TabsTrigger value="natural" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Natural Language
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Business Rule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Rule Type</Label>
                  <Select
                    value={ruleForm.type}
                    onValueChange={(value) => setRuleForm({ ...ruleForm, type: value, config: {} })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rule type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ruleTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Description</Label>
                  <Input
                    value={ruleForm.description}
                    onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                    placeholder="Describe this rule..."
                  />
                </div>
              </div>

              <div>
                <Label>Rule Configuration</Label>
                {renderRuleConfig()}
              </div>

              <Button onClick={addRule} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="natural" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Natural Language Rule Converter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Describe your rule in plain English</Label>
                <Textarea
                  value={naturalLanguageRule}
                  onChange={(e) => setNaturalLanguageRule(e.target.value)}
                  placeholder="Example: Tasks T001 and T002 must always run together in the same phase"
                  rows={4}
                />
              </div>
              
              <Button 
                onClick={processNaturalLanguageRule} 
                disabled={isProcessingNL || !naturalLanguageRule.trim()}
                className="w-full"
              >
                {isProcessingNL ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Brain className="w-4 h-4 mr-2" />
                )}
                Convert to Rule
              </Button>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">Example phrases:</h4>
                <ul className="text-sm space-y-1 text-blue-800">
                  <li>• "Tasks T001 and T002 must run together"</li>
                  <li>• "Limit development team to max 3 slots per phase"</li>
                  <li>• "Task T005 can only run in phases 2, 3, or 4"</li>
                  <li>• "High priority clients should get precedence"</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  AI Rule Recommendations
                </CardTitle>
                <Button 
                  onClick={generateRuleRecommendations}
                  disabled={isGeneratingRecommendations || !state.geminiApiKey}
                >
                  {isGeneratingRecommendations ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate Recommendations
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recommendedRules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recommendations yet. Click "Generate Recommendations" to analyze your data for rule suggestions.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendedRules.map((recommendation, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-purple-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{recommendation.description}</h4>
                          <p className="text-sm text-gray-600 mt-1">{recommendation.reasoning}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{recommendation.type}</Badge>
                            <Badge variant="secondary">
                              Confidence: {Math.round(recommendation.confidence * 100)}%
                            </Badge>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => addRecommendedRule(recommendation)}
                          disabled={recommendation.confidence < 0.6}
                        >
                          Add Rule
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Current Rules */}
      {state.rules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Rules ({state.rules.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {state.rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{rule.type}</Badge>
                      <Badge variant="secondary">Priority {rule.priority}</Badge>
                    </div>
                    <h4 className="font-medium">{rule.description}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Config: {JSON.stringify(rule.config)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeRule(rule.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}