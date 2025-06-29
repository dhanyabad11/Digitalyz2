'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Sliders, 
  Target, 
  TrendingUp,
  Save,
  RotateCcw
} from 'lucide-react';
import { useData } from '@/lib/data-context';
import { toast } from 'sonner';

const PRIORITY_CRITERIA = [
  {
    key: 'priorityLevel',
    label: 'Client Priority Level',
    description: 'Weight given to high-priority clients',
    color: 'bg-red-500'
  },
  {
    key: 'requestFulfillment',
    label: 'Request Fulfillment',
    description: 'Importance of satisfying client requests',
    color: 'bg-blue-500'
  },
  {
    key: 'fairness',
    label: 'Fairness Distribution',
    description: 'Equal treatment across clients and workers',
    color: 'bg-green-500'
  },
  {
    key: 'efficiency',
    label: 'Resource Efficiency',
    description: 'Optimal utilization of worker capacity',
    color: 'bg-purple-500'
  },
  {
    key: 'skillMatch',
    label: 'Skill Matching',
    description: 'Quality of skill-task alignment',
    color: 'bg-orange-500'
  }
];

const PRESET_PROFILES = [
  {
    name: 'Maximize Fulfillment',
    description: 'Focus on satisfying as many client requests as possible',
    weights: {
      priorityLevel: 0.15,
      requestFulfillment: 0.4,
      fairness: 0.2,
      efficiency: 0.15,
      skillMatch: 0.1
    }
  },
  {
    name: 'Fair Distribution',
    description: 'Ensure equal treatment and balanced workload',
    weights: {
      priorityLevel: 0.1,
      requestFulfillment: 0.2,
      fairness: 0.4,
      efficiency: 0.2,
      skillMatch: 0.1
    }
  },
  {
    name: 'Priority First',
    description: 'Heavily favor high-priority clients',
    weights: {
      priorityLevel: 0.5,
      requestFulfillment: 0.2,
      fairness: 0.1,
      efficiency: 0.1,
      skillMatch: 0.1
    }
  },
  {
    name: 'Efficiency Focused',
    description: 'Optimize for maximum resource utilization',
    weights: {
      priorityLevel: 0.1,
      requestFulfillment: 0.2,
      fairness: 0.15,
      efficiency: 0.4,
      skillMatch: 0.15
    }
  }
];

export function PrioritizationPanel() {
  const { state, dispatch } = useData();
  const [activeTab, setActiveTab] = useState('sliders');
  const [tempWeights, setTempWeights] = useState(state.priorities);

  const updateWeight = (key: string, value: number) => {
    setTempWeights(prev => ({ ...prev, [key]: value }));
  };

  const normalizeWeights = () => {
    const total = Object.values(tempWeights).reduce((sum, weight) => sum + weight, 0);
    if (total === 0) return;
    
    const normalized = Object.fromEntries(
      Object.entries(tempWeights).map(([key, weight]) => [key, weight / total])
    );
    setTempWeights(normalized);
  };

  const saveWeights = () => {
    normalizeWeights();
    dispatch({ type: 'SET_PRIORITIES', payload: tempWeights });
    toast.success('Priority weights saved successfully');
  };

  const resetWeights = () => {
    const defaultWeights = {
      priorityLevel: 0.3,
      requestFulfillment: 0.25,
      fairness: 0.2,
      efficiency: 0.15,
      skillMatch: 0.1,
    };
    setTempWeights(defaultWeights);
    toast.info('Weights reset to default values');
  };

  const applyPreset = (preset: typeof PRESET_PROFILES[0]) => {
    setTempWeights(preset.weights);
    toast.success(`Applied "${preset.name}" preset`);
  };

  const totalWeight = Object.values(tempWeights).reduce((sum, weight) => sum + weight, 0);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sliders" className="flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            Weight Sliders
          </TabsTrigger>
          <TabsTrigger value="presets" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Preset Profiles
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Impact Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sliders" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Priority Weights Configuration</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetWeights}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button size="sm" onClick={saveWeights}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Total Weight Indicator */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Total Weight</span>
                  <Badge variant={Math.abs(totalWeight - 1) < 0.01 ? 'default' : 'destructive'}>
                    {(totalWeight * 100).toFixed(1)}%
                  </Badge>
                </div>
                <Progress value={totalWeight * 100} className="h-2" />
                {Math.abs(totalWeight - 1) > 0.01 && (
                  <p className="text-sm text-orange-600 mt-2">
                    Weights should sum to 100%. Click "Normalize" or adjust manually.
                  </p>
                )}
              </div>

              {/* Weight Sliders */}
              <div className="space-y-6">
                {PRIORITY_CRITERIA.map((criterion) => (
                  <div key={criterion.key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">{criterion.label}</Label>
                        <p className="text-sm text-gray-600">{criterion.description}</p>
                      </div>
                      <Badge variant="outline">
                        {(tempWeights[criterion.key] * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded ${criterion.color}`} />
                      <Slider
                        value={[tempWeights[criterion.key]]}
                        onValueChange={([value]) => updateWeight(criterion.key, value)}
                        max={1}
                        step={0.01}
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={normalizeWeights} variant="outline" className="w-full">
                Normalize Weights to 100%
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presets" className="space-y-6">
          <div className="grid gap-4">
            {PRESET_PROFILES.map((preset, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{preset.name}</h3>
                      <p className="text-gray-600 mb-4">{preset.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(preset.weights).map(([key, weight]) => {
                          const criterion = PRIORITY_CRITERIA.find(c => c.key === key);
                          return (
                            <div key={key} className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded ${criterion?.color}`} />
                              <span className="text-sm">{criterion?.label}</span>
                              <Badge variant="outline" className="text-xs">
                                {(weight * 100).toFixed(0)}%
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <Button onClick={() => applyPreset(preset)}>
                      Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Priority Impact Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Visual Weight Distribution */}
              <div>
                <h4 className="font-medium mb-4">Current Weight Distribution</h4>
                <div className="space-y-3">
                  {PRIORITY_CRITERIA.map((criterion) => (
                    <div key={criterion.key} className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded ${criterion.color}`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{criterion.label}</span>
                          <span className="text-sm">{(state.priorities[criterion.key] * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={state.priorities[criterion.key] * 100} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Impact Predictions */}
              <div className="grid gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">High Priority Impact</h4>
                  <p className="text-sm text-blue-800">
                    With current weights, high-priority clients will receive{' '}
                    <strong>{(state.priorities.priorityLevel * 100).toFixed(0)}%</strong> preference
                    in allocation decisions.
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Fairness Balance</h4>
                  <p className="text-sm text-green-800">
                    Fairness weight of <strong>{(state.priorities.fairness * 100).toFixed(0)}%</strong>{' '}
                    {state.priorities.fairness > 0.3 ? 'ensures balanced' : 'allows flexible'} 
                    {' '}distribution across clients and workers.
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Efficiency Focus</h4>
                  <p className="text-sm text-purple-800">
                    Resource efficiency at <strong>{(state.priorities.efficiency * 100).toFixed(0)}%</strong>{' '}
                    {state.priorities.efficiency > 0.25 ? 'prioritizes optimal' : 'allows flexible'} 
                    {' '}worker utilization.
                  </p>
                </div>
              </div>

              {/* Recommendations */}
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-900 mb-2">Recommendations</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  {state.priorities.priorityLevel > 0.4 && (
                    <li>• Consider reducing priority weight to improve fairness</li>
                  )}
                  {state.priorities.fairness < 0.15 && (
                    <li>• Increase fairness weight to ensure balanced allocation</li>
                  )}
                  {state.priorities.efficiency < 0.1 && (
                    <li>• Consider increasing efficiency weight to optimize resource usage</li>
                  )}
                  {state.priorities.skillMatch < 0.05 && (
                    <li>• Increase skill matching weight for better task-worker alignment</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}