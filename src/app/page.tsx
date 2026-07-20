import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Home() {
  return (
    <main className="min-h-screen p-8 sm:p-20 flex flex-col items-center justify-center gap-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-display text-primary drop-shadow-[4px_4px_0_#000]">WORDSNAP</h1>
        <p className="text-xl">Real-time multiplayer word chain game.</p>
      </div>

      <Card className="max-w-md w-full space-y-6">
        <h2 className="text-xl font-display text-secondary mb-4 drop-shadow-[2px_2px_0_#000]">UI Components</h2>
        <div className="flex flex-col gap-4">
          <Button variant="primary">Primary Action</Button>
          <Button variant="secondary">Secondary Action</Button>
          <Button variant="danger">Danger Zone</Button>
          <Button variant="success">Success State</Button>
        </div>
      </Card>
    </main>
  );
}
