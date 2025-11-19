import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Instagram, CheckCircle2, XCircle, Music, Mic, Clock, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DAYS_OF_WEEK = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

export default function Settings() {
  const [isConnected, setIsConnected] = useState(false);
  const [defaultVoice, setDefaultVoice] = useState("female_alloy");
  const [defaultMusic, setDefaultMusic] = useState("calm_upbeat");
  
  // Auto-post settings
  const [autoPostEnabled, setAutoPostEnabled] = useState(false);
  const [autoPostTime, setAutoPostTime] = useState("09:00");
  const [autoPostDays, setAutoPostDays] = useState<string[]>(["mon", "wed", "fri"]);
  
  const { toast } = useToast();

  const toggleDay = (day: string) => {
    if (autoPostDays.includes(day)) {
      setAutoPostDays(autoPostDays.filter(d => d !== day));
    } else {
      setAutoPostDays([...autoPostDays, day]);
    }
  };

  const saveAutoPostSettings = () => {
    if (autoPostEnabled && autoPostDays.length === 0) {
      toast({
        variant: "destructive",
        title: "Select at least one day",
        description: "Please select at least one day for auto-posting.",
      });
      return;
    }

    toast({
      title: "Settings saved",
      description: autoPostEnabled 
        ? `Auto-posting enabled for ${autoPostDays.length} days at ${autoPostTime}`
        : "Auto-posting disabled",
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Instagram Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="w-5 h-5" />
            Instagram Connection
          </CardTitle>
          <CardDescription>
            Connect your Instagram Business account to enable auto-posting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full gradient-secondary flex items-center justify-center">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-medium">Instagram Business</div>
                <div className="text-sm text-muted-foreground">
                  {isConnected ? "@your_account" : "Not connected"}
                </div>
              </div>
            </div>
            {isConnected ? (
              <Badge variant="secondary" className="bg-success/10 text-success">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                <XCircle className="w-3 h-3 mr-1" />
                Disconnected
              </Badge>
            )}
          </div>

          {!isConnected && (
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium mb-2">To connect Instagram:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Ensure you have an Instagram Business account</li>
                  <li>Connect your Business account to a Facebook Page</li>
                  <li>Click "Connect Instagram" below to authorize access</li>
                </ol>
              </div>
              <Button 
                className="w-full gradient-primary"
                onClick={() => setIsConnected(true)}
              >
                Connect Instagram
              </Button>
            </div>
          )}

          {isConnected && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsConnected(false)}
            >
              Disconnect
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Auto-Post Settings */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Daily Auto-Post
          </CardTitle>
          <CardDescription>
            Automatically post reels at scheduled times throughout the week
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="space-y-0.5">
              <Label htmlFor="auto-post-enabled" className="text-base">Enable Auto-Posting</Label>
              <p className="text-sm text-muted-foreground">
                Automatically post ready reels at specified times
              </p>
            </div>
            <Switch
              id="auto-post-enabled"
              checked={autoPostEnabled}
              onCheckedChange={setAutoPostEnabled}
            />
          </div>

          {autoPostEnabled && (
            <div className="space-y-6 animate-fade-in">
              {/* Time Selection */}
              <div className="space-y-2">
                <Label htmlFor="auto-post-time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Posting Time
                </Label>
                <Input
                  id="auto-post-time"
                  type="time"
                  value={autoPostTime}
                  onChange={(e) => setAutoPostTime(e.target.value)}
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Time is in your local timezone
                </p>
              </div>

              {/* Days Selection */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Active Days
                </Label>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <Button
                      key={day.value}
                      type="button"
                      variant={autoPostDays.includes(day.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDay(day.value)}
                      className="w-full"
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected: {autoPostDays.length === 0 ? "None" : autoPostDays.length === 7 ? "Every day" : `${autoPostDays.length} days`}
                </p>
              </div>

              {/* Summary */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium mb-2">Auto-Post Summary</p>
                <p className="text-sm text-muted-foreground">
                  {autoPostDays.length > 0 ? (
                    <>
                      Reels will be automatically posted on{" "}
                      <span className="font-medium text-foreground">
                        {autoPostDays.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(", ")}
                      </span>
                      {" "}at{" "}
                      <span className="font-medium text-foreground">{autoPostTime}</span>
                    </>
                  ) : (
                    "Select at least one day to enable auto-posting"
                  )}
                </p>
              </div>

              {/* Save Button */}
              <Button 
                onClick={saveAutoPostSettings}
                className="w-full gradient-primary"
              >
                Save Auto-Post Settings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TTS Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Text-to-Speech Settings
          </CardTitle>
          <CardDescription>
            Choose your preferred voice for generated reels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-voice">Default Voice</Label>
            <Select value={defaultVoice} onValueChange={setDefaultVoice}>
              <SelectTrigger id="default-voice">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female_alloy">Female - Alloy</SelectItem>
                <SelectItem value="male_echo">Male - Echo</SelectItem>
                <SelectItem value="female_nova">Female - Nova</SelectItem>
                <SelectItem value="male_onyx">Male - Onyx</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              You can override this for individual reels
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Music Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Music Preferences
          </CardTitle>
          <CardDescription>
            Set your default background music mood
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-music">Default Music Mood</Label>
            <Select value={defaultMusic} onValueChange={setDefaultMusic}>
              <SelectTrigger id="default-music">
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
        </CardContent>
      </Card>
    </div>
  );
}
