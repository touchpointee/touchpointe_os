
export function TermsOfService() {
    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold">Terms of Service</h1>
                <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

                <div className="prose dark:prose-invert">
                    <p>
                        Welcome to Touchpointe. By using our website and services, you agree to comply with and be bound by the following terms and conditions.
                    </p>

                    <h3>1. Acceptance of Terms</h3>
                    <p>
                        By accessing or using our services, you agree to be bound by these Terms of Service and all applicable laws and regulations.
                    </p>

                    <h3>2. Use of Services</h3>
                    <p>
                        You agree to use our services only for lawful purposes and in accordance with these Terms. You are responsible for maintaining the confidentiality of your account credentials.
                    </p>

                    <h3>3. Facebook Integration</h3>
                    <p>
                        Our service integrates with Facebook Lead Ads. By connecting your Facebook account, you grant us permission to access and sync your lead data as described in our Privacy Policy.
                    </p>

                    <h3>4. Termination</h3>
                    <p>
                        We reserve the right to terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever.
                    </p>

                    <h3>5. Contact Us</h3>
                    <p>
                        If you have any questions about these Terms, please contact us at support@touchpointe.digital.
                    </p>
                </div>
            </div>
        </div>
    );
}
