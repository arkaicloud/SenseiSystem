import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Trophy, Calendar, Star, RefreshCw, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalLogins: number;
  lastLoginDate: string | null;
  recentAchievements: Achievement[];
}

interface Achievement {
  id: number;
  achievementType: string;
  achievementName: string;
  achievementDescription: string;
  streakCount: number;
  iconName: string;
  iconColor: string;
  earnedDate: string;
  isDisplayed: boolean;
}

interface DailyLoginRecord {
  id: number;
  loginDate: string;
  loginCount: number;
  streakDay: number;
  bonusPoints: number;
}

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'flame': return Flame;
    case 'trophy': return Trophy;
    case 'refresh-cw': return RefreshCw;
    case 'star': return Star;
    case 'zap': return Zap;
    default: return Calendar;
  }
};

const StreakTracker = () => {
  const [showAchievements, setShowAchievements] = useState(false);
  const queryClient = useQueryClient();

  // Fetch streak stats
  const { data: stats } = useQuery<StreakStats>({
    queryKey: ["/api/streak/stats"],
    refetchInterval: 60000 // Refetch every minute
  });

  // Fetch achievements
  const { data: achievementsData } = useQuery<{ achievements: Achievement[] }>({
    queryKey: ["/api/streak/achievements"],
    enabled: showAchievements
  });

  // Fetch unread achievements
  const { data: unreadData } = useQuery<{ achievements: Achievement[] }>({
    queryKey: ["/api/streak/achievements/unread"]
  });

  // Fetch login history
  const { data: historyData } = useQuery({
    queryKey: ["/api/streak/history?days=7"]
  });

  // Mark achievement as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (achievementId: number) => {
      const response = await fetch(`/api/streak/achievements/${achievementId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to mark achievement as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/streak/achievements/unread"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streak/achievements"] });
    }
  });

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-orange-500";
    if (streak >= 14) return "text-red-500";
    if (streak >= 7) return "text-yellow-500";
    if (streak >= 3) return "text-blue-500";
    return "text-gray-500";
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return "🔥";
    if (streak >= 14) return "🚀";
    if (streak >= 7) return "⚡";
    if (streak >= 3) return "✨";
    return "📅";
  };

  return (
    <div className="space-y-4">
      {/* Main Streak Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flame className={cn("h-5 w-5", getStreakColor(stats?.currentStreak || 0))} />
                Sequência de Login
              </CardTitle>
              <CardDescription>
                Mantenha sua disciplina fazendo login todos os dias
              </CardDescription>
            </div>
            {unreadData?.achievements && unreadData.achievements.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {unreadData.achievements.length} Novo{unreadData.achievements.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="relative space-y-4">
          {/* Current Streak Display */}
          <div className="text-center">
            <div className="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
              <span className={getStreakColor(stats?.currentStreak || 0)}>
                {stats?.currentStreak || 0}
              </span>
              <span className="text-2xl">{getStreakEmoji(stats?.currentStreak || 0)}</span>
            </div>
            <p className="text-muted-foreground">
              {stats?.currentStreak === 1 ? 'dia consecutivo' : 'dias consecutivos'}
            </p>
            {stats?.currentStreak && stats.currentStreak >= 3 && (
              <p className="text-sm text-muted-foreground mt-1">
                Continue assim! Você está construindo um ótimo hábito.
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">
                {stats?.longestStreak || 0}
              </div>
              <p className="text-sm text-muted-foreground">Maior Sequência</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats?.totalLogins || 0}
              </div>
              <p className="text-sm text-muted-foreground">Total de Logins</p>
            </div>
          </div>

          {/* Recent Login History */}
          <div>
            <h4 className="text-sm font-medium mb-2">Últimos 7 dias</h4>
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, index) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - index));
                const hasLogin = historyData?.records ? 
                  historyData.records.some((r: any) => 
                    new Date(r.loginDate).toDateString() === date.toDateString()
                  ) : false;
                  
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex-1 aspect-square rounded-md flex items-center justify-center text-xs",
                      hasLogin 
                        ? "bg-green-500 text-white" 
                        : "bg-muted text-muted-foreground"
                    )}
                    title={`${date.toLocaleDateString()} ${hasLogin ? '✓' : '✗'}`}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Achievements Button */}
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setShowAchievements(!showAchievements)}
          >
            <Trophy className="h-4 w-4 mr-2" />
            {showAchievements ? 'Ocultar' : 'Ver'} Conquistas
            {unreadData?.achievements && unreadData.achievements.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadData.achievements.length}
              </Badge>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <AnimatePresence>
        {showAchievements && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Suas Conquistas</CardTitle>
                <CardDescription>
                  Marcos alcançados em sua jornada de constância
                </CardDescription>
              </CardHeader>
              <CardContent>
                {achievementsData?.achievements && achievementsData.achievements.length > 0 ? (
                  <div className="space-y-3">
                    {achievementsData.achievements.map((achievement) => {
                      const IconComponent = getIconComponent(achievement.iconName);
                      const isUnread = unreadData?.achievements?.some(a => a.id === achievement.id);
                      
                      return (
                        <motion.div
                          key={achievement.id}
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border",
                            isUnread 
                              ? "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800" 
                              : "bg-muted/50"
                          )}
                        >
                          <div 
                            className="p-2 rounded-full"
                            style={{ backgroundColor: `${achievement.iconColor}20` }}
                          >
                            <IconComponent 
                              className="h-5 w-5" 
                              style={{ color: achievement.iconColor }}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium">{achievement.achievementName}</h5>
                              {isUnread && (
                                <Badge variant="destructive" className="text-xs">
                                  Novo!
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {achievement.achievementDescription}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Conquistado em {new Date(achievement.earnedDate).toLocaleDateString()}
                            </p>
                          </div>
                          {isUnread && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsReadMutation.mutate(achievement.id)}
                              disabled={markAsReadMutation.isPending}
                            >
                              Marcar como lida
                            </Button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma conquista ainda</p>
                    <p className="text-sm">Continue fazendo login para desbloquear conquistas!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unread Achievements Popup */}
      <AnimatePresence>
        {unreadData?.achievements && unreadData.achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Card className="w-80 border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-orange-700 dark:text-orange-300 flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Nova Conquista!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {unreadData.achievements.slice(0, 2).map((achievement) => {
                  const IconComponent = getIconComponent(achievement.iconName);
                  return (
                    <div key={achievement.id} className="flex items-center gap-2">
                      <IconComponent 
                        className="h-4 w-4" 
                        style={{ color: achievement.iconColor }}
                      />
                      <div>
                        <p className="font-medium text-sm">{achievement.achievementName}</p>
                        <p className="text-xs text-muted-foreground">
                          {achievement.achievementDescription}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <Button
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setShowAchievements(true)}
                >
                  Ver Todas as Conquistas
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StreakTracker;