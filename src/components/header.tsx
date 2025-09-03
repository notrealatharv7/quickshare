import { QuickShareLogo } from './icons';

export function Header() {
  return (
    <header className="py-4 border-b">
      <div className="container mx-auto flex items-center gap-2">
        <QuickShareLogo className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          QuickShare
        </h1>
      </div>
    </header>
  );
}
