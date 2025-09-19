import { Header } from '@/components/header';
import { ReceiveForm } from '@/components/receive-form';
import { SendForm } from '@/components/send-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  return (
    <div className="flex flex-col min-h-dvh bg-background font-body">
      <Header />
      <main className="flex-1 w-full container mx-auto px-4 py-8">
        <Tabs defaultValue="share" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share">Share</TabsTrigger>
            <TabsTrigger value="receive">Receive</TabsTrigger>
          </TabsList>
          <TabsContent value="share">
            <SendForm />
          </TabsContent>
          <TabsContent value="receive">
            <ReceiveForm />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>MADE BY S1 BATCH</p>
      </footer>
    </div>
  );
}
