import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type CreateReelRequest } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles, Calendar as CalendarIcon } from "lucide-react";

export default function CreateReel() {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState<"15" | "30" | "60">("30");
  const [voice, setVoice] = useState("female_alloy");
  const [musicMood, setMusicMood] = useState("calm_upbeat");
  const [postNow, setPostNow] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Reel</h1>
        <p className="text-muted-foreground mt-1">Generate an AI-powered Instagram Reel</p>
      </div>

      <form onSubmit={handleSubmit}>
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
              <p className="text-xs text-muted-foreground">
                Describe the topic or theme for your reel
              </p>
            </div>

            {/* Duration */}
            <div className="space-y-3">
              <Label>Duration</Label>
              <RadioGroup value={duration} onValueChange={(v) => setDuration(v as any)}>
                <div className="grid grid-cols-3 gap-3">
                  <label className="cursor-pointer">
                    <div className="border-2 rounded-lg p-4 text-center hover:border-primary transition-colors">
                      <RadioGroupItem value="15" id="dur-15" className="sr-only" />
                      <div className="font-semibold">15s</div>
                      <div className="text-xs text-muted-foreground mt-1">Quick</div>
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <div className="border-2 rounded-lg p-4 text-center hover:border-primary transition-colors">
                      <RadioGroupItem value="30" id="dur-30" className="sr-only" />
                      <div className="font-semibold">30s</div>
                      <div className="text-xs text-muted-foreground mt-1">Standard</div>
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <div className="border-2 rounded-lg p-4 text-center hover:border-primary transition-colors">
                      <RadioGroupItem value="60" id="dur-60" className="sr-only" />
                      <div className="font-semibold">60s</div>
                      <div className="text-xs text-muted-foreground mt-1">Extended</div>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </div>

            {/* Voice */}
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

            {/* Music Mood */}
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

            {/* Post Options */}
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
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                size="lg"
                className="flex-1 gradient-primary"
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
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
