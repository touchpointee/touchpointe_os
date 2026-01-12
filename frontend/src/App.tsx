import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout';
import { HomePage, TasksPage, CrmPage, ChatPage, TeamPage, SettingsPage, ProfilePage, InboxPage } from '@/pages';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PublicRoute } from '@/components/auth/PublicRoute';
import { AcceptInvitePage } from '@/pages/auth/AcceptInvitePage';
import AiPage from '@/pages/AiPage';

import { ToastProvider } from '@/contexts/ToastContext';

function App() {
    return (
        <ThemeProvider>
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

                        {/* Protected Routes - Auth + Valid Workspace Required */}
                        <Route path="/home/inbox" element={
                            <AuthGuard>
                                <AppLayout>
                                    <InboxPage />
                                </AppLayout>
                            </AuthGuard>
                        } />
                        <Route path="/home/*" element={
                            <AuthGuard>
                                <AppLayout hideContextSidebar={true}>
                                    <HomePage />
                                </AppLayout>
                            </AuthGuard>
                        } />
                        <Route path="/workspace/:workspaceId/home" element={
                            <AuthGuard>
                                <AppLayout hideContextSidebar={true}>
                                    <HomePage />
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
                                <AppLayout>
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
                        <Route path="/chat/*" element={
                            <AuthGuard>
                                <AppLayout>
                                    <ChatPage />
                                </AppLayout>
                            </AuthGuard>
                        } />
                        <Route path="/team/*" element={
                            <AuthGuard>
                                <AppLayout>
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
                                <AppLayout>
                                    <ProfilePage />
                                </AppLayout>
                            </AuthGuard>
                        } />

                        {/* Root Redirect - Go to home, AuthGuard handles the rest */}
                        <Route path="/" element={<Navigate to="/home" replace />} />
                        <Route path="*" element={<Navigate to="/home" replace />} />
                    </Routes>
                </BrowserRouter>
            </ToastProvider>
        </ThemeProvider>
    );
}

export default App;
