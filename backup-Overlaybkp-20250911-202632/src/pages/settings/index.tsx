import React from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { useAuth } from '@/hooks/use-auth';
import { Layout } from '@/components/layout/layout';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Import settings components using relative import without extension
import AdminSettings from './admin';
import StudentSettings from './student';

export default function SettingsPage() {
  const { t } = useTranslations();
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  // Redirect if user isn't logged in
  if (!user) {
    return null;
  }

  const isAdmin = user.role === 'admin' || user.role === 'manager';

  return (
    <Layout title={t('settings.title')}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">{t('settings.title')}</h1>
          <p className="text-gray-400 mt-2">{t('settings.description')}</p>
        </div>

        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle>{t('settings.preferences')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={isAdmin ? "admin" : "student"}>
              <TabsList className="mb-6 bg-gray-900">
                {isAdmin && <TabsTrigger value="admin">{t('settings.adminSettings')}</TabsTrigger>}
                <TabsTrigger value="student">{t('settings.userSettings')}</TabsTrigger>
              </TabsList>
              
              {isAdmin && (
                <TabsContent value="admin">
                  <AdminSettings />
                </TabsContent>
              )}
              
              <TabsContent value="student">
                <StudentSettings />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}