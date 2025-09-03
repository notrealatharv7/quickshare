import { Header } from '@/components/header';
import { ReceiveForm } from '@/components/receive-form';
import { SendForm } from '@/components/send-form';

export default function Home() {
  return (
    <div className="flex flex-col min-h-dvh bg-background font-body">
      <Header />
      <main className="flex-1 w-full container mx-auto px-4 py-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <SendForm />
          <ReceiveForm />
        </div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} QuickShare. All rights reserved.</p>
      </footer>
    </div>
  );
}
