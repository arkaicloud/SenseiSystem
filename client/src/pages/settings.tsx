import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/lib/theme";
import { useTranslation } from "react-i18next";

const Settings: React.FC = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [language, setLanguage] = useState(i18n.language);
  const [backupFrequency, setBackupFrequency] = useState("weekly");
  const [exportFormat, setExportFormat] = useState("csv");
  const [customWaiver, setCustomWaiver] = useState(
    "I, the undersigned, hereby acknowledge the inherent risks of participating in martial arts training and competitions. I assume full responsibility for my actions and any injuries that may occur during training."
  );

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  // Mock user ID for demonstration (would come from auth context in a real app)
  const userId = 1;

  // Save settings mutation
  const { mutate: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: async (data: any) => {
      // In a real app, this would save to an API endpoint
      return new Promise((resolve) => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      toast({
        title: t('success'),
        description: t('settingsSaved'),
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: `${t('failedToSave')}: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    const settings = {
      emailNotifications,
      smsNotifications,
      language,
      backupFrequency,
      exportFormat,
      customWaiver,
    };
    saveSettings(settings);
  };

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description: "Your data is being exported. This may take a moment.",
    });
    // In a real app, this would trigger a data export
  };

  const handleBackupData = () => {
    toast({
      title: "Backup Started",
      description: "Your data is being backed up. This may take a moment.",
    });
    // In a real app, this would trigger a data backup
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-primary">{t('settingsTitle')}</h1>
          <p className="text-gray-600">{t('configurePreferences')}</p>
        </div>
        <Button
          className="mt-4 md:mt-0 bg-secondary hover:bg-secondary-dark text-white"
          onClick={handleSaveSettings}
          disabled={isSaving}
        >
          {isSaving ? t('saving') : t('saveSettings')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{t('themeSettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">{t('theme')}</Label>
                <div className="flex items-center space-x-2">
                  <Select
                    value={theme}
                    onValueChange={(value) => setTheme(value as "light" | "dark")}
                  >
                    <SelectTrigger id="theme" className="w-full">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t('light')}</SelectItem>
                      <SelectItem value="dark">{t('dark')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">{t('language')}</Label>
                <div className="flex items-center space-x-2">
                  <Select
                    value={language}
                    onValueChange={handleLanguageChange}
                  >
                    <SelectTrigger id="language" className="w-full">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="pt">Português (BR)</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{t('notificationSettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">{t('emailNotifications')}</Label>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sms-notifications">{t('smsNotifications')}</Label>
                <Switch
                  id="sms-notifications"
                  checked={smsNotifications}
                  onCheckedChange={setSmsNotifications}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="general">
                <TabsList className="mb-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="backups">Backups & Export</TabsTrigger>
                  <TabsTrigger value="customization">Customization</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-md font-medium mb-2">Attendance Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="check-in-window">Check-in Window</Label>
                          <Select defaultValue="15">
                            <SelectTrigger id="check-in-window">
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 minutes</SelectItem>
                              <SelectItem value="10">10 minutes</SelectItem>
                              <SelectItem value="15">15 minutes</SelectItem>
                              <SelectItem value="30">30 minutes</SelectItem>
                              <SelectItem value="60">1 hour</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500">
                            How early students can check in before class
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="late-threshold">Late Threshold</Label>
                          <Select defaultValue="10">
                            <SelectTrigger id="late-threshold">
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 minutes</SelectItem>
                              <SelectItem value="10">10 minutes</SelectItem>
                              <SelectItem value="15">15 minutes</SelectItem>
                              <SelectItem value="30">30 minutes</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500">
                            When a student is marked as late
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-md font-medium mb-2">Belt Promotion Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="min-classes-white-blue">White to Blue Belt</Label>
                          <Select defaultValue="100">
                            <SelectTrigger id="min-classes-white-blue">
                              <SelectValue placeholder="Minimum classes" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="50">50 classes</SelectItem>
                              <SelectItem value="75">75 classes</SelectItem>
                              <SelectItem value="100">100 classes</SelectItem>
                              <SelectItem value="150">150 classes</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500">
                            Minimum classes needed
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="min-time-white-blue">Time as White Belt</Label>
                          <Select defaultValue="12">
                            <SelectTrigger id="min-time-white-blue">
                              <SelectValue placeholder="Minimum time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="6">6 months</SelectItem>
                              <SelectItem value="9">9 months</SelectItem>
                              <SelectItem value="12">12 months</SelectItem>
                              <SelectItem value="18">18 months</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500">
                            Minimum time requirement
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-md font-medium mb-2">Payment Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="payment-reminder">Payment Reminders</Label>
                          <Select defaultValue="7">
                            <SelectTrigger id="payment-reminder">
                              <SelectValue placeholder="Days before" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">3 days before</SelectItem>
                              <SelectItem value="5">5 days before</SelectItem>
                              <SelectItem value="7">7 days before</SelectItem>
                              <SelectItem value="14">14 days before</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500">
                            When to send payment reminders
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="grace-period">Grace Period</Label>
                          <Select defaultValue="5">
                            <SelectTrigger id="grace-period">
                              <SelectValue placeholder="Days after" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">No grace period</SelectItem>
                              <SelectItem value="3">3 days</SelectItem>
                              <SelectItem value="5">5 days</SelectItem>
                              <SelectItem value="7">7 days</SelectItem>
                              <SelectItem value="14">14 days</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500">
                            Days after due date before marking as overdue
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="backups">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-md font-medium mb-2">Backup Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="backup-frequency">Backup Frequency</Label>
                          <Select
                            value={backupFrequency}
                            onValueChange={setBackupFrequency}
                          >
                            <SelectTrigger id="backup-frequency">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="manual">Manual only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="backup-retention">Backup Retention</Label>
                          <Select defaultValue="3">
                            <SelectTrigger id="backup-retention">
                              <SelectValue placeholder="Select retention" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 month</SelectItem>
                              <SelectItem value="3">3 months</SelectItem>
                              <SelectItem value="6">6 months</SelectItem>
                              <SelectItem value="12">12 months</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          onClick={handleBackupData}
                          className="w-full md:w-auto"
                        >
                          <span className="material-icons mr-1 text-sm">backup</span>
                          Backup Now
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-md font-medium mb-2">Export Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="export-format">Export Format</Label>
                          <Select
                            value={exportFormat}
                            onValueChange={setExportFormat}
                          >
                            <SelectTrigger id="export-format">
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="csv">CSV</SelectItem>
                              <SelectItem value="excel">Excel</SelectItem>
                              <SelectItem value="json">JSON</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          onClick={handleExportData}
                          className="w-full md:w-auto"
                        >
                          <span className="material-icons mr-1 text-sm">download</span>
                          Export Data
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="customization">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-md font-medium mb-2">Legal Documents</h3>
                      <div className="space-y-2">
                        <Label htmlFor="waiver-text">Waiver Text</Label>
                        <Textarea
                          id="waiver-text"
                          placeholder="Enter your waiver text here"
                          rows={6}
                          value={customWaiver}
                          onChange={(e) => setCustomWaiver(e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                          This waiver will be presented to new students during registration
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-md font-medium mb-2">Branding</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="school-name">School Name</Label>
                          <Select defaultValue="school">
                            <SelectTrigger id="school-name">
                              <SelectValue placeholder="Select display" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="school">School Name Only</SelectItem>
                              <SelectItem value="system">SenseiSystem</SelectItem>
                              <SelectItem value="both">School Name - SenseiSystem</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500">
                            How to display your school name
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="logo-position">Logo Position</Label>
                          <Select defaultValue="left">
                            <SelectTrigger id="logo-position">
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500">
                            Position of your logo in the header
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Settings;
