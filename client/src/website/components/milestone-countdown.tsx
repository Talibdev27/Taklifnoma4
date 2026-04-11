import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { calculateWeddingCountdown } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Trophy, CheckCircle, Clock, Plus, Sparkles, Star } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface MilestoneCountdownProps {
  targetDate: Date | string;
  weddingTime?: string;
  timezone?: string;
  weddingId?: number;
  className?: string;
}

export function MilestoneCountdown({ 
  targetDate, 
  weddingTime = '16:00',
  timezone = 'Asia/Tashkent',
  weddingId, 
  className = '' 
}: MilestoneCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => 
    calculateWeddingCountdown(targetDate, weddingTime, timezone)
  );
  const [newMilestoneOpen, setNewMilestoneOpen] = useState(false);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateWeddingCountdown(targetDate, weddingTime, timezone));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, weddingTime, timezone]);

  // Mock milestones data for now
  const [milestones, setMilestones] = useState([
    {
      id: 1,
      title: "Book the Venue",
      description: "Find and reserve the perfect wedding venue",
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isCompleted: false,
      celebrationMessage: "🎉 Venue booked! Your dream location is secured!"
    },
    {
      id: 2,
      title: "Send Invitations",
      description: "Design and send wedding invitations to guests",
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      isCompleted: false,
      celebrationMessage: "📨 Invitations sent! Your guests will be thrilled!"
    },
    {
      id: 3,
      title: "Choose Wedding Dress",
      description: "Find the perfect wedding dress",
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isCompleted: true,
      celebrationMessage: "👗 Perfect dress found! You'll look stunning!"
    }
  ]);

  // Calculate wedding progress
  const weddingDate = new Date(targetDate);
  const now = new Date();
  const totalDays = Math.ceil((weddingDate.getTime() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.ceil((weddingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const progress = Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100));

  const completedMilestones = milestones.filter(m => m.isCompleted).length;
  const totalMilestonesCount = milestones.length;
  const milestoneProgress = totalMilestonesCount > 0 ? (completedMilestones / totalMilestonesCount) * 100 : 0;

  // Get upcoming milestones (next 3)
  const upcomingMilestones = milestones
    .filter(m => !m.isCompleted && new Date(m.targetDate) >= now)
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
    .slice(0, 3);

  const handleMilestoneSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newMilestone = {
      id: Date.now(),
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      targetDate: new Date(formData.get('targetDate') as string),
      isCompleted: false,
      celebrationMessage: formData.get('celebrationMessage') as string || "🎉 Milestone completed!"
    };
    
    setMilestones(prev => [...prev, newMilestone]);
    setNewMilestoneOpen(false);
    toast({ title: "Milestone added!", description: "Your wedding milestone has been created." });
  };

  const completeMilestone = (milestoneId: number) => {
    const milestone = milestones.find(m => m.id === milestoneId);
    if (milestone) {
      setMilestones(prev => 
        prev.map(m => m.id === milestoneId ? { ...m, isCompleted: true } : m)
      );
      
      setCelebrationMessage(milestone.celebrationMessage);
      setCelebrationVisible(true);
      setTimeout(() => setCelebrationVisible(false), 4000);
      
      toast({ 
        title: "🎉 Milestone completed!", 
        description: milestone.celebrationMessage
      });
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Celebration Animation */}
      {celebrationVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-gradient-to-r from-[#D4B08C] to-[#89916B] text-white px-8 py-6 rounded-lg shadow-xl animate-bounce max-w-md text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 animate-spin" />
              <Star className="h-8 w-8 animate-pulse" />
              <Sparkles className="h-6 w-6 animate-spin" />
            </div>
            <div className="text-lg font-bold mb-2">Milestone Completed!</div>
            <div className="text-sm">{celebrationMessage}</div>
          </div>
        </div>
      )}

      {/* Main Countdown */}
      <Card className="text-center bg-gradient-to-br from-[#F8F1F1] to-white border-[#D4B08C]/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-playfair font-bold text-[#2C3338] flex items-center justify-center gap-2">
            <Clock className="h-6 w-6 text-[#D4B08C]" />
            Countdown to Your Special Day
          </CardTitle>
          <CardDescription className="text-[#2C3338]/70 text-lg">
            {daysLeft > 0 ? `${daysLeft} days until your wedding!` : 'Your wedding day is here! 💕'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-lg mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6 border border-[#D4B08C]/20 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="text-4xl font-bold text-[#D4B08C] animate-pulse">{timeLeft.days}</div>
              <div className="text-sm text-[#2C3338] uppercase tracking-wide font-medium">Days</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 border border-[#D4B08C]/20 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="text-4xl font-bold text-[#D4B08C]">{timeLeft.hours}</div>
              <div className="text-sm text-[#2C3338] uppercase tracking-wide font-medium">Hours</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 border border-[#D4B08C]/20 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="text-4xl font-bold text-[#D4B08C]">{timeLeft.minutes}</div>
              <div className="text-sm text-[#2C3338] uppercase tracking-wide font-medium">Minutes</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 border border-[#D4B08C]/20 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="text-4xl font-bold text-[#D4B08C]">{timeLeft.seconds}</div>
              <div className="text-sm text-[#2C3338] uppercase tracking-wide font-medium">Seconds</div>
            </div>
          </div>

          {/* Wedding Progress */}
          <div className="space-y-3 bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between text-sm text-[#2C3338] font-medium">
              <span>Wedding Planning Progress</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-4" />
            <p className="text-xs text-[#2C3338]/60 text-center">
              Time is flying! Keep up the great progress! ✨
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Milestones Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-[#2C3338] flex items-center gap-2">
              <Trophy className="h-6 w-6 text-[#D4B08C]" />
              Wedding Milestones
            </h3>
            <p className="text-sm text-[#2C3338]/70">
              {completedMilestones} of {totalMilestonesCount} milestones completed
            </p>
          </div>
          <Dialog open={newMilestoneOpen} onOpenChange={setNewMilestoneOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#D4B08C] hover:bg-[#C09E7A] shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Wedding Milestone</DialogTitle>
                <DialogDescription>
                  Create a milestone to track your wedding planning progress and celebrate achievements!
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleMilestoneSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Milestone Title</Label>
                  <Input 
                    id="title"
                    name="title"
                    placeholder="e.g., Book the venue, Send invitations"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description"
                    name="description"
                    placeholder="Details about this milestone..."
                  />
                </div>
                <div>
                  <Label htmlFor="targetDate">Target Date</Label>
                  <Input 
                    id="targetDate"
                    name="targetDate"
                    type="date"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="celebrationMessage">Celebration Message</Label>
                  <Input 
                    id="celebrationMessage"
                    name="celebrationMessage"
                    placeholder="Custom message when completed (optional)"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-[#D4B08C] hover:bg-[#C09E7A]"
                >
                  Create Milestone
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Milestone Progress */}
        {totalMilestonesCount > 0 && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Overall Milestone Progress</span>
                  <span>{milestoneProgress.toFixed(0)}%</span>
                </div>
                <Progress value={milestoneProgress} className="h-3" />
                <p className="text-xs text-center text-gray-600">
                  {completedMilestones > 0 ? "Fantastic progress! 🎉" : "Ready to start achieving milestones? 🚀"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Milestones */}
        {upcomingMilestones.length > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#D4B08C]" />
                Upcoming Milestones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingMilestones.map((milestone) => {
                const daysUntilMilestone = Math.ceil((new Date(milestone.targetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={milestone.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-[#F8F1F1] to-white rounded-lg border border-[#D4B08C]/10 hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#2C3338]">{milestone.title}</h4>
                      {milestone.description && (
                        <p className="text-sm text-[#2C3338]/70 mt-1">{milestone.description}</p>
                      )}
                      <Badge variant="outline" className="mt-2">
                        {daysUntilMilestone > 0 ? `${daysUntilMilestone} days remaining` : 'Due today!'}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => completeMilestone(milestone.id)}
                      className="bg-[#89916B] hover:bg-[#7A8760] text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Completed Milestones */}
        {completedMilestones > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-green-600" />
                Completed Milestones ({completedMilestones})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {milestones
                  .filter(m => m.isCompleted)
                  .map((milestone) => (
                    <div key={milestone.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-[#2C3338] font-medium">{milestone.title}</span>
                      <Badge className="bg-green-100 text-green-800 ml-auto">✓ Completed</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {totalMilestonesCount === 0 && (
          <Card className="text-center py-12 shadow-md">
            <CardContent>
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Trophy className="h-16 w-16 text-[#D4B08C]" />
                  <Sparkles className="h-6 w-6 text-[#89916B] absolute -top-1 -right-1 animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#2C3338]">Ready to Set Some Goals?</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create milestones to track your wedding planning progress and celebrate each achievement along the way! 
                Make your journey memorable with small victories! 🎉
              </p>
              <Button 
                onClick={() => setNewMilestoneOpen(true)}
                className="bg-[#D4B08C] hover:bg-[#C09E7A] shadow-md px-8 py-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Milestone
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}