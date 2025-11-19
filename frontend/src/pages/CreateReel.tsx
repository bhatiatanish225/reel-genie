import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type CreateReelRequest, type BatchCreateRequest } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles, Calendar as CalendarIcon, Upload, Plus, X } from "lucide-react";

export default function CreateReel() {
  const [mode, setMode] = useState<"single" | "batch">("single");
  
  // Single mode state
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState<"15" | "30" | "60">("30");
  const [voice, setVoice] = useState("female_alloy");
  const [musicMood, setMusicMood] = useState("calm_upbeat");
  const [postNow, setPostNow] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");

  // Batch mode state
  const [batchPrompts, setBatchPrompts] = useState<string[]>([""]);
  const [batchDuration, setBatchDuration] = useState<"15" | "30" | "60">("30");
  const [batchVoice, setBatchVoice] = useState("female_alloy");
  const [batchMusicMood, setBatchMusicMood] = useState("calm_upbeat");
  const [batchScheduleTime, setBatchScheduleTime] = useState("");
  const [csvContent, setCsvContent] = useState("");

  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateReelRequest) => api.createReel(data),
    onSuccess: (reel) => {
      toast({
        title: "Reel created successfully!",
        description: "Your reel is now being generated.",
      });
      queryClient.invalidateQueries({ queryKey: ["reels"] });
      navigate(`/reel/${reel.id}`);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to create reel",
        description: "Please try again.",
      });
    },
  });

  const batchMutation = useMutation({
    mutationFn: (data: BatchCreateRequest) => api.createBatch(data),
    onSuccess: (result) => {
      toast({
        title: `Batch created successfully!`,
        description: `${result.created_count} reels are now being generated.`,
      });
      queryClient.invalidateQueries({ queryKey: ["reels"] });
      navigate("/");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to create batch",
        description: "Please try again.",
      });
    },
  });

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast({
        variant: "destructive",
        title: "Prompt required",
        description: "Please enter a topic or prompt for your reel.",
      });
      return;
    }

    const data: CreateReelRequest = {
      prompt: prompt.trim(),
      duration_seconds: parseInt(duration) as 15 | 30 | 60,
      voice,
      music_mood: musicMood,
      post_now: postNow,
      ...(scheduleEnabled && scheduledTime ? { scheduled_time: new Date(scheduledTime).toISOString() } : {}),
    };

    createMutation.mutate(data);
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let prompts = batchPrompts.filter(p => p.trim());
    
    // Parse CSV if provided
    if (csvContent.trim()) {
      const lines = csvContent.trim().split('\n').map(l => l.trim()).filter(l => l);
      prompts = [...prompts, ...lines];
    }

    if (prompts.length === 0) {
      toast({
        variant: "destructive",
        title: "No prompts provided",
        description: "Please enter at least one prompt.",
      });
      return;
    }

    if (prompts.length > 10) {
      toast({
        variant: "destructive",
        title: "Too many prompts",
        description: "Maximum 10 prompts per batch.",
      });
      return;
    }

    const data: BatchCreateRequest = {
      items: prompts.map(p => ({
        prompt: p,
        duration_seconds: parseInt(batchDuration) as 15 | 30 | 60,
        voice: batchVoice
      })),
      global_options: {
        music_mood: batchMusicMood,
        post_now: false,
        ...(batchScheduleTime ? { scheduled_time: new Date(batchScheduleTime).toISOString() } : {})
      }
    };

    batchMutation.mutate(data);
  };

  const addBatchPrompt = () => {
    if (batchPrompts.length < 10) {
      setBatchPrompts([...batchPrompts, ""]);
    }
  };

  const removeBatchPrompt = (index: number) => {
    setBatchPrompts(batchPrompts.filter((_, i) => i !== index));
  };

  const updateBatchPrompt = (index: number, value: string) => {
    const updated = [...batchPrompts];
    updated[index] = value;
    setBatchPrompts(updated);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Reel</h1>
        <p className="text-muted-foreground mt-1">Generate AI-powered Instagram Reels</p>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="single">Single Reel</TabsTrigger>
          <TabsTrigger value="batch">Batch Generation</TabsTrigger>
        </TabsList>

        {/* Single Mode */}
        <TabsContent value="single">
          <form onSubmit={handleSingleSubmit}>
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Reel Configuration
                </CardTitle>
                <CardDescription>
                  Provide details for your AI-generated reel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">
                    Topic / Prompt <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder="E.g., 'Financial literacy tips for college students'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Duration */}
                <div className="space-y-3">
                  <Label>Duration</Label>
                  <RadioGroup value={duration} onValueChange={(v) => setDuration(v as any)}>
                    <div className="grid grid-cols-3 gap-3">
                      {[["15", "Quick"], ["30", "Standard"], ["60", "Extended"]].map(([val, label]) => (
                        <label key={val} className="cursor-pointer">
                          <div className="border-2 rounded-lg p-4 text-center hover:border-primary transition-colors">
                            <RadioGroupItem value={val} id={`dur-${val}`} className="sr-only" />
                            <div className="font-semibold">{val}s</div>
                            <div className="text-xs text-muted-foreground mt-1">{label}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                {/* Voice & Music */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="voice">Voice</Label>
                    <Select value={voice} onValueChange={setVoice}>
                      <SelectTrigger id="voice">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female_alloy">Female - Alloy</SelectItem>
                        <SelectItem value="male_echo">Male - Echo</SelectItem>
                        <SelectItem value="female_nova">Female - Nova</SelectItem>
                        <SelectItem value="male_onyx">Male - Onyx</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="music">Music Mood</Label>
                    <Select value={musicMood} onValueChange={setMusicMood}>
                      <SelectTrigger id="music">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="calm_upbeat">Calm & Upbeat</SelectItem>
                        <SelectItem value="energetic">Energetic</SelectItem>
                        <SelectItem value="chill">Chill</SelectItem>
                        <SelectItem value="dramatic">Dramatic</SelectItem>
                        <SelectItem value="inspiring">Inspiring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Scheduling */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="post-now">Post Immediately</Label>
                      <p className="text-xs text-muted-foreground">
                        Post to Instagram as soon as generation completes
                      </p>
                    </div>
                    <Switch
                      id="post-now"
                      checked={postNow}
                      onCheckedChange={(checked) => {
                        setPostNow(checked);
                        if (checked) setScheduleEnabled(false);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="schedule">Schedule for Later</Label>
                      <p className="text-xs text-muted-foreground">
                        Set a specific time to post this reel
                      </p>
                    </div>
                    <Switch
                      id="schedule"
                      checked={scheduleEnabled}
                      onCheckedChange={(checked) => {
                        setScheduleEnabled(checked);
                        if (checked) setPostNow(false);
                      }}
                    />
                  </div>

                  {scheduleEnabled && (
                    <div className="space-y-2 animate-fade-in">
                      <Label htmlFor="schedule-time">
                        <CalendarIcon className="w-4 h-4 inline mr-2" />
                        Schedule Date & Time
                      </Label>
                      <Input
                        id="schedule-time"
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  )}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full gradient-primary"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Reel
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Batch Mode */}
        <TabsContent value="batch">
          <form onSubmit={handleBatchSubmit}>
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Batch Generation
                </CardTitle>
                <CardDescription>
                  Create up to 10 reels at once with individual or shared settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* CSV Upload */}
                <div className="space-y-2">
                  <Label htmlFor="csv-input">Upload CSV or Paste Prompts</Label>
                  <Textarea
                    id="csv-input"
                    placeholder="Paste CSV content here (one prompt per line)&#10;E.g.:&#10;Financial tips for students&#10;Productivity hacks for remote work&#10;Healthy breakfast ideas"
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    rows={4}
                    className="resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Or enter prompts individually below
                  </p>
                </div>

                {/* Individual Prompts */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Individual Prompts</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addBatchPrompt}
                      disabled={batchPrompts.length >= 10}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Prompt
                    </Button>
                  </div>
                  {batchPrompts.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder={`Prompt ${i + 1}`}
                        value={p}
                        onChange={(e) => updateBatchPrompt(i, e.target.value)}
                      />
                      {batchPrompts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBatchPrompt(i)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Shared Settings */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Shared Settings</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Select value={batchDuration} onValueChange={(v) => setBatchDuration(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 seconds</SelectItem>
                          <SelectItem value="30">30 seconds</SelectItem>
                          <SelectItem value="60">60 seconds</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Voice</Label>
                      <Select value={batchVoice} onValueChange={setBatchVoice}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="female_alloy">Female - Alloy</SelectItem>
                          <SelectItem value="male_echo">Male - Echo</SelectItem>
                          <SelectItem value="female_nova">Female - Nova</SelectItem>
                          <SelectItem value="male_onyx">Male - Onyx</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Music Mood</Label>
                      <Select value={batchMusicMood} onValueChange={setBatchMusicMood}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="calm_upbeat">Calm & Upbeat</SelectItem>
                          <SelectItem value="energetic">Energetic</SelectItem>
                          <SelectItem value="chill">Chill</SelectItem>
                          <SelectItem value="dramatic">Dramatic</SelectItem>
                          <SelectItem value="inspiring">Inspiring</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="batch-schedule">Schedule All (Optional)</Label>
                      <Input
                        id="batch-schedule"
                        type="datetime-local"
                        value={batchScheduleTime}
                        onChange={(e) => setBatchScheduleTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full gradient-primary"
                  disabled={batchMutation.isPending}
                >
                  {batchMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Batch...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Generate Batch
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
