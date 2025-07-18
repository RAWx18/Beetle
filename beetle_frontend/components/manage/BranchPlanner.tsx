import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Clock, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BranchPlannerProps {
  branch: string;
}

interface Task {
  id: number;
  title: string;
  assignee: string;
  stageId: string;
}

const stageConfig = [
  {
    id: 'planning',
    name: 'Planning',
    icon: <Calendar className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800',
  },
  {
    id: 'in-progress',
    name: 'In Progress',
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-yellow-100 text-yellow-800',
  },
  {
    id: 'review',
    name: 'Under Review',
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'bg-orange-100 text-orange-800',
  },
  {
    id: 'completed',
    name: 'Completed',
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800',
  },
];

const BranchPlanner = ({ branch }: BranchPlannerProps) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStage, setNewTaskStage] = useState('planning');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [showReviewConfirmation, setShowReviewConfirmation] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ task: Task; targetStage: string } | null>(null);

  const storageKey = `beetle-planner-${branch}`;

  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem(storageKey);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error("Failed to load tasks from localStorage", error);
      setTasks([]);
    }
  }, [branch, storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    } catch (error) {
      console.error("Failed to save tasks to localStorage", error);
    }
  }, [tasks, storageKey]);

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !user) return;
    const newTask: Task = {
      id: Date.now(),
      title: newTaskTitle.trim(),
      assignee: user.login || 'current_user',
      stageId: newTaskStage,
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setNewTaskStage('planning');
    setAddTaskDialogOpen(false);
  };

  const handleDeleteTask = (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverStage(null);
  };

  const canDropOnStage = (targetStageId: string) => {
    if (!draggedTask) return false;
    
    // Can always move to completed
    if (targetStageId === 'completed') return true;
    
    // Can move between planning and in-progress easily
    if (targetStageId === 'planning' || targetStageId === 'in-progress') {
      return draggedTask.stageId === 'planning' || draggedTask.stageId === 'in-progress';
    }
    
    // Can move to review from any stage except completed
    if (targetStageId === 'review') {
      return draggedTask.stageId !== 'completed';
    }
    
    return false;
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    setDragOverStage(null);
    
    if (!draggedTask) return;
    
    // If moving to review, show confirmation
    if (targetStageId === 'review') {
      setPendingMove({ task: draggedTask, targetStage: targetStageId });
      setShowReviewConfirmation(true);
      setDraggedTask(null);
      return;
    }
    
    // Direct move for other stages
    if (canDropOnStage(targetStageId)) {
      setTasks(tasks.map(task => 
        task.id === draggedTask.id 
          ? { ...task, stageId: targetStageId }
          : task
      ));
    }
    
    setDraggedTask(null);
  };

  const handleConfirmReviewMove = () => {
    if (pendingMove) {
      setTasks(tasks.map(task => 
        task.id === pendingMove.task.id 
          ? { ...task, stageId: pendingMove.targetStage }
          : task
      ));
    }
    setShowReviewConfirmation(false);
    setPendingMove(null);
  };

  const handleCancelReviewMove = () => {
    setShowReviewConfirmation(false);
    setPendingMove(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverStage(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-end mb-4">
        <Dialog open={isAddTaskDialogOpen} onOpenChange={setAddTaskDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a new task to your plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Task title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
              <Select value={newTaskStage} onValueChange={setNewTaskStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a stage" />
                </SelectTrigger>
                <SelectContent>
                  {stageConfig.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddTaskDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddTask}>Add Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {stageConfig.map((stage) => {
          const stageTasks = tasks.filter(task => task.stageId === stage.id);
          const isDragOver = dragOverStage === stage.id;
          const canDrop = canDropOnStage(stage.id);
          
          return (
            <Card 
              key={stage.id} 
              className={`h-fit transition-all duration-200 ${
                isDragOver && canDrop 
                  ? stage.id === 'review' 
                    ? 'ring-2 ring-orange-500 bg-orange-50' 
                    : stage.id === 'completed'
                      ? 'ring-2 ring-green-500 bg-green-50'
                      : 'ring-2 ring-blue-500 bg-blue-50'
                  : isDragOver 
                    ? 'ring-2 ring-gray-300' 
                    : ''
              }`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  {stage.icon}
                  {stage.name}
                  <Badge variant="secondary" className="ml-auto">
                    {stageTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stageTasks.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 border rounded-md hover:bg-muted/50 group transition-all duration-200 ${
                      draggedTask?.id === item.id ? 'opacity-50' : ''
                    }`}
                    draggable={item.stageId !== 'completed'}
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium mb-2 pr-2">{item.title}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteTask(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        @{item.assignee}
                      </span>
                      <Badge className={stage.color} variant="outline">
                        {stage.name}
                      </Badge>
                    </div>
                  </div>
                ))}
                {stageTasks.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    {canDrop && isDragOver ? (
                      <div className={`font-medium ${
                        stage.id === 'review' ? 'text-orange-600' :
                        stage.id === 'completed' ? 'text-green-600' :
                        'text-blue-600'
                      }`}>
                        {stage.id === 'review' ? 'Drop here to review' :
                         stage.id === 'completed' ? 'Drop here to complete' :
                         'Drop here'}
                      </div>
                    ) : (
                      <div>No tasks in this stage.</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={showReviewConfirmation} onOpenChange={setShowReviewConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Review?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move "{pendingMove?.task.title}" to the Under Review stage? 
              This indicates the task is ready for review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelReviewMove}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReviewMove}>Move to Review</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BranchPlanner;