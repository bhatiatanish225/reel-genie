import { useQuery } from "@tanstack/react-query";
import { api, type Reel } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video } from "lucide-react";
import { Link } from "react-router-dom";

export default function Scheduler() {
  const { data } = useQuery({
    queryKey: ["reels"],
    queryFn: () => api.listReels()
  });

  const scheduledReels = data?.items.filter(r => r.status === "scheduled") || [];
  const groupedByDate = scheduledReels.reduce((acc, reel) => {
    if (!reel.scheduled_time) return acc;
    const date = new Date(reel.scheduled_time).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(reel);
    return acc;
  }, {} as Record<string, Reel[]>);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scheduler</h1>
        <p className="text-muted-foreground mt-1">View and manage scheduled reels</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{scheduledReels.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Next 24 Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {scheduledReels.filter(r => {
                if (!r.scheduled_time) return false;
                const scheduledDate = new Date(r.scheduled_time);
                const tomorrow = new Date();
                tomorrow.setHours(tomorrow.getHours() + 24);
                return scheduledDate <= tomorrow;
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Next 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {scheduledReels.filter(r => {
                if (!r.scheduled_time) return false;
                const scheduledDate = new Date(r.scheduled_time);
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                return scheduledDate <= nextWeek;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled reels by date */}
      {Object.keys(groupedByDate).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No scheduled reels yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate)
            .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
            .map(([date, reels]) => (
              <Card key={date}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    {date}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reels
                    .sort((a, b) => {
                      const timeA = a.scheduled_time ? new Date(a.scheduled_time).getTime() : 0;
                      const timeB = b.scheduled_time ? new Date(b.scheduled_time).getTime() : 0;
                      return timeA - timeB;
                    })
                    .map(reel => (
                      <Link 
                        key={reel.id} 
                        to={`/reel/${reel.id}`}
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/5 transition-colors"
                      >
                        {/* Thumbnail */}
                        <div className="w-12 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {reel.thumbnail_url ? (
                            <img 
                              src={reel.thumbnail_url} 
                              alt={reel.prompt}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{reel.prompt}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {reel.duration_seconds}s duration
                          </p>
                        </div>

                        {/* Time */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
                          <Clock className="w-4 h-4" />
                          {reel.scheduled_time && new Date(reel.scheduled_time).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>

                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          Scheduled
                        </Badge>
                      </Link>
                    ))}
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
