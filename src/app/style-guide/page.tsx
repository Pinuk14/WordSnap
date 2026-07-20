'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { CircularTimer } from '@/components/ui/CircularTimer';
import { useToast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';

export default function StyleGuide() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8 pb-32">
      <div className="max-w-4xl mx-auto space-y-16">
        <header className="mb-12">
          <h1 className="font-display text-4xl mb-4 text-primary drop-shadow-[4px_4px_0_#000]">UI Style Guide</h1>
          <p className="font-sans text-xl text-gray-300">Neo-Brutalism component library for WordSnap.</p>
        </header>

        {/* Buttons */}
        <section className="space-y-6">
          <h2 className="font-display text-2xl text-secondary drop-shadow-[2px_2px_0_#000]">Buttons</h2>
          <Card className="flex flex-wrap gap-6 items-center">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="success">Success</Button>
            <Button disabled>Disabled</Button>
            <Button loading>Loading...</Button>
          </Card>
        </section>

        {/* Inputs */}
        <section className="space-y-6">
          <h2 className="font-display text-2xl text-secondary drop-shadow-[2px_2px_0_#000]">Inputs</h2>
          <Card className="space-y-6 max-w-md">
            <Input label="Default Input" placeholder="Type here..." />
            <Input label="Valid Input" state="valid" defaultValue="Correct word" />
            <Input label="Invalid Input" state="invalid" errorText="Not in dictionary!" defaultValue="asdfg" />
            <Input label="Disabled Input" disabled placeholder="Can't touch this" />
          </Card>
        </section>

        {/* Badges */}
        <section className="space-y-6">
          <h2 className="font-display text-2xl text-secondary drop-shadow-[2px_2px_0_#000]">Badges</h2>
          <Card className="flex flex-wrap gap-4">
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="success">Success</Badge>
          </Card>
        </section>

        {/* Timers & Progress */}
        <section className="space-y-6">
          <h2 className="font-display text-2xl text-secondary drop-shadow-[2px_2px_0_#000]">Timers & Progress</h2>
          <Card className="flex flex-col gap-10">
            <div className="flex gap-8 items-end">
              <CircularTimer percentage={100} size={64} label="20s" />
              <CircularTimer percentage={50} size={80} label="10s" />
              <CircularTimer percentage={20} size={96} label="4s" />
            </div>
            
            <div className="space-y-6">
              <ProgressBar percentage={100} label="Health (Full)" variant="success" />
              <ProgressBar percentage={50} label="Health (Half)" variant="warning" />
              <ProgressBar percentage={15} label="Health (Critical)" variant="danger" />
              <ProgressBar percentage={75} label="XP Progress" variant="secondary" />
            </div>
          </Card>
        </section>

        {/* Avatars */}
        <section className="space-y-6">
          <h2 className="font-display text-2xl text-secondary drop-shadow-[2px_2px_0_#000]">Avatars</h2>
          <Card className="flex flex-wrap gap-6 items-end">
            <Avatar alt="Player 1" size="sm" />
            <Avatar alt="Player 2" size="md" />
            <Avatar alt="Player 3" size="lg" fallbackInitials="P3" />
            <Avatar alt="Image Avatar" size="lg" src="https://api.dicebear.com/7.x/pixel-art/svg?seed=John" />
          </Card>
        </section>

        {/* Interactive (Modal & Toasts) */}
        <section className="space-y-6">
          <h2 className="font-display text-2xl text-secondary drop-shadow-[2px_2px_0_#000]">Overlays & Toasts</h2>
          <Card className="flex flex-wrap gap-6">
            <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
            <Button onClick={() => addToast('Word submitted successfully!', 'success')} variant="success">Trigger Toast</Button>
            <Button onClick={() => addToast('Invalid word!', 'danger')} variant="danger">Error Toast</Button>
            <Button onClick={() => addToast('Almost out of time!', 'warning')} variant="secondary">Warning Toast</Button>
          </Card>
        </section>

        {/* Modal Instance */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title="GAME PAUSED"
          footer={
            <div className="flex justify-end gap-4">
              <Button variant="danger" onClick={() => setIsModalOpen(false)}>Quit</Button>
              <Button onClick={() => setIsModalOpen(false)}>Resume</Button>
            </div>
          }
        >
          <p className="mb-4">Are you sure you want to quit the current game? You will lose all your progress.</p>
        </Modal>

      </div>
    </main>
  );
}
