import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Instagram, CheckCircle2, XCircle, Music, Mic } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function Settings() {
  const [isConnected, setIsConnected] = useState(false);
  const [defaultVoice, setDefaultVoice] = useState("female_alloy");
  const [defaultMusic, setDefaultMusic] = useState("calm_upbeat");

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
