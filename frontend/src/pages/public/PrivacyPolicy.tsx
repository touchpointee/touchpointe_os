
export function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold">Privacy Policy</h1>
                <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

                <div className="prose dark:prose-invert">
                    <p>
                        Touchpointe ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by Touchpointe.
                    </p>

                    <h3>1. Information We Collect</h3>
                    <p>
                        We collect information you provide directly to us, such as when you create an account, connect your Facebook Lead Ads account, or communicate with us. This may include your name, email address, and Facebook Page data required for the integration to function.
                    </p>

                    <h3>2. How We Use Your Information</h3>
                    <p>
                        We use the information we collect to provider, maintain, and improve our services, including syncing your Facebook Leads to your CRM workspace.
                    </p>

                    <h3>3. Data Sharing</h3>
                    <p>
                        We do not share your personal information with third parties except as described in this policy or with your consent.
                    </p>

                    <h3>4. Contact Us</h3>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at support@touchpointe.digital.
                    </p>
                </div>
            </div>
        </div>
    );
}
