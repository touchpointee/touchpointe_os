import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout';
import { HomePage, TasksPage, CrmPage, ChatPage, TeamPage, SettingsPage, ProfilePage, InboxPage } from '@/pages';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { PrivacyPolicy } from '@/pages/public/PrivacyPolicy';
import { TermsOfService } from '@/pages/public/TermsOfService';
import { RoomPage } from './pages/meet/RoomPage';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PublicRoute } from '@/components/auth/PublicRoute';
import { AcceptInvitePage } from '@/pages/auth/AcceptInvitePage';
import AiPage from '@/pages/AiPage';
import { MyTasksPage } from '@/pages/MyTasksPage';
import { MeetingHistoryPage } from './pages/meet/MeetingHistoryPage';
import PublicFormPage from '@/pages/public/PublicFormPage';


import { ToastProvider } from '@/contexts/ToastContext';
import { Toaster } from 'sonner';

function App() {
    return (
        <ThemeProvider>
            <Toaster position="bottom-right" richColors theme="system" />
            <ToastProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={
                            <PublicRoute>
                                <LoginPage />
                            </PublicRoute>
                        } />
                        <Route path="/register" element={
                            <PublicRoute>
                                <RegisterPage />
                            </PublicRoute>
                        } />


                        {/* Invitation Route - Requires Auth but no specific workspace yet */}
                        <Route path="/invite/accept" element={
                            <AuthGuard requireWorkspace={false}>
                                <AcceptInvitePage />
                            </AuthGuard>
                        } />

                        {/* Public Meet Route */}
                        <Route path="/meet/:joinCode" element={<RoomPage />} />


                        {/* Public Form Route */}
                        <Route path="/forms/:token" element={<PublicFormPage />} />

                        {/* Privacy Policy */}
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        {/* Terms of Service */}
                        <Route path="/terms" element={<TermsOfService />} />

                        {/* Protected Routes - Auth + Valid Workspace Required */}
                        <Route path="/home/inbox" element={
                            <AuthGuard>
                                <AppLayout>
                                    <InboxPage />
                                </AppLayout>
                            </AuthGuard>
                        } />
                        <Route path="/" element={
                            <PublicRoute>
                                <HomePage />
                            </PublicRoute>
                        } />
                        {/* <Route path="/workspace/:workspaceId/home" element={
                            <AuthGuard>
                                <AppLayout hideContextSidebar={true}>
                                    <HomePage />
                                </AppLayout>
                            </AuthGuard>
                        } /> */}
                        {/* <Route path="/workspace/:workspaceId/meet" element={
                            <AuthGuard>
                                <AppLayout hideContextSidebar={true}>
                                    <MeetPage />
                                </AppLayout>
                            </AuthGuard>
                        } /> */}
                        <Route path="/meet/history/:meetingId" element={
                            <AuthGuard>
                                <AppLayout hideContextSidebar={true}>
                                    <MeetingHistoryPage />
                                </AppLayout>
                            </AuthGuard>
                        } />
                        <Route path="/my-tasks" element={
                            <AuthGuard>
                                <AppLayout hideContextSidebar={true}>
                                    <MyTasksPage />
                                </AppLayout>
                            </AuthGuard>
                        } />
                        <Route path="/tasks" element={
                            <AuthGuard>
                                <AppLayout>
                                    <TasksPage />
                                </AppLayout>
                            </AuthGuard>
                        } />
                        <Route path="/ai" element={
                            <AuthGuard>
                                <AppLayout hideContextSidebar={true}>
                                    <AiPage />
                                </AppLayout>
                            </AuthGuard>
                        } />
                        <Route path="/tasks/list/:listId" element={
                            <AuthGuard>
                                <AppLayout>
                                    <TasksPage />
                                </AppLayout>
                            </AuthGuard>
                        } />
                        <Route path="/crm/*" element={
                            <AuthGuard>
                                <AppLayout>
                                    <CrmPage />
                                </AppLayout>
                            </AuthGuard>
                        } />
                        <Route path="/workspace/:workspaceId/crm/*" element={
                            <AuthGuard>
                                <AppLayout>
                                    <CrmPage />
                                </AppLayout>
                            </AuthGuard>
                        } />
                        <Route path="/chat" element={
                            <AuthGuard>
                                <AppLayout>
                                    <ChatPage />
                                </AppLayout>
                            </AuthGuard>
                        } />
                        {/* <Route path="/meet" element={
                            <AuthGuard>
                                <AppLayout hideContextSidebar={true}>
                                    <MeetPage />
                                </AppLayout>
                            </AuthGuard>
                        } /> */}
                        <Route path="/chat/channel/:channelId" element={
                            <AuthGuard>
                                <AppLayout>
                                    <ChatPage />
                                </AppLayout>
                            </AuthGuard>
                        } />
                        <Route path="/chat/dm/:dmGroupId" element={
                            <AuthGuard>
                                <AppLayout>
                                    <ChatPage />
                                </AppLayout>
                            </AuthGuard>
                        } />
                        <Route path="/team/*" element={
                            <AuthGuard>
                                <AppLayout hideContextSidebar={true}>
                                    <TeamPage />
                                </AppLayout>
                            </AuthGuard>
                        } />
                        <Route path="/settings/*" element={
                            <AuthGuard>
                                <AppLayout hideContextSidebar={true}>
                                    <SettingsPage />
                                </AppLayout>
                            </AuthGuard>
                        } />
                        <Route path="/profile" element={
                            <AuthGuard>
                                <AppLayout hideContextSidebar={true}>
                                    <ProfilePage />
                                </AppLayout>
                            </AuthGuard>
                        } />

                        {/* Fallback - Redirect unknown routes to root */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </ToastProvider>
        </ThemeProvider>
    );
}

export default App;
