import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Plus, DollarSign, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { BudgetCategory, BudgetItem } from "@shared/schema";

interface BudgetPlannerProps {
  weddingId: number;
  className?: string;
}

export function BudgetPlanner({ weddingId, className = '' }: BudgetPlannerProps) {
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newItemOpen, setNewItemOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch budget categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<BudgetCategory[]>({
    queryKey: ['/api/budget/categories', weddingId],
  });

  // Fetch budget items
  const { data: items = [], isLoading: itemsLoading } = useQuery<BudgetItem[]>({
    queryKey: ['/api/budget/items', weddingId],
  });

  // Calculate totals
  const totalEstimated = categories.reduce((sum: number, cat: BudgetCategory) => sum + cat.estimatedCost, 0);
  const totalActual = categories.reduce((sum: number, cat: BudgetCategory) => sum + cat.actualCost, 0);
  const totalPaid = categories.filter((cat: BudgetCategory) => cat.isPaid).reduce((sum: number, cat: BudgetCategory) => sum + cat.actualCost, 0);
  const budgetProgress = totalEstimated > 0 ? (totalActual / totalEstimated) * 100 : 0;

  // Create category mutation
  const createCategory = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/budget/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, weddingId })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budget/categories', weddingId] });
      setNewCategoryOpen(false);
      toast({ title: "Category created", description: "Budget category added successfully!" });
    }
  });

  // Update category mutation
  const updateCategory = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await fetch(`/api/budget/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budget/categories', weddingId] });
      toast({ title: "Category updated", description: "Budget category updated successfully!" });
    }
  });

  const handleCategorySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      estimatedCost: parseInt(formData.get('estimatedCost') as string),
      priority: formData.get('priority') as string,
      notes: formData.get('notes') as string,
    };
    createCategory.mutate(data);
  };

  const togglePaidStatus = (category: BudgetCategory) => {
    updateCategory.mutate({
      id: category.id,
      isPaid: !category.isPaid
    });
  };

  const updateActualCost = (category: BudgetCategory, actualCost: number) => {
    updateCategory.mutate({
      id: category.id,
      actualCost
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (categoriesLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#D4B08C]" />
            Budget Overview
          </CardTitle>
          <CardDescription>
            Track your wedding expenses in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Estimated Budget</p>
              <p className="text-2xl font-bold text-blue-600">${totalEstimated.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">Actual Spent</p>
              <p className="text-2xl font-bold text-orange-600">${totalActual.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Amount Paid</p>
              <p className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Budget Progress</span>
              <span className={budgetProgress > 100 ? 'text-red-600' : 'text-green-600'}>
                {budgetProgress.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={Math.min(budgetProgress, 100)} 
              className="h-3"
            />
            {budgetProgress > 100 && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                Over budget by ${(totalActual - totalEstimated).toLocaleString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Budget Categories */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Budget Categories</h3>
        <Dialog open={newCategoryOpen} onOpenChange={setNewCategoryOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#D4B08C] hover:bg-[#C09E7A]">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Budget Category</DialogTitle>
              <DialogDescription>
                Create a new category to organize your wedding expenses
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name</Label>
                <Input 
                  id="name"
                  name="name"
                  placeholder="e.g., Venue, Catering, Photography"
                  required
                />
              </div>
              <div>
                <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
                <Input 
                  id="estimatedCost"
                  name="estimatedCost"
                  type="number"
                  min="0"
                  placeholder="5000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority" defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes"
                  name="notes"
                  placeholder="Additional notes about this category..."
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#D4B08C] hover:bg-[#C09E7A]"
                disabled={createCategory.isPending}
              >
                {createCategory.isPending ? 'Creating...' : 'Create Category'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4">
        {categories.map((category: BudgetCategory) => {
          const categoryProgress = category.estimatedCost > 0 ? (category.actualCost / category.estimatedCost) * 100 : 0;
          
          return (
            <Card key={category.id} className="transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-lg">{category.name}</h4>
                    <Badge className={`mt-1 ${getPriorityColor(category.priority)}`}>
                      {category.priority} priority
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Actual Cost</p>
                      <Input
                        type="number"
                        value={category.actualCost}
                        onChange={(e) => updateActualCost(category, parseInt(e.target.value) || 0)}
                        className="w-24 text-right"
                        min="0"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={category.isPaid}
                        onCheckedChange={() => togglePaidStatus(category)}
                      />
                      {category.isPaid ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <div className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Budget: ${category.estimatedCost.toLocaleString()}</span>
                    <span className={categoryProgress > 100 ? 'text-red-600' : 'text-gray-600'}>
                      ${category.actualCost.toLocaleString()} ({categoryProgress.toFixed(0)}%)
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(categoryProgress, 100)} 
                    className="h-2"
                  />
                </div>

                {category.notes && (
                  <p className="text-sm text-gray-600 mt-3 italic">
                    {category.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {categories.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No budget categories yet</h3>
            <p className="text-gray-600 mb-4">
              Start organizing your wedding budget by creating your first category
            </p>
            <Button 
              onClick={() => setNewCategoryOpen(true)}
              className="bg-[#D4B08C] hover:bg-[#C09E7A]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Category
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}